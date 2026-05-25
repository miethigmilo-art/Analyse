'use client';

import { useState, useEffect } from 'react';

interface Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  ppl: number;
}

interface Portfolio {
  positions: Position[];
  cash: { free: number; total: number; blocked: number } | null;
}

export default function PortfolioSummary() {
  const [data,    setData]    = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/t212?type=portfolio')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErrMsg(String(d.error)); return; }
        setData(d);
      })
      .catch(e => setErrMsg(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-32 rounded-2xl bg-[#141c2e] animate-pulse" />
  );

  if (errMsg || !data) return (
    <div className="p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a]">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">🔌</span>
        <div>
          <div className="text-sm font-medium text-white">Trading 212 Not Connected</div>
          <div className="text-xs text-[#94a3b8]">Add TRADING212_API_KEY to environment variables.</div>
        </div>
      </div>
      {errMsg && (
        <div className="text-xs text-red-400 font-mono bg-red-900/20 rounded p-2 mt-1 break-all">
          {errMsg}
        </div>
      )}
    </div>
  );

  const positions  = data.positions || [];
  const totalValue = positions.reduce((s, p) => s + (p.currentPrice ?? 0) * (p.quantity ?? 0), 0);
  const totalPnl   = positions.reduce((s, p) => s + (p.ppl ?? 0), 0);
  const pnlPct     = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const up         = totalPnl >= 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider">Trading 212 Portfolio</h2>
        <span className="text-xs text-emerald-400 flex items-center gap-1">
          <span className="pulse-dot text-emerald-400">●</span> Live
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-[#94a3b8]">Portfolio Value</div>
            <div className="text-xl font-mono font-bold text-white">${totalValue.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-[#94a3b8]">Total P&L</div>
            <div className={`text-xl font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#94a3b8]">Return</div>
            <div className={`text-xl font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '+' : ''}{pnlPct.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#94a3b8]">Cash (Free)</div>
            <div className="text-xl font-mono font-bold text-white">
              ${data.cash?.free?.toFixed(2) ?? 'N/A'}
            </div>
          </div>
        </div>

        {positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2d4a]">
                  {['Ticker', 'Qty', 'Avg Price', 'Current', 'P&L', 'P&L %'].map(h => (
                    <th key={h} className="pb-2 text-left text-xs text-[#94a3b8] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => {
                  const pu  = (p.ppl ?? 0) >= 0;
                  const avg = p.averagePrice ?? 0;
                  const cur = p.currentPrice ?? 0;
                  const pct = avg > 0 ? ((cur - avg) / avg * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={p.ticker} className="border-b border-[#1e2d4a]/40 hover:bg-[#1a2340]/30">
                      <td className="py-2 font-mono font-bold text-white">{p.ticker?.replace(/_US_EQ|_EQ|_US/g, '')}</td>
                      <td className="py-2 font-mono text-[#94a3b8]">{p.quantity}</td>
                      <td className="py-2 font-mono text-white">${avg.toFixed(2)}</td>
                      <td className="py-2 font-mono text-white">${cur.toFixed(2)}</td>
                      <td className={`py-2 font-mono ${pu ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pu ? '+' : ''}${(p.ppl ?? 0).toFixed(2)}
                      </td>
                      <td className={`py-2 font-mono ${pu ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pu ? '+' : ''}{pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-[#475569] text-center py-4">No positions found in your T212 account.</div>
        )}
      </div>
    </div>
  );
}
