import { NextResponse } from 'next/server';
import axios from 'axios';

const BASE = process.env.TRADING212_MODE === 'demo'
  ? 'https://demo.trading212.com/api/v0'
  : 'https://live.trading212.com/api/v0';

export async function GET() {
  const secret = (process.env.TRADING212_SECRET || '').trim();
  const result: Record<string, unknown> = {
    secretPresent: !!secret,
    secretLength:  secret.length,
    secretPrefix:  secret ? secret.slice(0, 6) + '...' : null,
    mode:          process.env.TRADING212_MODE || 'live',
    base:          BASE,
  };

  for (const ep of ['/equity/portfolio', '/equity/account/cash', '/equity/account/info']) {
    try {
      const r = await axios.get(`${BASE}${ep}`, {
        headers: { Authorization: secret },
        timeout: 10000,
      });
      result[ep] = { status: r.status, data: r.data };
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        result[ep] = { error: true, status: e.response?.status, body: e.response?.data, msg: e.message };
      } else {
        result[ep] = { error: true, msg: String(e) };
      }
    }
  }
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
