import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const T212_BASE = process.env.TRADING212_MODE === 'demo'
  ? 'https://demo.trading212.com/api/v0'
  : 'https://live.trading212.com/api/v0';

async function t212Fetch(endpoint: string) {
  const apiKey = (process.env.TRADING212_API_KEY || '').trim();
  const secret = (process.env.TRADING212_SECRET || '').trim();

  if (!secret) throw new Error('TRADING212_SECRET not configured');

  // Use Basic auth if both key and secret are present, otherwise raw secret as token
  const authHeader = apiKey
    ? 'Basic ' + Buffer.from(`${apiKey}:${secret}`).toString('base64')
    : secret;

  const headers: Record<string, string> = {
    'Authorization': authHeader,
    'Content-Type':  'application/json',
  };

  const res = await axios.get(`${T212_BASE}${endpoint}`, { headers, timeout: 12000 });
  return res.data;
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'portfolio';

  try {
    if (type === 'portfolio') {
      const [positions, cash] = await Promise.allSettled([
        t212Fetch('/equity/portfolio'),
        t212Fetch('/equity/account/cash'),
      ]);

      if (positions.status === 'rejected') {
        const err = positions.reason;
        const status  = axios.isAxiosError(err) ? (err.response?.status || 502) : 502;
        const message = axios.isAxiosError(err)
          ? JSON.stringify(err.response?.data ?? err.message)
          : String(err);
        return NextResponse.json({ error: `T212 (${status}): ${message}` });
      }

      return NextResponse.json({
        positions: positions.value ?? [],
        cash:      cash.status === 'fulfilled' ? cash.value : null,
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
    const status  = axios.isAxiosError(err) ? (err.response?.status || 502) : 500;
    const message = axios.isAxiosError(err)
      ? JSON.stringify(err.response?.data ?? err.message)
      : String(err);
    return NextResponse.json({ error: message }, { status });
  }
}
