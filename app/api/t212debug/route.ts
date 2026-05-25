import { NextResponse } from "next/server";
import axios from "axios";

const BASE = "https://live.trading212.com/api/v0";
const EP   = "/equity/account/info";

async function tryAuth(label: string, headers: Record<string, string>) {
  try {
    const r = await axios.get(BASE + EP, { headers, timeout: 8000 });
    return { label, ok: true, status: r.status, data: r.data };
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) return { label, ok: false, status: e.response?.status, body: e.response?.data };
    return { label, ok: false, msg: String(e) };
  }
}

export async function GET() {
  const id     = (process.env.TRADING212_CLIENT_ID || "").trim();
  const secret = (process.env.TRADING212_SECRET    || "").trim();
  const combined = Buffer.from(id + ":" + secret).toString("base64");

  const results = await Promise.all([
    tryAuth("secret_only",          { Authorization: secret }),
    tryAuth("id_only",              { Authorization: id }),
    tryAuth("bearer_secret",        { Authorization: "Bearer " + secret }),
    tryAuth("basic_id_secret",      { Authorization: "Basic " + combined }),
    tryAuth("id_header_secret_auth", { Authorization: secret, "X-Api-Key": id }),
    tryAuth("secret_header_id_auth", { Authorization: id,     "X-Api-Key": secret }),
  ]);

  return NextResponse.json({ id_prefix: id.slice(0,8), secret_prefix: secret.slice(0,6), results });
}
