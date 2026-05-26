'use client';

import { useState, useRef } from 'react';

interface Position {
  ticker: string;
  quantity: number;
  averagePricePaid: number;
  currentPrice: number;
  ppl: number;
}

function parseT212CSV(text: string): Position[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const raw = lines[0].replace(/^﻿/, '');
  const headers = raw.split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

  const col = (row: string[], names: string[]): string => {
    for (const name of names) {
      const i = headers.indexOf(name);
      if (i !== -1 && row[i]) return row[i].replace(/"/g, '').trim();
    }
    return '';
  };

  return lines.slice(1).map(line => {
    const row = line.split(',');
    const ticker       = col(row, ['ticker', 'symbol', 'instrument']);
    const quantity     = parseFloat(col(row, ['shares', 'quantity', 'no. of shares', 'number of shares'])) || 0;
    const avgPrice     = parseFloat(col(row, ['average price', 'avg price', 'buy price', 'average buy price', 'average_price'])) || 0;
    const currentPrice = parseFloat(col(row, ['current price', 'current_price', 'price', 'last price'])) || avgPrice;
    const ppl          = parseFloat(col(row, ['result', 'p&l', 'ppl', 'profit/loss', 'unrealised p&l'])) || 0;
    return { ticker, quantity, averagePricePaid: avgPrice || currentPrice, currentPrice, ppl };
  }).filter(p => p.ticker && p.quantity > 0);
}

export default function PortfolioSummary() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loaded,    setLoaded]    = useState(false);
  const [error,     setError]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text   = ev.target?.result as string;
        const parsed = parseT212CSV(text);
        if (parsed.length === 0) {
          setError('Keine Positionen gefunden. Bitte die generierte portfolio_t212.csv hochladen.');
          return;
        }
        setPositions(parsed);
        setLoaded(true);
      } catch { setError('CSV konnte nicht gelesen werden.'); }
    };
    reader.readAsText(file);
  }

  const totalValue = positions.reduce((s, p) => s + (p.currentPrice || p.averagePricePaid) * p.quantity, 0);
  const totalPnl   = positions.reduce((s, p) => s + (p.ppl || 0), 0);
  const pnlPct     = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const up         = totalPnl >= 0;

  if (!loaded) return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider">Portfolio</h2>
      </div>
      <div
        className="p-6 rounded-2xl bg-[#141c2e] border border-dashed border-[#1e2d4a] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#3b4f7a] transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <span className="text-3xl">📁</span>
        <div className="text-center">
          <div className="text-sm font-medium text-white">Portfolio CSV importieren</div>
          <div className="text-xs text-[#94a3b8] mt-1">Lade die portfolio_t212.csv hoch die du von mir erhalten hast</div>
        </div>
        <button className="mt-1 px-4 py-1.5 bg-[#1e2d4a] hover:bg-[#2a3f6a] text-white text-xs rounded-lg transition-colors">
          CSV auswählen
        </button>
        {error && <div className="text-xs text-red-400 text-center">{error}</div>}
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider">Portfolio</h2>
        <button
          onClick={() => { setLoaded(false); setPositions([]); if (inputRef.current) inputRef.current.value = ''; }}
          className="text-xs text-[#94a3b8] hover:text-white transition-colors"
        >
          ↩ Neu laden
        </button>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      <div className="p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-[#94a3b8]">Portfolio Wert</div>
            <div className="text-xl font-mono font-bold text-white">${totalValue.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-[#94a3b8]">Gesamt P&L</div>
            <div className={`text-xl font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#94a3b8]">Rendite</div>
            <div className={`text-xl font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '+' : ''}{pnlPct.toFixed(2)}%
            </div>
          </div>
        </div>

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
                const pu  = (p.ppl || 0) >= 0;
                const cur = p.currentPrice || p.averagePricePaid;
                const pct = p.averagePricePaid > 0
                  ? ((cur - p.averagePricePaid) / p.averagePricePaid * 100).toFixed(2)
                  : '0.00';
                return (
                  <tr key={p.ticker} className="border-b border-[#1e2d4a]/40 hover:bg-[#1a2340]/30">
                    <td className="py-2 font-mono font-bold text-white">{p.ticker}</td>
                    <td className="py-2 font-mono text-[#94a3b8]">{p.quantity}</td>
                    <td className="py-2 font-mono text-white">${p.averagePricePaid?.toFixed(2)}</td>
                    <td className="py-2 font-mono text-white">${cur?.toFixed(2)}</td>
                    <td className={`py-2 font-mono ${pu ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pu ? '+' : ''}${(p.ppl || 0).toFixed(2)}
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
      </div>
    </div>
  );
}
