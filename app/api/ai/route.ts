import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SAMPLE_POSITIONS, calculatePortfolioMetrics, getAssetAllocation, getSectorAllocation } from "@/lib/analysis";
import { fetchMultipleQuotes } from "@/lib/stocks";
import type { Position } from "@/lib/analysis";

function ruleBasedResponse(message: string, portfolioContext: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("risk") || msg.includes("risky")) {
    return `Based on your portfolio analysis:\n\n${portfolioContext}\n\nYour portfolio shows a moderate-to-high risk profile. The key risk factors are:\n• Technology sector concentration\n• High US market exposure\n• Individual stock positions\n\n**Recommendations:**\n1. Consider reducing single-stock exposure to below 10% per position\n2. Add emerging market ETFs for geographic diversification\n3. Consider defensive sectors like utilities or consumer staples\n4. A small bond allocation (10-15%) could reduce overall volatility`;
  }
  if (msg.includes("overlap") || msg.includes("etf")) {
    return `Looking at your ETF holdings:\n\n${portfolioContext}\n\nETF overlap is a common issue. Here's what I found:\n• IWDA and CSPX share ~70% overlap in their top holdings\n• Both hold significant Apple, Microsoft, and NVIDIA positions\n• EQQQ amplifies your tech exposure further\n\n**Recommendations:**\n1. Consider replacing CSPX with an ex-USA ETF like EXUS\n2. Or use VWCE (global) instead of IWDA + CSPX combination\n3. EQQQ adds pure tech exposure — keep only if intentional`;
  }
  if (msg.includes("optimiz") || msg.includes("improve") || msg.includes("better")) {
    return `Portfolio Optimization Analysis:\n\n${portfolioContext}\n\n**Top Optimization Opportunities:**\n\n1. **Reduce ETF overlap** — Your IWDA/CSPX combination duplicates 70% of holdings\n2. **Add international exposure** — Consider EMIM or EXUS for true diversification\n3. **Sector balance** — Add healthcare (VHT) or consumer staples\n4. **Consider profit-taking** on positions >30% gains\n5. **Rebalance quarterly** — Maintain target allocations\n\n**Quick wins:**\n• Replace CSPX with EXUS (ex-USA developed markets)\n• Add a small EMIM position (5-10%) for emerging markets\n• Set stop-losses on individual stocks at -20%`;
  }
  if (msg.includes("divid") || msg.includes("income")) {
    return `Dividend & Income Analysis:\n\n${portfolioContext}\n\nYour portfolio appears growth-oriented with limited dividend income.\n\n**Current estimated dividend yield:** ~0.8-1.2%\n\n**To improve income:**\n1. Add dividend ETFs like VHYD (Vanguard Global High Dividend)\n2. Consider REITs for real estate income exposure\n3. JPMorgan in your portfolio pays ~2.5% dividend\n4. Target 2-3% overall yield for balance between growth and income\n\n**Warning:** Don't chase yield at the expense of quality. Focus on dividend growth rather than high current yield.`;
  }
  if (msg.includes("crypto") || msg.includes("bitcoin") || msg.includes("btc")) {
    return `Crypto Allocation Analysis:\n\n${portfolioContext}\n\nCryptocurrency is highly volatile but can improve portfolio returns if sized correctly.\n\n**General guidelines:**\n• 1-5% crypto for conservative investors\n• 5-15% for moderate risk tolerance\n• Never more than 20% unless crypto is your core thesis\n\n**Your crypto exposure:** Check your current allocation in the Analysis tab.\n\n**Bitcoin vs Altcoins:**\n• BTC is the safest crypto (most established)\n• ETH adds smart contract exposure\n• Avoid speculative altcoins unless you understand the technology\n\n**Tax note:** Crypto gains are typically taxed as capital gains.`;
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return `Hello! I'm your Portfolio Intelligence AI Advisor. 👋\n\nI can help you with:\n• **Risk Analysis** — How risky is your portfolio?\n• **ETF Overlap** — Are you double-exposed?\n• **Optimization** — How to improve returns\n• **Sector/Country diversification**\n• **Dividend income** strategies\n• **Crypto allocation** advice\n\nWhat would you like to explore about your portfolio?`;
  }

  return `I analyzed your portfolio:\n\n${portfolioContext}\n\nHere are my key observations:\n\n1. **Diversification:** Your portfolio has a mix of ETFs and individual stocks, which is generally good.\n2. **Technology exposure:** Tech appears to be your largest sector allocation — monitor for volatility.\n3. **Geographic exposure:** Your portfolio is primarily US-focused.\n\n**What I can help with:**\n• Ask about specific positions\n• Portfolio risk analysis\n• ETF overlap detection\n• Optimization strategies\n• Dividend income planning\n\nWhat specific aspect would you like to analyze?`;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    let positions: Position[] = [];
    try {
      positions = await prisma.position.findMany();
      if (positions.length === 0) positions = SAMPLE_POSITIONS as unknown as Position[];
    } catch {
      positions = SAMPLE_POSITIONS as unknown as Position[];
    }

    const tickers = [...new Set(positions.map((p) => p.ticker))];
    const quotes = await fetchMultipleQuotes(tickers);
    const metrics = calculatePortfolioMetrics(positions, quotes);
    const allocation = getAssetAllocation(positions, quotes);
    const sectors = getSectorAllocation(positions, quotes);

    const portfolioContext = `Portfolio Value: $${metrics.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} | Total Return: ${metrics.totalGainPercent >= 0 ? "+" : ""}${metrics.totalGainPercent.toFixed(2)}% | Score: ${metrics.portfolioScore}/100 | Positions: ${positions.length} | Top Sectors: ${sectors.slice(0, 3).map((s) => s.name).join(", ")}`;

    // Try OpenAI if key is set
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemPrompt = `You are Portfolio Intelligence, an expert AI financial advisor. You have access to the user's real portfolio data.

PORTFOLIO SUMMARY:
- Total Value: $${metrics.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
- Total Return: ${metrics.totalGainPercent.toFixed(2)}%
- Daily Change: ${metrics.dailyChangePercent >= 0 ? "+" : ""}${metrics.dailyChangePercent.toFixed(2)}%
- Portfolio Score: ${metrics.portfolioScore}/100
- Positions: ${positions.map((p) => `${p.ticker} (${p.type}, ${((quotes[p.ticker]?.price ?? p.avgPrice) * p.quantity).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })})`).join(", ")}
- Asset Allocation: ${allocation.map((a) => `${a.name}: ${a.percent.toFixed(1)}%`).join(", ")}
- Top Sectors: ${sectors.slice(0, 5).map((s) => `${s.name}: ${s.percent.toFixed(1)}%`).join(", ")}
- Warnings: ${metrics.warnings.map((w) => w.title).join(", ") || "None"}

Provide concise, actionable advice. Use markdown formatting. Be specific about the user's actual positions.`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...(history || []).slice(-6),
          { role: "user" as const, content: message },
        ];

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 800,
          temperature: 0.7,
        });

        return NextResponse.json({
          response: completion.choices[0].message.content,
          model: "gpt-4o-mini",
        });
      } catch (openaiErr) {
        console.error("OpenAI error:", openaiErr);
      }
    }

    // Fallback to rule-based
    const response = ruleBasedResponse(message, portfolioContext);
    return NextResponse.json({ response, model: "rule-based" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
