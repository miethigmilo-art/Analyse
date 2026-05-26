import { NextResponse } from "next/server";
import axios from "axios";

const BASE = process.env.TRADING212_MODE === "demo"
  ? "https://demo.trading212.com/api/v0"
  : "https://live.trading212.com/api/v0";

const cache = new Map<string, { data: unknown; at: number }>();
const CACHE_TTL = 60_000;

function getAuth() {
  const apiKey = (process.env.T212_API_KEY || process.env.TRADING212_API_KEY || "").trim();
  const secret = (process.env.T212_API_SECRET || process.env.TRADING212_SECRET || "").trim();
  if (!apiKey || !secret) throw new Error("T212_API_KEY or T212_API_SECRET not configured");
  const credentials = Buffer.from(`${apiKey}:${secret}`, "utf8").toString("base64");
  return { Authorization: `Basic ${credentials}` };
}

async function t212Fetch(endpoint: string) {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;
  const res = await axios.get(`${BASE}${endpoint}`, { headers: getAuth(), timeout: 12000 });
  cache.set(endpoint, { data: res.data, at: Date.now() });
  return res.data;
}

function mapPosition(p: Record<string, unknown>, inPie = false) {
  return {
    ticker:   String(p.ticker || p.fullName || "").replace(/_US_EQ|_EQ|_US/g, ""),
    name:     String(p.ticker || p.fullName || "").replace(/_US_EQ|_EQ|_US/g, ""),
    type:     "stock",
    quantity: Number(p.quantity) || 0,
    avgPrice: Number(p.averagePrice) || 0,
    currency: "USD",
    sector:   "",
    country:  "",
    inPie,
  };
}

export async function GET() {
  try {
    // Fetch regular positions + pies in parallel
    const [positionsRes, cashRes, piesRes] = await Promise.allSettled([
      t212Fetch("/equity/portfolio"),
      t212Fetch("/equity/account/cash"),
      t212Fetch("/equity/pies"),
    ]);

    if (positionsRes.status === "rejected") {
      const err = positionsRes.reason;
      const status  = axios.isAxiosError(err) ? (err.response?.status || 502) : 502;
      const message = axios.isAxiosError(err)
        ? JSON.stringify(err.response?.data ?? err.message)
        : String(err);
      return NextResponse.json({ error: `T212 (${status}): ${message}` });
    }

    // Regular positions
    const raw: Array<Record<string, unknown>> = positionsRes.value ?? [];
    const mapped = raw.map(p => mapPosition(p, false));

    // Pie positions
    if (piesRes.status === "fulfilled" && Array.isArray(piesRes.value)) {
      const pies: Array<Record<string, unknown>> = piesRes.value;
      for (const pie of pies) {
        const pieId = pie.id;
        if (!pieId) continue;
        try {
          const pieDetail = await t212Fetch(`/equity/pies/${pieId}`) as Record<string, unknown>;
          const instruments: Array<Record<string, unknown>> = (pieDetail.instruments as Array<Record<string, unknown>>) || [];
          for (const inst of instruments) {
            if (inst.ticker && (Number(inst.quantity) || 0) > 0) {
              mapped.push(mapPosition(inst, true));
            }
          }
        } catch { /* skip failed pie */ }
      }
    }

    return NextResponse.json({
      positions: mapped,
      cash: cashRes.status === "fulfilled" ? cashRes.value : null,
    });
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err)
      ? JSON.stringify(err.response?.data ?? err.message)
      : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await axios.get(`${BASE}/equity/portfolio`, { headers: getAuth(), timeout: 12000 });
    return NextResponse.json({ raw: res.data, type: typeof res.data, isArray: Array.isArray(res.data) });
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) ? JSON.stringify(err.response?.data ?? err.message) : String(err);
    return NextResponse.json({ error: msg });
  }
}
