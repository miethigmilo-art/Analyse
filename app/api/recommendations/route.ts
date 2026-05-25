import { NextResponse } from 'next/server';
import { batchGetQuotes } from '@/lib/api/stocks';
import { cacheGet, cacheSet } from '@/lib/redis';

// ── Universe: S&P 500 + Growth + Small Caps + Penny Stocks (~600 tickers) ──
const UNIVERSE = [
  // Mega Cap / FAANG+
  'AAPL','MSFT','NVDA','GOOGL','GOOG','AMZN','META','TSLA','AVGO','ORCL',
  // Semiconductors
  'AMD','INTC','QCOM','MRVL','MU','AMAT','LRCX','KLAC','TXN','ADI','MCHP','ON','SWKS','MPWR',
  // Cloud & SaaS
  'NOW','CRM','ADBE','INTU','ANSS','CDNS','SNPS','VEEV','HUBS','WDAY','PAYC','PCTY','MANH',
  // High Growth Tech
  'PLTR','SNOW','CRWD','NET','DDOG','MDB','ZS','PANW','OKTA','TWLO','DOCN','PATH','AI',
  'SHOP','MELI','SE','GRAB','UBER','LYFT','ABNB','DASH','RBLX','COIN','HOOD','SOFI',
  // Internet / Media
  'NFLX','SPOT','PINS','SNAP','TTD','ROKU',
  // Large Cap Tech
  'IBM','HPQ','HPE','DELL','STX','WDC','NTAP','PSTG','ANET','JNPR',
  // Finance
  'BRK-B','JPM','V','MA','BAC','GS','WFC','C','MS','BLK','AXP','SCHW','TFC','USB','PNC','COF',
  'PYPL','SQ','NU','AFRM','UPST','LC',
  // Insurance
  'CB','AIG','MET','PRU','ALL','TRV','HIG','AON','MMC',
  // Healthcare / Pharma
  'UNH','LLY','JNJ','ABBV','PFE','MRK','TMO','ABT','ISRG','REGN','VRTX','MRNA','BIIB',
  'BMY','AMGN','GILD','ILMN','IQV','IDXX','EW','STE','BDX','BSX','ZBH','RMD','ALGN',
  // Biotech mid cap
  'CRSP','NTLA','BEAM','EDIT','FATE','RXRX','ACAD','ARWR','IONS','ALNY','BMRN',
  // Consumer Staples
  'COST','WMT','PG','KO','PEP','PM','MO','CL','GIS','K',
  // Consumer Discretionary
  'HD','LOW','TJX','ROST','DG','NKE','LULU','MCD','SBUX','YUM','CMG','DRI',
  'DIS','CMCSA','LYV',
  // Auto
  'GM','F','RIVN','LCID','STLA',
  // Industrials
  'CAT','DE','HON','MMM','EMR','ROK','ITW','PH','GE','ETN','IR','AME','FAST','GWW',
  // Aerospace & Defense
  'RTX','LMT','NOC','GD','BA','HEI','TDG','KTOS','RKLB',
  // Transport
  'UPS','FDX','DAL','UAL','AAL','EXPD','XPO','ODFL','SAIA',
  // Energy
  'XOM','CVX','SLB','COP','OXY','EOG','MPC','PSX','VLO','HAL','BKR',
  // Clean Energy mid cap
  'NEE','ENPH','FSLR','SEDG','RUN','NOVA','ARRY','BE','PLUG','BLDP',
  // REITs
  'AMT','PLD','EQIX','O','SPG','DLR','PSA','EXR','AVB','EQR','ARE',
  // Materials
  'LIN','APD','SHW','ECL','NEM','FCX','AA','ALB','CF','MOS','NUE','STLD',
  // Telecom
  'T','VZ','TMUS',
  // International ADRs
  'TSM','ASML','SAP','NVO','BABA','JD','PDD','BIDU','NTES',
  'BP','SHEL','RIO','BHP','HSBC','UBS','DB','BCS','ING',
  'TCEHY','BYDDY','NIO','XPEV','LI','MNSO',

  // ── Small Caps & Penny Stocks ─────────────────────────────────
  // Meme / High Volatility
  'GME','AMC','BBBYQ','CLOV','WISH','XELA','BBIG','SPCE',
  // EV / Clean Energy Penny
  'MULN','NKLA','GOEV','RIDE','WKHS','FREY','BLNK','CHPT','EVGO','PTRA',
  'HYLN','AYRO','SOLO','KNDI','IDEX',
  // Biotech Penny (high risk / high reward)
  'SNDL','OCGN','HGEN','AGEN','AGIO','ADMA','AKBA','AMPIO','ATNX','AVEO',
  'BCRX','BNGO','CGEN','CLOV','CRTX','CVAC','CYCN','DARE','EDSA','EWTX',
  'FREQ','GEVO','HIMS','IMVT','INVA','IOVA','KALA','LGND','LQDA','MGNX',
  // Tech Penny
  'BBAI','OPEN','VNET','DIDI','TIGR','GOTU','DOYU','IQ','RLX',
  'IONQ','QUBT','ARQQ','QMCO','RGTI','SOUN','AEYE','OTRK','MARK',
  // Mining / Commodities Penny
  'GORO','GPL','ASM','EXK','PAAS','AG','CDE','HL','MUX','GFI','GOLD',
  // Cannabis
  'SNDL','CURLF','CCHW','AYRWF','TCNNF','GTBIF','HRVSF',
  // SPACs turned companies
  'HYMC','GREE','BTBT','MARA','RIOT','HUT','BITF','CIFR','CLSK',
  // Crypto-adjacent
  'COIN','HOOD','MSTR','SQ',
  // Small Cap Growth
  'VUZI','WULF','AEYE','NRDS','BWAY','JBSS','FLNC','STEM','OPAL',
  'MVST','AMPX','NXRT','ONON','BIRD','MNTK',
].filter((v, i, a) => a.indexOf(v) === i);

interface Quote {
  ticker: string; price: number; change: number; changePct: number;
  volume: number; marketCap: number; pe: number; avgVolume: number;
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
function scoreRelVolume(volume: number, avgVolume: number): number {
  if (!avgVolume || !volume) return 0.5;
  return Math.min(2, volume / avgVolume) / 2; // normalize to 0-1
}
function scoreSmallCap(q: Quote): number {
  // Favors: low price (<$10), high relative volume, positive momentum, high 52W position
  const priceScore  = q.price > 0 ? Math.max(0, 1 - q.price / 20) : 0; // best under $5
  const momentum    = scoreMomentum(q.changePct);
  const relVol      = scoreRelVolume(q.volume, q.avgVolume);
  const w52         = score52W(q);
  return priceScore * 0.25 + momentum * 0.35 + relVol * 0.25 + w52 * 0.15;
}

export async function GET() {
  const cacheKey = 'recommendations:v4';
  const cached = await cacheGet<Record<string, Quote[]>>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const quotes = (await batchGetQuotes(UNIVERSE)) as Quote[];
  // No market cap minimum — penny stocks allowed
  const valid = quotes.filter(q => q.price > 0.01);

  const largeCap  = valid.filter(q => q.marketCap >= 1e9);  // $1B+
  const smallCap  = valid.filter(q => q.marketCap < 1e9);   // under $1B

  const score = (arr: Quote[]) => arr.map(q => {
    const momentum = scoreMomentum(q.changePct);
    const pe       = scorePE(q.pe);
    const w52      = score52W(q);
    const relVol   = scoreRelVolume(q.volume, q.avgVolume);
    const absMover = Math.abs(q.changePct || 0);
    const sizeFactor = Math.min(1, Math.log10(Math.max(1, (q.marketCap || 1e7) / 1e9) + 1) / 1);
    return {
      q,
      trendingScore:  absMover * 0.5 + relVol * 0.5,
      aiScore:        momentum * 0.35 + pe * 0.30 + w52 * 0.20 + relVol * 0.15,
      growthScore:    Math.max(0, q.changePct || 0) * 0.5 + w52 * 0.3 + relVol * 0.2,
      valueScore:     pe * 0.5 + momentum * 0.25 + (1 - w52) * 0.25,
      hedgeScore:     sizeFactor * 0.5 + momentum * 0.3 + w52 * 0.2,
      smallCapScore:  scoreSmallCap(q),
    };
  });

  const scoredAll   = score(valid);
  const scoredSmall = score(smallCap);

  const top = (arr: typeof scoredAll, key: keyof typeof scoredAll[0], n = 10) =>
    [...arr].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, n).map(x => x.q);

  const result = {
    trending:    top(scoredAll,   'trendingScore'),
    aiPicks:     top(scoredAll,   'aiScore'),
    highGrowth:  top(scoredAll,   'growthScore'),
    undervalued: top(scoredAll,   'valueScore'),
    hedgeFunds:  top(score(largeCap), 'hedgeScore'),
    smallCaps:   top(scoredSmall, 'smallCapScore'),
  };

  await cacheSet(cacheKey, result, 300);
  return NextResponse.json(result);
}
