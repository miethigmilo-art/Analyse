'use client';

interface AIAnalysis {
  rating: string; score: number; summary: string;
  opportunities: string[]; risks: string[];
  priceTarget: number; priceTargetLow: number; priceTargetHigh: number;
  sentiment: string; technicalScore: number; fundamentalScore: number;
  momentumScore: number; riskLevel: string; longTermOutlook: string;
}

const RATING_STYLES: Record<string, string> = {
  'Strong Buy':  'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30',
  'Buy':         'bg-green-900/40   text-green-300   border border-green-500/30',
  'Hold':        'bg-yellow-900/40  text-yellow-300  border border-yellow-500/30',
  'Sell':        'bg-orange-900/40  text-orange-300  border border-orange-500/30',
  'Strong Sell': 'bg-red-900/40     text-red-300     border border-red-500/30',
};

function ScoreBar({ label, value, color = '#3b82f6' }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#94a3b8]">{label}</span>
        <span className="text-white font-mono">{value}/100</span>
      </div>
      <div className="h-1.5 bg-[#1e2d4a] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AIRatingCard({
  analysis, loading, ticker, currentPrice,
}: {
  analysis: AIAnalysis | null;
  loading: boolean;
  ticker: string;
  currentPrice: number;
}) {
  if (loading) {
    return (
      <div className="h-full p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a] flex flex-col gap-3">
        <div className="text-sm text-[#94a3b8] flex items-center gap-2">
          <span className="pulse-dot">●</span> AI analyzing {ticker}...
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-[#1e2d4a] rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a] flex items-center justify-center">
        <p className="text-sm text-[#475569] text-center">
          Configure OpenAI API key<br />for AI analysis
        </p>
      </div>
    );
  }

  const upside = analysis.priceTarget > 0
    ? ((analysis.priceTarget - currentPrice) / currentPrice * 100).toFixed(1)
    : null;

  return (
    <div className="p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a] space-y-4 h-full flex flex-col">
      {/* Rating */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#94a3b8] mb-1">AI RATING</div>
          <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${RATING_STYLES[analysis.rating] || ''}`}>
            {analysis.rating}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#94a3b8]">AI SCORE</div>
          <div className="text-2xl font-bold font-mono text-white">{analysis.score}</div>
          <div className="text-xs text-[#475569]">/100</div>
        </div>
      </div>

      {/* Price target */}
      {analysis.priceTarget > 0 && (
        <div className="p-3 rounded-lg bg-[#0f1629] border border-[#1e2d4a]">
          <div className="text-xs text-[#94a3b8] mb-1">Price Target</div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-bold text-white">${analysis.priceTarget.toFixed(2)}</span>
            {upside && (
              <span className={`text-sm font-mono ${parseFloat(upside) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {parseFloat(upside) >= 0 ? '+' : ''}{upside}%
              </span>
            )}
          </div>
          <div className="text-xs text-[#475569]">
            ${analysis.priceTargetLow?.toFixed(0)} – ${analysis.priceTargetHigh?.toFixed(0)}
          </div>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-4 flex-1">{analysis.summary}</p>

      {/* Scores */}
      <div className="space-y-2">
        <ScoreBar label="Technical"   value={analysis.technicalScore}   color="#3b82f6" />
        <ScoreBar label="Fundamental" value={analysis.fundamentalScore} color="#06b6d4" />
        <ScoreBar label="Momentum"    value={analysis.momentumScore}    color="#8b5cf6" />
      </div>

      {/* Opportunities */}
      <div>
        <div className="text-xs text-emerald-400 font-medium mb-1">Opportunities</div>
        <ul className="space-y-0.5">
          {analysis.opportunities?.slice(0, 2).map((o, i) => (
            <li key={i} className="text-xs text-[#94a3b8] flex gap-1.5"><span className="text-emerald-500">↑</span>{o}</li>
          ))}
        </ul>
      </div>

      {/* Risks */}
      <div>
        <div className="text-xs text-red-400 font-medium mb-1">Risks</div>
        <ul className="space-y-0.5">
          {analysis.risks?.slice(0, 2).map((r, i) => (
            <li key={i} className="text-xs text-[#94a3b8] flex gap-1.5"><span className="text-red-500">↓</span>{r}</li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#1e2d4a]">
        <span className="text-xs text-[#475569]">Risk Level</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          analysis.riskLevel === 'Low'     ? 'text-emerald-400 bg-emerald-900/30' :
          analysis.riskLevel === 'Medium'  ? 'text-yellow-400 bg-yellow-900/30'  :
          analysis.riskLevel === 'High'    ? 'text-orange-400 bg-orange-900/30'  :
          'text-red-400 bg-red-900/30'
        }`}>{analysis.riskLevel}</span>
      </div>
    </div>
  );
}
