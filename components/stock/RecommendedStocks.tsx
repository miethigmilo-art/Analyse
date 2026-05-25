'use client';

import { useState, useEffect } from 'react';
import StockCard from './StockCard';

const CATEGORIES = [
  { key: 'trending',    label: 'Trending',        icon: '🔥' },
  { key: 'aiPicks',     label: 'KI Picks',         icon: '🤖' },
  { key: 'highGrowth',  label: 'High Growth',      icon: '🚀' },
  { key: 'undervalued', label: 'Unterbewertet',    icon: '💎' },
  { key: 'hedgeFunds',  label: 'Hedge Funds',      icon: '🏛️' },
];

interface Quote {
  ticker: string; name: string; price: number;
  changePct: number; change: number; marketCap: number;
  volume: number; pe: number; sector: string; logoUrl: string;
}

export default function RecommendedStocks({ onSelect }: { onSelect: (t: string) => void }) {
  const [cat,     setCat]     = useState('trending');
  const [data,    setData]    = useState<Record<string, Quote[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recommendations')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const current = data[cat] || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Beste Aktien Picks
        </h2>
        <span className="text-xs text-[#475569]">Live-Kurse</span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              cat === c.key
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-[#141c2e] text-[#94a3b8] border border-[#1e2d4a] hover:text-white hover:border-[#2e3d5a]'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#141c2e] animate-pulse" />
          ))}
        </div>
      ) : current.length === 0 ? (
        <div className="text-center text-[#475569] py-10 text-sm">Keine Daten verfügbar</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {current.slice(0, 8).map(q => (
            <StockCard key={q.ticker} quote={q} onClick={() => onSelect(q.ticker)} />
          ))}
        </div>
      )}
    </div>
  );
}
