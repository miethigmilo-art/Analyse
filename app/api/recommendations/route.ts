import { NextResponse } from 'next/server';
import { batchGetQuotes } from '@/lib/api/stocks';
import { cacheGet, cacheSet } from '@/lib/redis';

// ── S&P 500 + Russell additions + International ADRs (~550 tickers) ──
const UNIVERSE = [
  // Mega Cap / FAANG+
  'AAPL','MSFT','NVDA','GOOGL','GOOG','AMZN','META','TSLA','AVGO','ORCL',
  // Semiconductors
  'AMD','INTC','QCOM','MRVL','MU','AMAT','LRCX','KLAC','TXN','ADI','MCHP','ON','SWKS','MPWR','WOLF',
  // Cloud & SaaS
  'NOW','CRM','ADBE','INTU','ANSS','CDNS','SNPS','VEEV','HUBS','WDAY','PAYC','PCTY','MANH',
  // High Growth Tech
  'PLTR','SNOW','CRWD','NET','DDOG','MDB','ZS','PANW','OKTA','TWLO','DOCN','PATH','AI','BBAI',
  'SHOP','MELI','SE','GRAB','UBER','LYFT','ABNB','DASH','RBLX','COIN','HOOD','SOFI',
  // Internet / Media
  'NFLX','SPOT','PINS','SNAP','TTD','ROKU','IAC','MTCH','BMBL','YELP',
  // Large Cap Tech
  'IBM','HPQ','HPE','DELL','STX','WDC','NTAP','PSTG','ANET','JNPR',
  // Finance / Banks
  'BRK-B','JPM','V','MA','BAC','GS','WFC','C','MS','BLK','AXP','SCHW','TFC','USB','PNC','COF',
  // Fintech
  'PYPL','SQ','NU','AFRM','UPST','LC','OPEN','MQ',
  // Insurance
  'CB','AIG','MET','PRU','ALL','TRV','HIG','AON','MMC',
  // Healthcare / Pharma
  'UNH','LLY','JNJ','ABBV','PFE','MRK','TMO','ABT','ISRG','REGN','VRTX','MRNA','BIIB',
  'BMY','AMGN','GILD','ILMN','IQV','IDXX','EW','STE','BDX','BSX','ZBH','RMD','ALGN',
  // Biotech
  'CRSP','NTLA','BEAM','EDIT','FATE','RXRX','SEER','ACAD',
  // Consumer Staples
  'COST','WMT','PG','KO','PEP','PM','MO','CL','GIS','K','CPB','HRL','SJM',
  // Consumer Discretionary
  'HD','LOW','TJX','ROST','DG','DLTR','NKE','LULU','TPR','RL','PVH','UA',
  'MCD','SBUX','YUM','DPZ','CMG','DRI','TXRH','EAT',
  'DIS','CMCSA','WBD','PARA','FOX','LYV',
  'AMZN','EBAY','ETSY','W','CVNA','AN','KMX',
  // Auto
  'TSLA','GM','F','RIVN','LCID','STLA','TM','HMC',
  // Industrials
  'CAT','DE','HON','MMM','EMR','ROK','ITW','PH','GE','ETN','IR','AME','FAST','GWW',
  // Aerospace & Defense
  'RTX','LMT','NOC','GD','BA','HEI','TDG','HII','KTOS','RKLB',
  // Transport & Logistics
  'UPS','FDX','DAL','UAL','AAL','JBLU','LUV','EXPD','XPO','ODFL','SAIA','JBHT',
  // Energy
  'XOM','CVX','SLB','COP','OXY','EOG','PXD','DVN','MPC','PSX','VLO','HAL','BKR',
  // Clean Energy
  'NEE','ENPH','FSLR','SEDG','RUN','NOVA','ARRY','SHLS','BE','PLUG','BLDP',
  // Utilities
  'NEE','DUK','SO','D','AEP','EXC','SRE','XEL','ES','WEC',
  // Real Estate / REITs
  'AMT','PLD','EQIX','O','SPG','DLR','PSA','EXR','AVB','EQR','INVH','MAA','UDR','ARE',
  // Materials
  'LIN','APD','SHW','ECL','NEM','FCX','AA','ALB','CF','MOS','NUE','STLD','RS',
  // Telecom
  'T','VZ','TMUS','LUMN','DISH',
  // International ADRs
  'TSM','ASML','SAP','NVO','BABA','JD','PDD','BIDU','NTES','TME',
  'TM','HMC','SONY','7203.T','SNY','RHHBY','NOVN','NESN',
  'BP','SHEL','RIO','BHP','BBL','ABB','ABBN',
  'HSBC','UBS','CS','DB','BCS','ING',
  'TCEHY','BYDDY','NIO','XPEV','LI','MNSO','TIGR',
  // ETF proxies for sector tracking
  // (excluded — no P/E etc.)
].filter((v, i, a) => a.indexOf(v) === i); // dedupe

interface Quote {
  ticker: string; price: number; change: number; changePct: number;
  volume: number; marketCap: number; pe: number;
  week52High: number; week52Low: number; beta: number;
  name: string; sector: string; avgVolume: number;
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

function scoreRelVolume(volume: number, avgVolume: number): number {
  if (!avgVolume || !volume) return 0.5;
  return Math.min(1, volume / avgVolume);
}

export async function GET() {
  const cacheKey = 'recommendations:v3';
  const cached = await cacheGet<Record<string, Quote[]>>(cacheKey);
  if (cached) return NextResponse.json(cached);

  // One batch call for all tickers
  const quotes = (await batchGetQuotes(UNIVERSE)) as Quote[];
  const valid   = quotes.filter(q => q.price > 0 && q.marketCap > 5e8); // min $500M market cap

  const scored = valid.map(q => {
    const momentum  = scoreMomentum(q.changePct);
    const pe        = scorePE(q.pe);
    const w52       = score52W(q);
    const relVol    = scoreRelVolume(q.volume, q.avgVolume);
    const absMover  = Math.abs(q.changePct || 0);
    const sizeFactor = Math.min(1, Math.log10((q.marketCap || 1e9) / 1e9) / 3);

    return {
      q,
      trendingScore:  absMover * 0.5 + relVol * 0.5,
      aiScore:        momentum * 0.35 + pe * 0.30 + w52 * 0.20 + relVol * 0.15,
      growthScore:    Math.max(0, q.changePct || 0) * 0.5 + w52 * 0.3 + relVol * 0.2,
      valueScore:     pe * 0.5 + momentum * 0.25 + (1 - w52) * 0.25,
      hedgeScore:     sizeFactor * 0.5 + momentum * 0.3 + w52 * 0.2,
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

  await cacheSet(cacheKey, result, 300);
  return NextResponse.json(result);
}
