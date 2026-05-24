import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getAnalystRatings, getInsiderTrades, getStockNews } from '@/lib/api/stocks';
import { analyzeStock } from '@/lib/ai/analyze';

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase();
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });

  try {
    const [quote, analyst, insider, news] = await Promise.allSettled([
      getStockQuote(ticker),
      getAnalystRatings(ticker),
      getInsiderTrades(ticker),
      getStockNews(ticker),
    ]);

    if (quote.status !== 'fulfilled' || !quote.value.price) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    const headlines = news.status === 'fulfilled'
      ? news.value.map(n => n.headline)
      : [];

    const analysis = await analyzeStock(
      quote.value,
      analyst.status === 'fulfilled' ? analyst.value : null,
      insider.status === 'fulfilled' ? insider.value : [],
      headlines,
    );

    return NextResponse.json({ ticker, analysis, quote: quote.value });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
