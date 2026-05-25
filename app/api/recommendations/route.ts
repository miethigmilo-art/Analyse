import { NextResponse } from 'next/server';
import { getStockQuote } from '@/lib/api/stocks';
import { cacheGet, cacheSet } from '@/lib/redis';

// ~150 stocks across all sectors — rankings are computed live from cached quotes
const UNIVERSE = [
  // ── Mega Cap Tech ──────────────────────────────────────────────
  'AAPL','MSFT','NVDA','GOOGL','GOOG','AMZN','META','TSLA','AVGO','ORCL',
  // ── Semiconductors ─────────────────────────────────────────────
  'AMD','INTC','QCOM','MRVL','TSM','ASML','MU','AMAT','LRCX','KLAC','TXN','ADI','MCHP','ON',
  // ── Cloud / SaaS / High Growth ─────────────────────────────────
  'PLTR','SNOW','CRWD','NET','DDOG','MDB','ZS','PANW','HUBS','WDAY','NOW','TEAM',
  'SHOP','MELI','SE','GRAB','UBER','LYFT','ABNB','DASH','RBLX','COIN',
  // ── Large Cap Growth ───────────────────────────────────────────
  'NFLX','SPOT','PINS','SNAP','TTD','ROKU','TWLO','OKTA','DOCN','PATH',
  // ── Finance ────────────────────────────────────────────────────
  'BRK-B','JPM','V','MA','BAC','GS','WFC','C','MS','BLK','AXP','PYPL','SQ','NU',
  // ── Healthcare & Pharma ────────────────────────────────────────
  'UNH','LLY','JNJ','ABBV','PFE','MRK','TMO','ABT','ISRG','REGN','VRTX','MRNA','BIIB',
  // ── Consumer ───────────────────────────────────────────────────
  'COST','WMT','HD','NKE','SBUX','DIS','MCD','YUM','BABA','PDD','JD',
  // ── Industrials & Defense ──────────────────────────────────────
  'CAT','DE','HON','RTX','LMT','GE','BA','UPS','FDX','DAL','AAL',
  // ── Energy ─────────────────────────────────────────────────────
  'XOM','CVX','SLB','COP','OXY','BP','SHEL','NEE','ENPH','FSLR',
  // ── REITs & Utilities ──────────────────────────────────────────
  'AMT','PLD','EQIX','O','SPG','DLR',
  // ── Materials & Commodities ────────────────────────────────────
  'NEM','FCX','AA','ALB','LIN','APD',
  // ── International ADRs ─────────────────────────────────────────
  'SAP','NVO','ASML','TM','SONY','BIDU','TCEHY','HSBC','RIO','BBL',
];

interface Quote {
  ticker: string; price: number; change: number; changePct: number;
  volume: number; marketCap: number; pe: number;
  week52High: number; week52Low: number; beta: number;
  name: string; sector: string;
}

function score52W(q: Quote): number {
  const range = (q.week52High || 0) - (q.week52Low || 0);
  if (!range) return 0.5;
  return Math.max(0, Math.min(1, (q.price - q.week52Low) / range));
}

function scorePE(pe: number): number {
  if (!pe || pe <= 0) return 0.3;
  if (pe < 8)  return 0.5;
  if (pe < 15) return 1.0;
  if (pe < 25) return 0.85;
  if (pe < 40) return 0.65;
  if (pe < 60) return 0.45;
  return 0.2;
}

function scoreMomentum(pct: number): number {
  return Math.max(0, Math.min(1, (pct + 5) / 10));
}

function scoreVolume(volume: number, marketCap: number): number {
  if (!marketCap || !volume) return 0;
  return Math.min(1, ((volume * 100) / marketCap) * 5);
}

export async function GET() {
  // Cache full result for 5 minutes — avoids re-scoring on every page load
  const cacheKey = 'recommendations:v2';
  const cached = await cacheGet<Record<string, Quote[]>>(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Fetch all quotes in parallel (individual quotes are cached 60s in Redis)
  const settled = await Promise.allSettled(UNIVERSE.map(t => getStockQuote(t)));

  const quotes: Quote[] = settled
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<Quote>).value)
    .filter(q => q && q.price > 0);

  const scored = quotes.map(q => {
    const momentum = scoreMomentum(q.changePct);
    const pe       = scorePE(q.pe);
    const w52      = score52W(q);
    const vol      = scoreVolume(q.volume, q.marketCap);
    const absMover = Math.abs(q.changePct || 0);
    return {
      q,
      trendingScore:  absMover * 0.55 + vol * 0.45,
      aiScore:        momentum * 0.35 + pe * 0.30 + w52 * 0.20 + vol * 0.15,
      growthScore:    Math.max(0, q.changePct || 0) * 0.5 + w52 * 0.3 + vol * 0.2,
      valueScore:     pe * 0.5 + momentum * 0.3 + (1 - w52) * 0.2,
      hedgeScore:     ((q.marketCap || 0) / 1e12) * 0.5 + momentum * 0.3 + w52 * 0.2,
    };
  });

  const top = (key: keyof typeof scored[0], n = 10) =>
    [...scored]
      .sort((a, b) => (b[key] as number) - (a[key] as number))
      .slice(0, n)
      .map(x => x.q);

  const result = {
    trending:    top('trendingScore'),
    aiPicks:     top('aiScore'),
    highGrowth:  top('growthScore'),
    undervalued: top('valueScore'),
    hedgeFunds:  top('hedgeScore'),
  };

  await cacheSet(cacheKey, result, 300); // 5 min cache
  return NextResponse.json(result);
}
