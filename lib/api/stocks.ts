// ──────────────────────────────────────────────────────────────
//  Stock Data Aggregator
//  Pulls from Finnhub + Alpha Vantage + Polygon with fallbacks
// ──────────────────────────────────────────────────────────────
import axios from 'axios';
import { cacheGet, cacheSet } from '../redis';

const FINNHUB_KEY    = process.env.FINNHUB_KEY    || '';
const AV_KEY         = process.env.ALPHA_VANTAGE_KEY || '';
const POLYGON_KEY    = process.env.POLYGON_KEY    || '';

export interface StockQuote {
  ticker:        string;
  name:          string;
  price:         number;
  change:        number;
  changePct:     number;
  open:          number;
  high:          number;
  low:           number;
  volume:        number;
  marketCap:     number;
  pe:            number;
  eps:           number;
  week52High:    number;
  week52Low:     number;
  avgVolume:     number;
  beta:          number;
  dividendYield: number;
  sector:        string;
  industry:      string;
  description:   string;
  logoUrl:       string;
  analystRating: string;
  priceTarget:   number;
  revenue:       number;
  netIncome:     number;
  debtToEquity:  number;
  roe:           number;
}

export interface HistoricalBar {
  time:   number; // unix timestamp
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export interface NewsItem {
  id:        string;
  headline:  string;
  summary:   string;
  source:    string;
  url:       string;
  datetime:  number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface InsiderTrade {
  name:            string;
  title:           string;
  transactionType: string;
  shares:          number;
  price:           number;
  value:           number;
  date:            string;
}

export interface AnalystRating {
  period:       string;
  strongBuy:    number;
  buy:          number;
  hold:         number;
  sell:         number;
  strongSell:   number;
  targetMean:   number;
  targetMedian: number;
  targetHigh:   number;
  targetLow:    number;
}

// ── Quote ─────────────────────────────────────────────────────
export async function getStockQuote(ticker: string): Promise<StockQuote> {
  const cacheKey = `quote:${ticker}`;
  const cached = await cacheGet<StockQuote>(cacheKey);
  if (cached) return cached;

  // Try Yahoo Finance first (no key needed)
  let yahooData: Record<string, number | string> = {};
  try {
    const yRes = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
    );
    const r = yRes.data?.chart?.result?.[0];
    const meta = r?.meta || {};
    if (meta.regularMarketPrice > 0) {
      yahooData = {
        price:     meta.regularMarketPrice || 0,
        open:      meta.regularMarketOpen || 0,
        high:      meta.regularMarketDayHigh || 0,
        low:       meta.regularMarketDayLow || 0,
        volume:    meta.regularMarketVolume || 0,
        change:    meta.regularMarketChange || 0,
        changePct: meta.regularMarketChangePercent || 0,
        week52High: meta.fiftyTwoWeekHigh || 0,
        week52Low:  meta.fiftyTwoWeekLow  || 0,
        marketCap: meta.marketCap || 0,
        name:      meta.longName || meta.shortName || ticker,
        sector:    meta.exchangeName || 'Unknown',
      };
    }
  } catch { /* fall through */ }

  // Try Finnhub for additional data
  const [quoteRes, profileRes, metricsRes] = await Promise.allSettled([
    axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`),
    axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`),
    axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_KEY}`),
  ]);

  const q = quoteRes.status === 'fulfilled' ? quoteRes.value.data : {};
  const p = profileRes.status === 'fulfilled' ? profileRes.value.data : {};
  const m = metricsRes.status === 'fulfilled' ? metricsRes.value.data?.metric || {} : {};

  // Merge: prefer Yahoo for price, Finnhub for fundamentals/profile
  const price     = (q.c > 0 ? q.c : yahooData.price)     || 0;
  const change    = (q.d !== 0 ? q.d : yahooData.change)   || 0;
  const changePct = (q.dp !== 0 ? q.dp : yahooData.changePct) || 0;

  const result: StockQuote = {
    ticker:        ticker.toUpperCase(),
    name:          p.name || yahooData.name as string || ticker,
    price:         price as number,
    change:        change as number,
    changePct:     changePct as number,
    open:          q.o || yahooData.open  as number || 0,
    high:          q.h || yahooData.high  as number || 0,
    low:           q.l || yahooData.low   as number || 0,
    volume:        q.v || yahooData.volume as number || 0,
    marketCap:     p.marketCapitalization ? p.marketCapitalization * 1e6 : (yahooData.marketCap as number || 0),
    pe:            m['peBasicExclExtraTTM'] || 0,
    eps:           m['epsBasicExclExtraAnnual'] || 0,
    week52High:    m['52WeekHigh'] || yahooData.week52High as number || 0,
    week52Low:     m['52WeekLow']  || yahooData.week52Low  as number || 0,
    avgVolume:     m['10DayAverageTradingVolume'] ? m['10DayAverageTradingVolume'] * 1e6 : 0,
    beta:          m['beta'] || 0,
    dividendYield: m['dividendYieldIndicatedAnnual'] || 0,
    sector:        p.finnhubIndustry || 'Equity',
    industry:      p.finnhubIndustry || 'Equity',
    description:   p.description || '',
    logoUrl:       p.logo || `https://logo.clearbit.com/${p.weburl}`,
    analystRating: '',
    priceTarget:   0,
    revenue:       0,
    netIncome:     0,
    debtToEquity:  0,
    roe:           0,
  };

  if (result.price > 0) await cacheSet(cacheKey, result, 60);
  return result;
}

// ── Historical Bars ───────────────────────────────────────────
export async function getHistoricalData(ticker: string, from: number, to: number, resolution = 'D'): Promise<HistoricalBar[]> {
  const cacheKey = `hist:${ticker}:${resolution}:${from}`;
  const cached = await cacheGet<HistoricalBar[]>(cacheKey);
  if (cached) return cached;

  // Try Yahoo Finance first (no key needed, reliable free data)
  try {
    const range      = Math.round((to - from) / 86400) > 180 ? '1y' : '6mo';
    const yahooRes   = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
    );
    const result = yahooRes.data?.chart?.result?.[0];
    if (result?.timestamp?.length > 0) {
      const ts    = result.timestamp as number[];
      const q     = result.indicators?.quote?.[0] || {};
      const bars: HistoricalBar[] = ts.map((t: number, i: number) => ({
        time:   t,
        open:   q.open?.[i]   || 0,
        high:   q.high?.[i]   || 0,
        low:    q.low?.[i]    || 0,
        close:  q.close?.[i]  || 0,
        volume: q.volume?.[i] || 0,
      })).filter(b => b.close > 0);

      if (bars.length > 10) {
        await cacheSet(cacheKey, bars, 3600);
        return bars;
      }
    }
  } catch { /* fall through to Finnhub */ }

  // Fallback: Finnhub candles
  try {
    const res = await axios.get(
      `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
    const d = res.data;
    if (d.s !== 'ok' || !d.t) return [];

    const bars: HistoricalBar[] = d.t.map((t: number, i: number) => ({
      time:   t,
      open:   d.o[i],
      high:   d.h[i],
      low:    d.l[i],
      close:  d.c[i],
      volume: d.v[i],
    }));

    await cacheSet(cacheKey, bars, 3600);
    return bars;
  } catch { return []; }
}

// ── News ──────────────────────────────────────────────────────
export async function getStockNews(ticker: string): Promise<NewsItem[]> {
  const cacheKey = `news:${ticker}`;
  const cached = await cacheGet<NewsItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const today = new Date();
    const from  = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const to    = today.toISOString().split('T')[0];

    const res = await axios.get(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
    const news: NewsItem[] = (res.data || []).slice(0, 20).map((n: Record<string, unknown>) => ({
      id:        String(n.id),
      headline:  n.headline,
      summary:   n.summary,
      source:    n.source,
      url:       n.url,
      datetime:  n.datetime,
      sentiment: 'neutral' as const,
    }));

    await cacheSet(cacheKey, news, 1800);
    return news;
  } catch { return []; }
}

// ── Insider Trades ────────────────────────────────────────────
export async function getInsiderTrades(ticker: string): Promise<InsiderTrade[]> {
  const cacheKey = `insider:${ticker}`;
  const cached = await cacheGet<InsiderTrade[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await axios.get(
      `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${FINNHUB_KEY}`
    );
    const trades: InsiderTrade[] = (res.data?.data || []).slice(0, 20).map((t: Record<string, unknown>) => ({
      name:            String(t.name),
      title:           String(t.share || ''),
      transactionType: String(t.transactionCode),
      shares:          Number(t.change),
      price:           Number(t.transactionPrice),
      value:           Math.abs(Number(t.change) * Number(t.transactionPrice)),
      date:            String(t.transactionDate),
    }));

    await cacheSet(cacheKey, trades, 3600);
    return trades;
  } catch { return []; }
}

// ── Analyst Ratings ───────────────────────────────────────────
export async function getAnalystRatings(ticker: string): Promise<AnalystRating | null> {
  const cacheKey = `analyst:${ticker}`;
  const cached = await cacheGet<AnalystRating>(cacheKey);
  if (cached) return cached;

  try {
    const [recRes, targetRes] = await Promise.allSettled([
      axios.get(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FINNHUB_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/price-target?symbol=${ticker}&token=${FINNHUB_KEY}`),
    ]);

    const rec    = recRes.status    === 'fulfilled' ? recRes.value.data?.[0]    || {} : {};
    const target = targetRes.status === 'fulfilled' ? targetRes.value.data       || {} : {};

    const result: AnalystRating = {
      period:       rec.period       || '',
      strongBuy:    rec.strongBuy    || 0,
      buy:          rec.buy          || 0,
      hold:         rec.hold         || 0,
      sell:         rec.sell         || 0,
      strongSell:   rec.strongSell   || 0,
      targetMean:   target.targetMean   || 0,
      targetMedian: target.targetMedian || 0,
      targetHigh:   target.targetHigh   || 0,
      targetLow:    target.targetLow    || 0,
    };

    await cacheSet(cacheKey, result, 7200);
    return result;
  } catch { return null; }
}

// ── Search ────────────────────────────────────────────────────
export async function searchStocks(query: string): Promise<Array<{ ticker: string; name: string; type: string }>> {
  try {
    const res = await axios.get(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_KEY}`
    );
    return (res.data?.result || [])
      .filter((r: Record<string, unknown>) => r.type === 'Common Stock' || r.type === 'ETP')
      .slice(0, 8)
      .map((r: Record<string, unknown>) => ({
        ticker: String(r.symbol),
        name:   String(r.description),
        type:   String(r.type),
      }));
  } catch { return []; }
}

// ── Trending / Recommendations ────────────────────────────────

// ── Batch quote fetch (Yahoo Finance v7) ─────────────────────
// Fetches up to ~400 tickers in one HTTP call
export async function batchGetQuotes(tickers: string[]): Promise<StockQuote[]> {
  const CHUNK = 400;
  const results: StockQuote[] = [];

  for (let i = 0; i < tickers.length; i += CHUNK) {
    const chunk   = tickers.slice(i, i + CHUNK);
    const symbols = chunk.join(',');
    try {
      const res = await axios.get(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,marketCap,trailingPE,fiftyTwoWeekHigh,fiftyTwoWeekLow,averageDailyVolume3Month,beta`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }
      );
      const quotes = res.data?.quoteResponse?.result ?? [];
      for (const q of quotes) {
        if (!q.regularMarketPrice) continue;
        results.push({
          ticker:        q.symbol,
          name:          q.shortName || q.symbol,
          price:         q.regularMarketPrice      || 0,
          change:        q.regularMarketChange     || 0,
          changePct:     q.regularMarketChangePercent || 0,
          open:          q.regularMarketOpen       || 0,
          high:          q.regularMarketDayHigh    || 0,
          low:           q.regularMarketDayLow     || 0,
          volume:        q.regularMarketVolume     || 0,
          marketCap:     q.marketCap               || 0,
          pe:            q.trailingPE              || 0,
          eps:           0,
          week52High:    q.fiftyTwoWeekHigh        || 0,
          week52Low:     q.fiftyTwoWeekLow         || 0,
          avgVolume:     q.averageDailyVolume3Month || 0,
          beta:          q.beta                    || 0,
          dividendYield: q.trailingAnnualDividendYield || 0,
          sector:        q.sector                  || '',
          industry:      q.industry                || '',
          description:   '',
          logoUrl:       '',
          analystRating: '',
          priceTarget:   0,
          revenue:       0,
          netIncome:     0,
          debtToEquity:  0,
          roe:           0,
        });
      }
    } catch (e) {
      console.error('Batch quote chunk failed:', e);
    }
  }
  return results;
}

export const CURATED_STOCKS = {
  trending:    ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'META', 'AMZN', 'GOOGL', 'AMD'],
  undervalued: ['BRK-B', 'JPM', 'BAC', 'WFC', 'C', 'GS', 'V', 'MA'],
  highGrowth:  ['PLTR', 'SNOW', 'CRWD', 'NET', 'DDOG', 'MDB', 'ZS', 'PANW'],
  hedgeFunds:  ['MSFT', 'AMZN', 'META', 'GOOGL', 'NVDA', 'UNH', 'V', 'JNJ'],
  aiPicks:     ['NVDA', 'AMD', 'INTC', 'QCOM', 'MRVL', 'AVGO', 'TSM', 'ASML'],
};
