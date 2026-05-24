// ──────────────────────────────────────────────────────────────
//  AI Stock Analyzer — OpenAI GPT-4o
// ──────────────────────────────────────────────────────────────
import OpenAI from 'openai';
import { cacheGet, cacheSet } from '../redis';
import type { StockQuote, AnalystRating, InsiderTrade } from '../api/stocks';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type Rating = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';

export interface AIAnalysisResult {
  rating:           Rating;
  score:            number;      // 0-100
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

export async function analyzeStock(
  quote:    StockQuote,
  analyst:  AnalystRating | null,
  insider:  InsiderTrade[],
  newsHeadlines: string[],
): Promise<AIAnalysisResult> {
  const cacheKey = `ai:analysis:${quote.ticker}`;
  const cached   = await cacheGet<AIAnalysisResult>(cacheKey);
  if (cached) return cached;

  const insiderSummary = insider.slice(0, 5).map(t =>
    `${t.name}: ${t.transactionType === 'P' ? 'BUY' : 'SELL'} ${Math.abs(t.shares).toLocaleString()} shares @ $${t.price}`
  ).join('\n') || 'No recent insider activity';

  const analystSummary = analyst
    ? `Strong Buy: ${analyst.strongBuy}, Buy: ${analyst.buy}, Hold: ${analyst.hold}, Sell: ${analyst.sell}, Strong Sell: ${analyst.strongSell}. Price target: $${analyst.targetMean.toFixed(0)} (range $${analyst.targetLow.toFixed(0)}-$${analyst.targetHigh.toFixed(0)})`
    : 'No analyst data available';

  const prompt = `You are a professional stock analyst. Analyze the following stock and provide a comprehensive investment rating.

Stock: ${quote.ticker} (${quote.name})
Sector: ${quote.sector}

PRICE DATA:
- Current: $${quote.price}
- Change today: ${quote.changePct > 0 ? '+' : ''}${quote.changePct.toFixed(2)}%
- 52W Range: $${quote.week52Low} - $${quote.week52High}

FUNDAMENTALS:
- Market Cap: $${(quote.marketCap / 1e9).toFixed(1)}B
- P/E Ratio: ${quote.pe > 0 ? quote.pe.toFixed(1) : 'N/A'}
- EPS: $${quote.eps}
- Beta: ${quote.beta}
- Dividend Yield: ${quote.dividendYield}%

ANALYST CONSENSUS:
${analystSummary}

INSIDER ACTIVITY (last 6 months):
${insiderSummary}

RECENT NEWS HEADLINES:
${newsHeadlines.slice(0, 5).join('\n') || 'No recent news'}

Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "rating": "Strong Buy|Buy|Hold|Sell|Strong Sell",
  "score": <0-100>,
  "summary": "<2-3 sentence summary>",
  "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "longTermOutlook": "<2-3 sentence 12-month outlook>",
  "dailyRating": "<1 sentence today's trading recommendation>",
  "priceTarget": <number>,
  "priceTargetLow": <number>,
  "priceTargetHigh": <number>,
  "sentiment": "bullish|bearish|neutral",
  "technicalScore": <0-100>,
  "fundamentalScore": <0-100>,
  "momentumScore": <0-100>,
  "riskLevel": "Low|Medium|High|Very High"
}`;

  try {
    const res = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens:  1000,
    });

    const content = res.choices[0]?.message?.content || '{}';
    const result  = JSON.parse(content) as AIAnalysisResult;

    await cacheSet(cacheKey, result, 3600); // 1h cache
    return result;
  } catch (err) {
    // Fallback if OpenAI fails
    const fallback: AIAnalysisResult = {
      rating:           'Hold',
      score:            50,
      summary:          `${quote.name} is currently trading at $${quote.price}. Analysis requires valid OpenAI API key.`,
      opportunities:    ['Configure OpenAI API key for full AI analysis'],
      risks:            ['API key not configured'],
      longTermOutlook:  'Configure OpenAI API key to enable AI-powered analysis.',
      dailyRating:      'No AI rating available — check API configuration.',
      priceTarget:      quote.price,
      priceTargetLow:   quote.price * 0.9,
      priceTargetHigh:  quote.price * 1.1,
      sentiment:        'neutral',
      technicalScore:   50,
      fundamentalScore: 50,
      momentumScore:    50,
      riskLevel:        'Medium',
    };
    return fallback;
  }
}

// ── Portfolio AI Risk Analysis ────────────────────────────────
export interface PortfolioRiskResult {
  overallRisk:     string;
  diversification: string;
  topRisks:        string[];
  recommendations: string[];
  summary:         string;
}

export async function analyzePortfolioRisk(positions: Array<{ ticker: string; value: number; pnlPct: number }>): Promise<PortfolioRiskResult> {
  if (!process.env.OPENAI_API_KEY || positions.length === 0) {
    return {
      overallRisk:     'Unknown',
      diversification: 'Unknown',
      topRisks:        [],
      recommendations: ['Add positions to analyze portfolio risk'],
      summary:         'No positions to analyze.',
    };
  }

  const cacheKey = `ai:portfolio:${positions.map(p => p.ticker).sort().join(',')}`;
  const cached   = await cacheGet<PortfolioRiskResult>(cacheKey);
  if (cached) return cached;

  const prompt = `Analyze this investment portfolio and provide risk assessment:

Positions:
${positions.map(p => `- ${p.ticker}: $${p.value.toFixed(0)} value, ${p.pnlPct >= 0 ? '+' : ''}${p.pnlPct.toFixed(1)}% P&L`).join('\n')}

Respond ONLY with valid JSON:
{
  "overallRisk": "Low|Medium|High|Very High",
  "diversification": "Poor|Fair|Good|Excellent",
  "topRisks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "summary": "<2-3 sentence portfolio summary>"
}`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, max_tokens: 500,
    });
    const result = JSON.parse(res.choices[0]?.message?.content || '{}') as PortfolioRiskResult;
    await cacheSet(cacheKey, result, 1800);
    return result;
  } catch {
    return { overallRisk: 'Unknown', diversification: 'Unknown', topRisks: [], recommendations: [], summary: 'Analysis failed.' };
  }
}
