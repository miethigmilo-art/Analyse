import { NextResponse } from 'next/server';
import { getStockQuote, StockQuote } from '@/lib/api/stocks';
import { cacheGet, cacheSet } from '@/lib/redis';

// In-memory fallback when Redis isn't available
let memCache: { data: Record<string, StockQuote[]>; at: number } | null = null;
const MEM_TTL = 5 * 60 * 1000; // 5 min

// Curated universe — manageable size, all sectors
const UNIVERSE = [
  // Mega cap
  'AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','AVGO','ORCL','NFLX',
  // Semis
  'AMD','INTC','QCOM','MU','AMAT','TXN','LRCX','KLAC','MRVL','ASML',
  // Cloud/SaaS
  'NOW','CRM','ADBE','INTU','PLTR','SNOW','CRWD','NET','DDOG','MDB','ZS','PANW',
  // Growth tech
  'SHOP','UBER','ABNB','COIN','HOOD','SOFI','RBLX','ROKU','SNAP','PINS','TTD',
  // Finance
  'BRK-B','JPM','V','MA','BAC','GS','MS','BLK','AXP','SCHW','PYPL','NU','AFRM',
  // Healthcare
  'UNH','LLY','JNJ','ABBV','PFE','MRK','ISRG','REGN','VRTX','MRNA','AMGN','GILD',
  // Consumer
  'COST','WMT','HD','NKE','SBUX','MCD','CMG','DIS','LULU','TJX',
  // Industrials / Defense
  'CAT','DE','HON','GE','RTX','LMT','NOC','BA','UPS','FDX',
  // Energy
  'XOM','CVX','COP','OXY','SLB','NEE','ENPH','FSLR',
  // REITs / Materials
  'AMT','PLD','EQIX','O','NEM','FCX','ALB','LIN',
  // International ADRs
  'TSM','NVO','SAP','BABA','NIO','BIDU','TM','SONY','BP','SHEL',
  // Small caps / high volatility
  'RIVN','LCID','NKLA','PLUG','BLNK','CHPT','SPCE','GME','AMC',
  'IONQ','QUBT','SOUN','BBAI','MARA','RIOT','MSTR','CLSK',
  'CRSP','NTLA','BEAM','BNGO','OCGN','HIMS','SOFI',
];

interface Q extends StockQuote {}

function score52W(q: Q) {
  const r = (q.week52High || 0) - (q.week52Low || 0);
  if (!r) return 0.5;
  return Math.max(0, Math.min(1, (q.price - q.week52Low) / r));
}
function scorePE(pe: number) {
  if (!pe || pe <= 0) return 0.3;
  if (pe < 8)  return 0.5;
  if (pe < 15) return 1.0;
  if (pe < 25) return 0.85;
  if (pe < 40) return 0.65;
  if (pe < 60) return 0.45;
  return 0.2;
}
function scoreMom(pct: number) { return Math.max(0, Math.min(1, (pct + 5) / 10)); }
function scoreRelVol(vol: number, avg: number) {
  if (!avg || !vol) return 0.5;
  return Math.min(1, vol / avg);
}
function scoreSmall(q: Q) {
  const priceScore = q.price > 0 ? Math.max(0, 1 - q.price / 20) : 0;
  return priceScore * 0.25 + scoreMom(q.changePct) * 0.35 + scoreRelVol(q.volume, q.avgVolume) * 0.25 + score52W(q) * 0.15;
}

async function fetchAll(): Promise<Q[]> {
  // Individual parallel calls — Yahoo Finance v7 batch returns 401 without cookies
  const settled = await Promise.allSettled(UNIVERSE.map(t => getStockQuote(t)));
  return settled
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<Q>).value)
    .filter(q => q.price > 0.01);
}

export async function GET() {
  // 1. Check in-memory cache
  if (memCache && Date.now() - memCache.at < MEM_TTL) {
    return NextResponse.json(memCache.data);
  }
  // 2. Check Redis cache
  const redisCached = await cacheGet<Record<string, Q[]>>('recommendations:v5');
  if (redisCached) {
    memCache = { data: redisCached, at: Date.now() };
    return NextResponse.json(redisCached);
  }

  const quotes = await fetchAll();
  const large  = quotes.filter(q => (q.marketCap || 0) >= 1e9);
  const small  = quotes.filter(q => (q.marketCap || 0) < 1e9 || q.price < 10);

  const scored = (arr: Q[]) => arr.map(q => {
    const mom    = scoreMom(q.changePct);
    const pe     = scorePE(q.pe);
    const w52    = score52W(q);
    const rv     = scoreRelVol(q.volume, q.avgVolume);
    const abs    = Math.abs(q.changePct || 0);
    const size   = Math.min(1, Math.log10(Math.max(1, (q.marketCap || 1e7) / 1e9) + 1));
    return {
      q,
      trending:    abs * 0.5 + rv * 0.5,
      ai:          mom * 0.35 + pe * 0.30 + w52 * 0.20 + rv * 0.15,
      growth:      Math.max(0, q.changePct || 0) * 0.5 + w52 * 0.3 + rv * 0.2,
      value:       pe * 0.5 + mom * 0.25 + (1 - w52) * 0.25,
      hedge:       size * 0.5 + mom * 0.3 + w52 * 0.2,
      smallcap:    scoreSmall(q),
    };
  });

  const top = (arr: ReturnType<typeof scored>, key: keyof ReturnType<typeof scored>[0], n = 10) =>
    [...arr].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, n).map(x => x.q);

  const all   = scored(quotes);
  const lg    = scored(large);
  const sm    = scored(small);

  const result = {
    trending:    top(all, 'trending'),
    aiPicks:     top(all, 'ai'),
    highGrowth:  top(all, 'growth'),
    undervalued: top(all, 'value'),
    hedgeFunds:  top(lg,  'hedge'),
    smallCaps:   top(sm,  'smallcap'),
  };

  memCache = { data: result, at: Date.now() };
  await cacheSet('recommendations:v5', result, 300);
  return NextResponse.json(result);
}
