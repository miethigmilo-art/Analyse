export interface Position {
  id: string;
  ticker: string;
  name: string;
  type: string;
  quantity: number;
  avgPrice: number;
  currency: string;
  sector?: string | null;
  country?: string | null;
  addedAt: Date;
  updatedAt: Date;
}
import type { StockQuote } from "./stocks";

export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  portfolioScore: number;
  scoreBreakdown: {
    diversification: number;
    risk: number;
    growth: number;
    stability: number;
  };
  warnings: Warning[];
}

export interface Warning {
  id: string;
  type: "danger" | "warning" | "info";
  title: string;
  description: string;
}

export interface AllocationItem {
  name: string;
  value: number;
  percent: number;
  color: string;
}

export const ETF_HOLDINGS: Record<string, Record<string, number>> = {
  IWDA: {
    AAPL: 4.8, MSFT: 4.2, NVDA: 3.9, AMZN: 2.8, META: 2.1,
    GOOGL: 1.9, GOOG: 1.8, TSLA: 1.5, AVGO: 1.2, JPM: 1.1,
    "BRK.B": 1.0, LLY: 0.9, V: 0.9, UNH: 0.8, XOM: 0.8,
    ASML: 0.7, NVO: 0.7, SAP: 0.6, NESN: 0.6, NOVO: 0.5,
  },
  CSPX: {
    AAPL: 6.9, MSFT: 6.2, NVDA: 5.8, AMZN: 3.8, META: 2.8,
    GOOGL: 2.5, GOOG: 2.2, TSLA: 2.0, AVGO: 1.8, JPM: 1.5,
    "BRK.B": 1.4, LLY: 1.3, V: 1.2, UNH: 1.1, XOM: 1.0,
    PG: 0.9, MA: 0.9, HD: 0.8, CVX: 0.8, ABBV: 0.8,
  },
  EQQQ: {
    AAPL: 8.9, MSFT: 8.1, NVDA: 8.0, AMZN: 5.2, META: 4.1,
    GOOGL: 3.5, GOOG: 3.2, TSLA: 3.0, AVGO: 2.8, COST: 2.5,
    NFLX: 1.8, AMD: 1.6, ADBE: 1.4, CSCO: 1.2, PEP: 1.1,
    INTC: 0.9, CMCSA: 0.9, HON: 0.8, QCOM: 0.8, AMGN: 0.8,
  },
  VWCE: {
    AAPL: 4.5, MSFT: 4.0, NVDA: 3.7, AMZN: 2.6, META: 2.0,
    GOOGL: 1.8, GOOG: 1.7, TSLA: 1.4, AVGO: 1.1, JPM: 1.0,
    ASML: 0.8, NVO: 0.7, SAP: 0.6, TSM: 0.9, SAMSUNG: 0.5,
    "BRK.B": 0.9, LLY: 0.8, V: 0.8, UNH: 0.7, XOM: 0.7,
  },
  EMIM: {
    TSM: 5.2, "005930.KS": 3.8, RELIANCE: 1.8, TCS: 1.2, INFOSYS: 0.9,
    VALE3: 0.8, PETRO: 0.7, PING: 0.6, MEITUAN: 0.5, JD: 0.5,
    BABA: 0.8, PDD: 0.7, NIO: 0.3, LI: 0.3, XPEV: 0.3,
    ICICIBANK: 0.6, HDFCBANK: 0.5, ITUB4: 0.4, BBDC4: 0.4, CPALL: 0.3,
  },
};

const SECTOR_MAP: Record<string, string> = {
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology",
  GOOG: "Technology", META: "Technology", NVDA: "Technology",
  AMZN: "Consumer Discretionary", TSLA: "Consumer Discretionary",
  JPM: "Financials", "BRK.B": "Financials", V: "Financials",
  MA: "Financials", BAC: "Financials",
  LLY: "Healthcare", UNH: "Healthcare", JNJ: "Healthcare", PFE: "Healthcare",
  XOM: "Energy", CVX: "Energy",
  PG: "Consumer Staples", KO: "Consumer Staples", PEP: "Consumer Staples",
  HD: "Consumer Discretionary", COST: "Consumer Staples",
  AVGO: "Technology", ADBE: "Technology", CRM: "Technology",
  NFLX: "Communication", CMCSA: "Communication",
  AMD: "Technology", INTC: "Technology", QCOM: "Technology",
  IWDA: "ETF", CSPX: "ETF", EQQQ: "ETF", VWCE: "ETF", EMIM: "ETF",
  VTI: "ETF", VOO: "ETF", QQQ: "ETF", VGT: "ETF",
  BTC: "Crypto", ETH: "Crypto", BNB: "Crypto",
};

const COUNTRY_MAP: Record<string, string> = {
  AAPL: "USA", MSFT: "USA", GOOGL: "USA", GOOG: "USA", META: "USA",
  NVDA: "USA", AMZN: "USA", TSLA: "USA", JPM: "USA", "BRK.B": "USA",
  V: "USA", MA: "USA", LLY: "USA", UNH: "USA", XOM: "USA",
  PG: "USA", KO: "USA", HD: "USA", COST: "USA",
  ASML: "Netherlands", NESN: "Switzerland", NVO: "Denmark",
  SAP: "Germany", NOVO: "Denmark", TSM: "Taiwan",
  IWDA: "Global", CSPX: "USA", EQQQ: "USA", VWCE: "Global", EMIM: "Emerging",
};

export function calculatePortfolioMetrics(
  positions: Position[],
  quotes: Record<string, StockQuote>
): PortfolioMetrics {
  let totalValue = 0;
  let totalCost = 0;
  let dailyChange = 0;

  positions.forEach((pos) => {
    const quote = quotes[pos.ticker];
    const currentPrice = quote?.price ?? pos.avgPrice;
    const posValue = currentPrice * pos.quantity;
    const posCost = pos.avgPrice * pos.quantity;
    totalValue += posValue;
    totalCost += posCost;
    dailyChange += (quote?.change ?? 0) * pos.quantity;
  });

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;

  const scoreBreakdown = {
    diversification: scoreDiversification(positions),
    risk: scoreRisk(positions, quotes, totalValue),
    growth: scoreGrowth(positions, quotes, totalValue),
    stability: scoreStability(positions, quotes, totalValue),
  };
  const portfolioScore = Math.round(
    scoreBreakdown.diversification * 0.3 +
    scoreBreakdown.risk * 0.3 +
    scoreBreakdown.growth * 0.2 +
    scoreBreakdown.stability * 0.2
  );

  const warnings = generateWarnings(positions, quotes, totalValue);

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
    dailyChange,
    dailyChangePercent,
    portfolioScore,
    scoreBreakdown,
    warnings,
  };
}

function scoreDiversification(positions: Position[]): number {
  if (positions.length === 0) return 0;
  let score = 100;
  // Penalize too few positions
  if (positions.length < 5) score -= (5 - positions.length) * 10;
  // Type diversity
  const types = new Set(positions.map((p) => p.type));
  if (types.size === 1) score -= 15;
  // Country diversity
  const countries = new Set(
    positions.map((p) => p.country || COUNTRY_MAP[p.ticker] || "USA")
  );
  if (countries.size === 1) score -= 20;
  // Sector diversity
  const sectors = new Set(
    positions.map((p) => p.sector || SECTOR_MAP[p.ticker] || "Other")
  );
  if (sectors.size < 3) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function scoreRisk(
  positions: Position[],
  quotes: Record<string, StockQuote>,
  totalValue: number
): number {
  if (positions.length === 0 || totalValue === 0) return 50;
  let score = 80;
  // Concentration risk - top 3 positions
  const sorted = [...positions].sort((a, b) => {
    const aVal = (quotes[a.ticker]?.price ?? a.avgPrice) * a.quantity;
    const bVal = (quotes[b.ticker]?.price ?? b.avgPrice) * b.quantity;
    return bVal - aVal;
  });
  const top3Value = sorted.slice(0, 3).reduce((sum, p) => {
    return sum + (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity;
  }, 0);
  const top3Pct = (top3Value / totalValue) * 100;
  if (top3Pct > 70) score -= 30;
  else if (top3Pct > 50) score -= 15;
  // High beta
  const avgBeta = positions.reduce((sum, p) => sum + (quotes[p.ticker]?.beta ?? 1), 0) / positions.length;
  if (avgBeta > 1.5) score -= 20;
  else if (avgBeta > 1.2) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function scoreGrowth(
  positions: Position[],
  quotes: Record<string, StockQuote>,
  totalValue: number
): number {
  if (positions.length === 0) return 50;
  let score = 60;
  const techPositions = positions.filter((p) =>
    (p.sector || SECTOR_MAP[p.ticker] || "").includes("Technology")
  );
  if (techPositions.length > 0) score += 15;
  // Crypto gives growth potential
  const cryptoPositions = positions.filter((p) => p.type === "crypto");
  if (cryptoPositions.length > 0 && totalValue > 0) {
    const cryptoValue = cryptoPositions.reduce(
      (sum, p) => sum + (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity,
      0
    );
    if (cryptoValue / totalValue < 0.2) score += 10;
  }
  return Math.max(0, Math.min(100, score));
}

function scoreStability(
  positions: Position[],
  quotes: Record<string, StockQuote>,
  totalValue: number
): number {
  if (positions.length === 0) return 50;
  let score = 60;
  // ETFs increase stability
  const etfValue = positions
    .filter((p) => p.type === "etf")
    .reduce((sum, p) => sum + (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity, 0);
  if (totalValue > 0) {
    const etfPct = (etfValue / totalValue) * 100;
    if (etfPct > 50) score += 20;
    else if (etfPct > 25) score += 10;
  }
  // Dividend stocks
  const dividendStocks = positions.filter(
    (p) => (quotes[p.ticker]?.dividendYield ?? 0) > 0.02
  );
  if (dividendStocks.length > 0) score += 10;
  return Math.max(0, Math.min(100, score));
}

function generateWarnings(
  positions: Position[],
  quotes: Record<string, StockQuote>,
  totalValue: number
): Warning[] {
  const warnings: Warning[] = [];
  if (positions.length === 0 || totalValue === 0) return warnings;

  // Country concentration
  const countryValues: Record<string, number> = {};
  positions.forEach((p) => {
    const country = p.country || COUNTRY_MAP[p.ticker] || "USA";
    const val = (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity;
    countryValues[country] = (countryValues[country] || 0) + val;
  });
  const usaPercent = ((countryValues["USA"] || 0) / totalValue) * 100;
  if (usaPercent > 80) {
    warnings.push({
      id: "high-usa",
      type: "warning",
      title: "High US Concentration",
      description: `${usaPercent.toFixed(0)}% of your portfolio is in US assets. Consider adding international exposure.`,
    });
  }

  // Sector concentration
  const sectorValues: Record<string, number> = {};
  positions.forEach((p) => {
    const sector = p.sector || SECTOR_MAP[p.ticker] || "Other";
    const val = (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity;
    sectorValues[sector] = (sectorValues[sector] || 0) + val;
  });
  const techPercent = ((sectorValues["Technology"] || 0) / totalValue) * 100;
  if (techPercent > 40) {
    warnings.push({
      id: "high-tech",
      type: "warning",
      title: "Tech Sector Overweight",
      description: `${techPercent.toFixed(0)}% in Technology. Market volatility could impact your portfolio significantly.`,
    });
  }

  // Single position concentration
  positions.forEach((p) => {
    const val = (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity;
    const pct = (val / totalValue) * 100;
    if (pct > 25) {
      warnings.push({
        id: `concentration-${p.ticker}`,
        type: "danger",
        title: `Concentration Risk: ${p.ticker}`,
        description: `${p.ticker} represents ${pct.toFixed(0)}% of your portfolio. This creates significant single-asset risk.`,
      });
    }
  });

  // No bonds/cash
  const hasDefensive = positions.some(
    (p) => p.type === "cash" || (p.sector || "").includes("Utilities") || (p.sector || "").includes("Consumer Staples")
  );
  if (!hasDefensive && positions.length > 3) {
    warnings.push({
      id: "no-defensive",
      type: "info",
      title: "No Defensive Assets",
      description: "Consider adding bonds, cash, or defensive sectors (utilities, consumer staples) to reduce volatility.",
    });
  }

  return warnings;
}

export function getAssetAllocation(
  positions: Position[],
  quotes: Record<string, StockQuote>
): AllocationItem[] {
  const typeValues: Record<string, number> = {};
  let totalValue = 0;
  positions.forEach((p) => {
    const val = (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity;
    typeValues[p.type] = (typeValues[p.type] || 0) + val;
    totalValue += val;
  });
  const colors: Record<string, string> = {
    stock: "#4361ee",
    etf: "#00d4aa",
    crypto: "#7209b7",
    cash: "#f59e0b",
  };
  return Object.entries(typeValues).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value,
    percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    color: colors[type] || "#64748b",
  }));
}

export function getSectorAllocation(
  positions: Position[],
  quotes: Record<string, StockQuote>
): AllocationItem[] {
  const sectorValues: Record<string, number> = {};
  let totalValue = 0;
  positions.forEach((p) => {
    const sector = p.sector || SECTOR_MAP[p.ticker] || "Other";
    const val = (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity;
    sectorValues[sector] = (sectorValues[sector] || 0) + val;
    totalValue += val;
  });
  const colors = ["#4361ee", "#00d4aa", "#7209b7", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#ec4899", "#f97316", "#6366f1"];
  return Object.entries(sectorValues)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: colors[i % colors.length],
    }));
}

export function getCountryAllocation(
  positions: Position[],
  quotes: Record<string, StockQuote>
): AllocationItem[] {
  const countryValues: Record<string, number> = {};
  let totalValue = 0;
  positions.forEach((p) => {
    const country = p.country || COUNTRY_MAP[p.ticker] || "USA";
    const val = (quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity;
    countryValues[country] = (countryValues[country] || 0) + val;
    totalValue += val;
  });
  const colors = ["#4361ee", "#00d4aa", "#7209b7", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"];
  return Object.entries(countryValues)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: colors[i % colors.length],
    }));
}

export function calculateETFOverlap(
  positions: Position[]
): {
  combined: Record<string, number>;
  matrix: Record<string, Record<string, number>>;
  duplicates: Array<{ ticker: string; etfs: string[]; combinedWeight: number }>;
} {
  const etfPositions = positions.filter((p) => p.type === "etf" && ETF_HOLDINGS[p.ticker]);
  const combined: Record<string, number> = {};
  const matrix: Record<string, Record<string, number>> = {};

  etfPositions.forEach((p) => {
    const holdings = ETF_HOLDINGS[p.ticker] || {};
    Object.entries(holdings).forEach(([stock, weight]) => {
      combined[stock] = (combined[stock] || 0) + weight;
    });
  });

  // Overlap matrix
  etfPositions.forEach((p1) => {
    matrix[p1.ticker] = {};
    etfPositions.forEach((p2) => {
      if (p1.ticker === p2.ticker) {
        matrix[p1.ticker][p2.ticker] = 100;
        return;
      }
      const h1 = ETF_HOLDINGS[p1.ticker] || {};
      const h2 = ETF_HOLDINGS[p2.ticker] || {};
      const common = Object.keys(h1).filter((k) => k in h2);
      const overlapWeight = common.reduce(
        (sum, k) => sum + Math.min(h1[k], h2[k]),
        0
      );
      matrix[p1.ticker][p2.ticker] = Math.round(overlapWeight);
    });
  });

  // Find duplicates
  const duplicates: Array<{ ticker: string; etfs: string[]; combinedWeight: number }> = [];
  Object.entries(combined).forEach(([ticker, totalWeight]) => {
    const etfsContaining = etfPositions
      .filter((p) => ETF_HOLDINGS[p.ticker]?.[ticker])
      .map((p) => p.ticker);
    if (etfsContaining.length > 1 && totalWeight > 5) {
      duplicates.push({ ticker, etfs: etfsContaining, combinedWeight: totalWeight });
    }
  });

  return {
    combined,
    matrix,
    duplicates: duplicates.sort((a, b) => b.combinedWeight - a.combinedWeight),
  };
}

export const SAMPLE_POSITIONS = [
  { ticker: "IWDA", name: "iShares Core MSCI World", type: "etf", quantity: 150, avgPrice: 85.40, currency: "USD", sector: "ETF", country: "Global" },
  { ticker: "CSPX", name: "iShares Core S&P 500", type: "etf", quantity: 80, avgPrice: 520.00, currency: "USD", sector: "ETF", country: "USA" },
  { ticker: "NVDA", name: "NVIDIA Corporation", type: "stock", quantity: 25, avgPrice: 450.00, currency: "USD", sector: "Technology", country: "USA" },
  { ticker: "AAPL", name: "Apple Inc.", type: "stock", quantity: 40, avgPrice: 175.00, currency: "USD", sector: "Technology", country: "USA" },
  { ticker: "MSFT", name: "Microsoft Corp.", type: "stock", quantity: 20, avgPrice: 380.00, currency: "USD", sector: "Technology", country: "USA" },
  { ticker: "EQQQ", name: "Invesco NASDAQ-100", type: "etf", quantity: 30, avgPrice: 430.00, currency: "USD", sector: "ETF", country: "USA" },
  { ticker: "BTC", name: "Bitcoin", type: "crypto", quantity: 0.15, avgPrice: 45000, currency: "USD", sector: "Crypto", country: "Global" },
  { ticker: "JPM", name: "JPMorgan Chase", type: "stock", quantity: 30, avgPrice: 195.00, currency: "USD", sector: "Financials", country: "USA" },
];
