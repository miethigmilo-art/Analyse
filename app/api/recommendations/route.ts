import { NextResponse } from 'next/server';
import { CURATED_STOCKS, getStockQuote } from '@/lib/api/stocks';

export async function GET() {
  const results: Record<string, unknown[]> = {};

  for (const [category, tickers] of Object.entries(CURATED_STOCKS)) {
    const quotes = await Promise.allSettled(tickers.map(t => getStockQuote(t)));
    results[category] = quotes
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<unknown>).value);
  }

  return NextResponse.json(results);
}
