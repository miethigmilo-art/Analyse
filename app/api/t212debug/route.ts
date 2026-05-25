import { NextResponse } from 'next/server';
import axios from 'axios';

const T212_BASE = process.env.TRADING212_MODE === 'demo'
  ? 'https://demo.trading212.com/api/v0'
  : 'https://live.trading212.com/api/v0';

export async function GET() {
  const key = (process.env.TRADING212_API_KEY || '').trim();
  const results: Record<string, unknown> = {
    keyPresent: !!key,
    keyLength: key.length,
    keyPrefix: key ? key.slice(0, 8) + '...' : null,
    mode: process.env.TRADING212_MODE || 'live',
    base: T212_BASE,
  };

  for (const endpoint of ['/equity/portfolio', '/equity/account/cash', '/equity/account/info']) {
    try {
      const res = await axios.get(`${T212_BASE}${endpoint}`, {
        headers: { Authorization: key },
        timeout: 8000,
      });
      results[endpoint] = { status: res.status, data: res.data };
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        results[endpoint] = {
          error: true,
          status: e.response?.status,
          data: e.response?.data,
          message: e.message,
        };
      } else {
        results[endpoint] = { error: true, message: String(e) };
      }
    }
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
