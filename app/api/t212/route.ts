import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const T212_BASE = process.env.TRADING212_MODE === 'demo'
  ? 'https://demo.trading212.com/api/v0'
  : 'https://live.trading212.com/api/v0';

async function t212Fetch(endpoint: string) {
  const key = (process.env.TRADING212_API_KEY || '').trim();
  if (!key) throw new Error('TRADING212_API_KEY not configured');

  const res = await axios.get(`${T212_BASE}${endpoint}`, {
    headers: { Authorization: key, 'X-Api-Key': key },
    timeout: 10000,
  });
  return res.data;
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'portfolio';

  try {
    if (type === 'portfolio') {
      const [positions, cash] = await Promise.allSettled([
        t212Fetch('/equity/positions'),
        t212Fetch('/equity/account/cash'),
      ]);

      return NextResponse.json({
        positions: positions.status === 'fulfilled' ? positions.value : [],
        cash:      cash.status      === 'fulfilled' ? cash.value      : null,
      });
    }

    if (type === 'orders') {
      const data = await t212Fetch('/equity/history/orders?limit=50');
      return NextResponse.json(data);
    }

    if (type === 'info') {
      const data = await t212Fetch('/equity/account/info');
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? (err.response?.status || 502) : 500;
    const message = axios.isAxiosError(err) ? (err.response?.data || err.message) : String(err);
    return NextResponse.json({ error: message }, { status });
  }
}
