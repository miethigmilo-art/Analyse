import { NextResponse } from "next/server";
import axios from "axios";

const BASE = process.env.TRADING212_MODE === "demo"
  ? "https://demo.trading212.com/api/v0"
  : "https://live.trading212.com/api/v0";

async function t212Fetch(endpoint: string) {
  const secret = (process.env.TRADING212_SECRET || "").trim();
  if (!secret) throw new Error("TRADING212_SECRET not configured");
  const res = await axios.get(`${BASE}${endpoint}`, {
    headers: { Authorization: secret },
    timeout: 12000,
  });
  return res.data;
}

export async function GET() {
  try {
    const [positions, cash] = await Promise.allSettled([
      t212Fetch("/equity/portfolio"),
      t212Fetch("/equity/account/cash"),
    ]);

    if (positions.status === "rejected") {
      const err = positions.reason;
      const status  = axios.isAxiosError(err) ? (err.response?.status || 502) : 502;
      const message = axios.isAxiosError(err)
        ? JSON.stringify(err.response?.data ?? err.message)
        : String(err);
      return NextResponse.json({ error: `T212 (${status}): ${message}` });
    }

    // Map T212 positions to our Position format
    const raw: Array<Record<string, unknown>> = positions.value ?? [];
    const mapped = raw.map((p) => ({
      ticker:   String(p.ticker || "").replace(/_US_EQ|_EQ|_US/g, ""),
      name:     String(p.ticker || "").replace(/_US_EQ|_EQ|_US/g, ""),
      type:     "stock",
      quantity: Number(p.quantity) || 0,
      avgPrice: Number(p.averagePrice) || 0,
      currency: "USD",
      sector:   "",
      country:  "",
    }));

    return NextResponse.json({
      positions: mapped,
      cash: cash.status === "fulfilled" ? cash.value : null,
    });
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err)
      ? JSON.stringify(err.response?.data ?? err.message)
      : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
