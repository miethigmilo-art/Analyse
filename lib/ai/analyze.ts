import OpenAI from 'openai';
import { cacheGet, cacheSet } from '../redis';
import type { StockQuote, AnalystRating, InsiderTrade } from '../api/stocks';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'none' });

export type Rating = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';

export interface AIAnalysisResult {
  rating:           Rating;
  score:            number;
  summary:          string;
  opportunities:    string[];
  risks:            string[];
  longTermOutlook:  string;
  dailyRating:      string;
  priceTarget:      number;
  priceTargetLow:   number;
  priceTargetHigh:  number;
  sentiment:        'bullish' | 'bearish' | 'neutral';
  technicalScore:   number;
  fundamentalScore: number;
  momentumScore:    number;
  riskLevel:        'Low' | 'Medium' | 'High' | 'Very High';
}

// Rule-based fallback analysis when OpenAI is unavailable
function ruleBasedAnalysis(quote: StockQuote, analyst: AnalystRating | null): AIAnalysisResult {
  const { price, changePct, pe, beta, week52High, week52Low, marketCap } = quote;

  // Score components
  let score = 50;
  const opportunities: string[] = [];
  const risks: string[] = [];

  // Momentum from price change
  const momentumScore = Math.min(100, Math.max(0, 50 + changePct * 5));
  if (changePct > 1)  { score += 5; opportunities.push(`Strong daily momentum +${changePct.toFixed(1)}%`); }
  if (changePct < -2) { score -= 5; risks.push(`Negative daily momentum ${changePct.toFixed(1)}%`); }

  // 52-week position
  const range52 = week52High - week52Low;
  const pos52   = range52 > 0 ? (price - week52Low) / range52 : 0.5;
  if (pos52 > 0.8) { score += 5; opportunities.push('Trading near 52-week highs — strong trend'); }
  if (pos52 < 0.2) { score += 8; opportunities.push('Trading near 52-week lows — potential value entry'); }

  // Valuation
  let fundamentalScore = 50;
  if (pe > 0 && pe < 15)  { score += 8; fundamentalScore += 15; opportunities.push(`Low P/E ratio (${pe.toFixed(1)}) — potentially undervalued`); }
  if (pe > 50)             { score -= 5; fundamentalScore -= 10; risks.push(`High P/E ratio (${pe.toFixed(1)}) — growth expectations priced in`); }
  if (pe <= 0)             { risks.push('Negative earnings — company not yet profitable'); }

  // Risk from beta
  const riskLevel: AIAnalysisResult['riskLevel'] =
    beta < 0.8 ? 'Low' : beta < 1.2 ? 'Medium' : beta < 1.8 ? 'High' : 'Very High';
  if (beta > 1.5) risks.push(`High volatility (Beta ${beta.toFixed(2)}) — larger price swings expected`);

  // Analyst consensus
  if (analyst) {
    const total = analyst.strongBuy + analyst.buy + analyst.hold + analyst.sell + analyst.strongSell;
    const bullish = analyst.strongBuy + analyst.buy;
    if (total > 0) {
      const bullPct = bullish / total;
      if (bullPct > 0.7) { score += 10; opportunities.push(`Strong analyst consensus — ${bullish}/${total} analysts bullish`); }
      if (bullPct < 0.3) { score -= 10; risks.push(`Weak analyst sentiment — mostly Hold/Sell ratings`); }
      if (analyst.targetMean > price) {
        opportunities.push(`Analyst price target $${analyst.targetMean.toFixed(0)} — ${((analyst.targetMean/price-1)*100).toFixed(0)}% upside`);
      }
    }
  }

  // Large cap stability
  if (marketCap > 500e9) { score += 3; opportunities.push('Large-cap stability and institutional coverage'); }

  // Determine rating
  score = Math.min(100, Math.max(0, score));
  const rating: Rating =
    score >= 75 ? 'Strong Buy' :
    score >= 60 ? 'Buy'        :
    score >= 40 ? 'Hold'       :
    score >= 25 ? 'Sell'       : 'Strong Sell';

  const sentiment: AIAnalysisResult['sentiment'] =
    score >= 60 ? 'bullish' : score < 40 ? 'bearish' : 'neutral';

  const priceTarget     = analyst?.targetMean  || price * (1 + (score - 50) / 200);
  const priceTargetLow  = analyst?.targetLow   || priceTarget * 0.9;
  const priceTargetHigh = analyst?.targetHigh  || priceTarget * 1.1;

  if (opportunities.length === 0) opportunities.push('Monitor for entry opportunity');
  if (risks.length === 0)         risks.push('Standard market and sector risk');

  return {
    rating, score: Math.round(score), sentiment, riskLevel,
    opportunities: opportunities.slice(0, 3),
    risks:         risks.slice(0, 3),
    priceTarget:      parseFloat(priceTarget.toFixed(2)),
    priceTargetLow:   parseFloat(priceTargetLow.toFixed(2)),
    priceTargetHigh:  parseFloat(priceTargetHigh.toFixed(2)),
    technicalScore:   Math.round(momentumScore),
    fundamentalScore: Math.min(100, Math.max(0, Math.round(fundamentalScore))),
    momentumScore:    Math.round(momentumScore),
    summary: `${quote.name} (${quote.ticker}) is currently trading at $${price.toFixed(2)}, ${changePct >= 0 ? 'up' : 'down'} ${Math.abs(changePct).toFixed(2)}% today. ` +
             `Market cap: $${(marketCap/1e9).toFixed(1)}B. Rule-based score: ${Math.round(score)}/100. ` +
             (process.env.OPENAI_API_KEY ? 'OpenAI analysis unavailable — using rule-based fallback.' : 'Configure OPENAI_API_KEY for full AI analysis.'),
    longTermOutlook: `Based on fundamentals and analyst data, the stock shows a ${rating.toLowerCase()} signal. ` +
                     `Key factors: ${opportunities[0] || 'stable fundamentals'}. Risk level: ${riskLevel}.`,
    dailyRating: `Today's rule-based assessment: ${rating}. ${changePct >= 0 ? 'Positive' : 'Negative'} momentum with ${riskLevel.toLowerCase()} risk profile.`,
  };
}

export async function analyzeStock(
  quote:         StockQuote,
  analyst:       AnalystRating | null,
  insider:       InsiderTrade[],
  newsHeadlines: string[],
): Promise<AIAnalysisResult> {
  const cacheKey = `ai:analysis:${quote.ticker}`;
  const cached   = await cacheGet<AIAnalysisResult>(cacheKey);
  if (cached) return cached;

  // Try OpenAI first
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'none') {
    const insiderSummary = insider.slice(0, 5).map(t =>
      `${t.name}: ${t.transactionType === 'P' ? 'BUY' : 'SELL'} ${Math.abs(t.shares).toLocaleString()} shares @ $${t.price}`
    ).join('\n') || 'No recent insider activity';

    const analystSummary = analyst
      ? `Strong Buy: ${analyst.strongBuy}, Buy: ${analyst.buy}, Hold: ${analyst.hold}, Sell: ${analyst.sell}. Target: $${analyst.targetMean?.toFixed(0)}`
      : 'No analyst data';

    const prompt = `You are a professional stock analyst. Analyze ${quote.ticker} (${quote.name}).

Price: $${quote.price} (${quote.changePct >= 0 ? '+' : ''}${quote.changePct.toFixed(2)}% today)
Market Cap: $${(quote.marketCap/1e9).toFixed(1)}B | P/E: ${quote.pe > 0 ? quote.pe.toFixed(1) : 'N/A'} | Beta: ${quote.beta}
52W Range: $${quote.week52Low} - $${quote.week52High}
Analysts: ${analystSummary}
Insiders: ${insiderSummary}
News: ${newsHeadlines.slice(0,3).join(' | ') || 'None'}

Respond ONLY with valid JSON (no markdown):
{"rating":"Strong Buy|Buy|Hold|Sell|Strong Sell","score":75,"summary":"2-3 sentences","opportunities":["op1","op2","op3"],"risks":["r1","r2","r3"],"longTermOutlook":"2 sentences","dailyRating":"1 sentence","priceTarget":150,"priceTargetLow":130,"priceTargetHigh":170,"sentiment":"bullish|bearish|neutral","technicalScore":70,"fundamentalScore":65,"momentumScore":80,"riskLevel":"Low|Medium|High|Very High"}`;

    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, max_tokens: 800,
      });
      const content = res.choices[0]?.message?.content || '';
      const result  = JSON.parse(content) as AIAnalysisResult;
      await cacheSet(cacheKey, result, 3600);
      return result;
    } catch (err) {
      console.error('[AI] OpenAI failed, using rule-based fallback:', err instanceof Error ? err.message : err);
    }
  }

  // Rule-based fallback
  const result = ruleBasedAnalysis(quote, analyst);
  await cacheSet(cacheKey, result, 1800);
  return result;
}

export interface PortfolioRiskResult {
  overallRisk:     string;
  diversification: string;
  topRisks:        string[];
  recommendations: string[];
  summary:         string;
}

export async function analyzePortfolioRisk(
  positions: Array<{ ticker: string; value: number; pnlPct: number }>
): Promise<PortfolioRiskResult> {
  if (positions.length === 0) {
    return { overallRisk: 'Unknown', diversification: 'Unknown', topRisks: [], recommendations: ['Add positions to analyze'], summary: 'No positions.' };
  }
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  const avgPnl     = positions.reduce((s, p) => s + p.pnlPct, 0) / positions.length;
  const overallRisk = positions.length < 3 ? 'High' : positions.length < 6 ? 'Medium' : 'Low';
  return {
    overallRisk,
    diversification: positions.length >= 8 ? 'Good' : positions.length >= 4 ? 'Fair' : 'Poor',
    topRisks: [
      positions.length < 4 ? 'Low diversification — concentrated portfolio' : 'Sector concentration risk',
      avgPnl < -5 ? 'Portfolio showing significant losses' : 'Market volatility exposure',
      'Macro economic uncertainty',
    ],
    recommendations: [
      positions.length < 5 ? 'Consider diversifying across more positions' : 'Maintain current diversification',
      'Set stop-loss levels for each position',
      'Review positions regularly against AI analysis',
    ],
    summary: `Portfolio of ${positions.length} positions with total value $${totalValue.toFixed(0)}. Average P&L: ${avgPnl >= 0 ? '+' : ''}${avgPnl.toFixed(1)}%. Risk level: ${overallRisk}.`,
  };
}
