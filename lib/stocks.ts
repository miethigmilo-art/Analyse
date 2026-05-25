import axios from "axios";

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  beta?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  name?: string;
}

export interface HistoricalData {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

const YAHOO_BASE = "https://query1.finance.yahoo.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
};

export async function fetchQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const res = await axios.get(
      `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
      { headers: HEADERS, timeout: 8000 }
    );
    const chart = res.data?.chart?.result?.[0];
    if (!chart) return null;
    const meta = chart.meta;
    const quotes = chart.indicators?.quote?.[0];
    const closes = quotes?.close || [];
    const validCloses = closes.filter((c: number | null) => c != null);
    const currentPrice = meta.regularMarketPrice || validCloses[validCloses.length - 1] || 0;
    const prevClose = meta.previousClose || meta.chartPreviousClose || validCloses[validCloses.length - 2] || currentPrice;
    const change = currentPrice - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
      ticker,
      price: currentPrice,
      change,
      changePercent,
      volume: meta.regularMarketVolume,
      marketCap: meta.marketCap,
      beta: meta.beta,
      dividendYield: meta.trailingAnnualDividendYield,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      name: meta.shortName || meta.longName || ticker,
    };
  } catch {
    return null;
  }
}

export async function fetchHistorical(
  ticker: string,
  range: "5d" | "1mo" | "3mo" | "1y" = "1mo"
): Promise<HistoricalData[]> {
  try {
    const intervalMap: Record<string, string> = {
      "5d": "1d",
      "1mo": "1d",
      "3mo": "1d",
      "1y": "1wk",
    };
    const interval = intervalMap[range];
    const res = await axios.get(
      `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`,
      { headers: HEADERS, timeout: 8000 }
    );
    const chart = res.data?.chart?.result?.[0];
    if (!chart) return [];
    const timestamps: number[] = chart.timestamps || [];
    const quotes = chart.indicators?.quote?.[0] || {};
    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      close: quotes.close?.[i] ?? 0,
      open: quotes.open?.[i],
      high: quotes.high?.[i],
      low: quotes.low?.[i],
      volume: quotes.volume?.[i],
    })).filter((d) => d.close > 0);
  } catch {
    return [];
  }
}

export async function fetchMultipleQuotes(
  tickers: string[]
): Promise<Record<string, StockQuote>> {
  const results = await Promise.allSettled(tickers.map((t) => fetchQuote(t)));
  const quotes: Record<string, StockQuote> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      quotes[tickers[i]] = r.value;
    }
  });
  return quotes;
}
