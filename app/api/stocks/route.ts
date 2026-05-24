import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getAnalystRatings, getInsiderTrades, getHistoricalData, getStockNews } from '@/lib/api/stocks';

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase();
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });

  try {
    const to   = Math.floor(Date.now() / 1000);
    const from = to - 365 * 86400;

    const [quote, analyst, insider, history, news] = await Promise.allSettled([
      getStockQuote(ticker),
      getAnalystRatings(ticker),
      getInsiderTrades(ticker),
      getHistoricalData(ticker, from, to),
      getStockNews(ticker),
    ]);

    return NextResponse.json({
      quote:   quote.status   === 'fulfilled' ? quote.value   : null,
      analyst: analyst.status === 'fulfilled' ? analyst.value : null,
      insider: insider.status === 'fulfilled' ? insider.value : [],
      history: history.status === 'fulfilled' ? history.value : [],
      news:    news.status    === 'fulfilled' ? news.value    : [],
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
