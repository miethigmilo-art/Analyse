import { NextResponse } from 'next/server';
import { getStockQuote } from '@/lib/api/stocks';

// Large universe — rankings are computed dynamically from live data
const UNIVERSE = [
  // Mega cap tech
  'AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','AVGO',
  // Semiconductors
  'AMD','INTC','QCOM','MRVL','TSM','ASML','MU','AMAT',
  // High growth / cloud
  'PLTR','SNOW','CRWD','NET','DDOG','MDB','ZS','PANW','SHOP','MELI',
  // Finance / value
  'BRK-B','JPM','V','MA','BAC','GS','WFC','C',
  // Healthcare / defensive
  'UNH','JNJ','LLY','ABBV','PFE','MRK',
  // Consumer / other
  'COST','WMT','HD','NKE','SBUX','DIS',
];

interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: number;
  pe: number;
  week52High: number;
  week52Low: number;
  beta: number;
  name: string;
  sector: string;
}

function score52W(q: Quote): number {
  // 0-1: how close to 52W high
  const range = q.week52High - q.week52Low;
  if (!range) return 0.5;
  return (q.price - q.week52Low) / range;
}

function scorePE(pe: number): number {
  // Good P/E: 10-30 for value, penalise extremes
  if (!pe || pe <= 0) return 0;
  if (pe < 5)  return 0.2;
  if (pe < 15) return 1.0;
  if (pe < 25) return 0.85;
  if (pe < 40) return 0.65;
  if (pe < 60) return 0.45;
  return 0.2;
}

function scoreMomentum(pct: number): number {
  // Positive momentum: -5% to +5% mapped 0-1
  return Math.max(0, Math.min(1, (pct + 5) / 10));
}

function scoreVolume(volume: number, marketCap: number): number {
  // Relative volume (volume / marketCap as proxy for unusual activity)
  if (!marketCap) return 0;
  const ratio = (volume * 100) / marketCap; // rough turnover %
  return Math.min(1, ratio * 5);
}

function computeScores(quotes: Quote[]) {
  return quotes.map(q => {
    const momentum  = scoreMomentum(q.changePct);
    const pe        = scorePE(q.pe);
    const w52       = score52W(q);
    const vol       = scoreVolume(q.volume, q.marketCap);
    const absMover  = Math.abs(q.changePct);

    return {
      q,
      trendingScore:    absMover * 0.6 + vol * 0.4,
      aiScore:          momentum * 0.35 + pe * 0.3 + w52 * 0.2 + vol * 0.15,
      growthScore:      (q.changePct > 0 ? q.changePct : 0) * 0.5 + w52 * 0.3 + vol * 0.2,
      valueScore:       pe * 0.5 + momentum * 0.3 + (1 - w52) * 0.2,
      hedgeScore:       (q.marketCap / 1e12) * 0.5 + momentum * 0.3 + w52 * 0.2,
    };
  });
}

export async function GET() {
  // Fetch all quotes in parallel (batch)
  const settled = await Promise.allSettled(
    UNIVERSE.map(t => getStockQuote(t))
  );

  const quotes: Quote[] = settled
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<Quote>).value)
    .filter(q => q && q.price > 0);

  const scored = computeScores(quotes);
  const top = (arr: typeof scored, key: keyof typeof arr[0], n = 8) =>
    [...arr].sort((a, b) => (b[key] as number) - (a[key] as number))
            .slice(0, n)
            .map(x => x.q);

  return NextResponse.json({
    trending:    top(scored, 'trendingScore'),
    aiPicks:     top(scored, 'aiScore'),
    highGrowth:  top(scored, 'growthScore'),
    undervalued: top(scored, 'valueScore'),
    hedgeFunds:  top(scored, 'hedgeScore'),
  });
}
