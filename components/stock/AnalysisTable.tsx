'use client';

interface Props {
  quote:    Record<string, unknown>;
  analyst:  Record<string, unknown> | null;
  analysis: Record<string, unknown> | null;
}

function Row({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <tr className="border-b border-[#1e2d4a]/50 hover:bg-[#1a2340]/30 transition-colors">
      <td className="py-2.5 px-4 text-sm text-[#94a3b8]">{label}</td>
      <td className={`py-2.5 px-4 text-sm font-mono text-right font-medium ${color || 'text-white'}`}>{value}</td>
    </tr>
  );
}

export default function AnalysisTable({ quote, analyst, analysis }: Props) {
  const q  = quote    as Record<string, number>;
  const an = analyst  as Record<string, number> | null;
  const ai = analysis as Record<string, unknown> | null;

  const totalAnalysts = an ? (an.strongBuy + an.buy + an.hold + an.sell + an.strongSell) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Fundamentals */}
      <div className="rounded-xl overflow-hidden border border-[#1e2d4a]">
        <div className="px-4 py-3 bg-[#0f1629] border-b border-[#1e2d4a]">
          <h3 className="text-sm font-medium text-white">Fundamental Data</h3>
        </div>
        <table className="w-full">
          <tbody>
            <Row label="Price"         value={`$${q.price?.toFixed(2)}`} />
            <Row label="Market Cap"    value={q.marketCap > 1e9 ? `$${(q.marketCap/1e9).toFixed(2)}B` : `$${(q.marketCap/1e6).toFixed(0)}M`} />
            <Row label="P/E Ratio"     value={q.pe > 0 ? q.pe.toFixed(1) : 'N/A'} />
            <Row label="EPS (TTM)"     value={q.eps ? `$${q.eps.toFixed(2)}` : 'N/A'} />
            <Row label="Beta"          value={q.beta?.toFixed(2)} />
            <Row label="Dividend Yield" value={q.dividendYield > 0 ? `${q.dividendYield.toFixed(2)}%` : 'N/A'} />
            <Row label="52W High"      value={`$${q.week52High?.toFixed(2)}`} color="text-emerald-400" />
            <Row label="52W Low"       value={`$${q.week52Low?.toFixed(2)}`}  color="text-red-400" />
            <Row label="Avg Volume"    value={q.avgVolume > 1e6 ? `${(q.avgVolume/1e6).toFixed(1)}M` : (q.avgVolume||0).toLocaleString()} />
          </tbody>
        </table>
      </div>

      {/* AI + Analyst */}
      <div className="space-y-4">
        {/* Analyst consensus */}
        {an && totalAnalysts > 0 && (
          <div className="rounded-xl overflow-hidden border border-[#1e2d4a]">
            <div className="px-4 py-3 bg-[#0f1629] border-b border-[#1e2d4a]">
              <h3 className="text-sm font-medium text-white">Analyst Consensus ({totalAnalysts} analysts)</h3>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'Strong Buy', value: an.strongBuy,  color: '#10b981' },
                { label: 'Buy',        value: an.buy,        color: '#34d399' },
                { label: 'Hold',       value: an.hold,       color: '#f59e0b' },
                { label: 'Sell',       value: an.sell,       color: '#f97316' },
                { label: 'Strong Sell', value: an.strongSell, color: '#ef4444' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-[#94a3b8]">{r.label}</div>
                  <div className="flex-1 h-2 bg-[#1e2d4a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(r.value / totalAnalysts * 100)}%`, background: r.color }}
                    />
                  </div>
                  <div className="w-6 text-xs font-mono text-white text-right">{r.value}</div>
                </div>
              ))}
              {an.targetMean > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1e2d4a] flex justify-between text-sm">
                  <span className="text-[#94a3b8]">Price Target</span>
                  <span className="font-mono text-white">${an.targetMean.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Scores */}
        {ai && (
          <div className="rounded-xl overflow-hidden border border-[#1e2d4a]">
            <div className="px-4 py-3 bg-[#0f1629] border-b border-[#1e2d4a]">
              <h3 className="text-sm font-medium text-white">AI Analysis Scores</h3>
            </div>
            <table className="w-full">
              <tbody>
                <Row label="Overall Score"    value={`${ai.score}/100`}            color="text-blue-400" />
                <Row label="Technical Score"  value={`${ai.technicalScore}/100`}   color="text-cyan-400" />
                <Row label="Fundamental Score" value={`${ai.fundamentalScore}/100`} color="text-purple-400" />
                <Row label="Momentum Score"   value={`${ai.momentumScore}/100`}    color="text-yellow-400" />
                <Row label="Risk Level"       value={ai.riskLevel as string}       color={
                  ai.riskLevel === 'Low' ? 'text-emerald-400' :
                  ai.riskLevel === 'Medium' ? 'text-yellow-400' :
                  ai.riskLevel === 'High' ? 'text-orange-400' : 'text-red-400'
                } />
                <Row label="Sentiment"        value={ai.sentiment as string} color={
                  ai.sentiment === 'bullish' ? 'text-emerald-400' :
                  ai.sentiment === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                } />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
