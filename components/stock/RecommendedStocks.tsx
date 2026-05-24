'use client';

import { useState, useEffect } from 'react';
import StockCard from './StockCard';

const CATEGORIES = [
  { key: 'trending',    label: 'Trending',       icon: '🔥' },
  { key: 'undervalued', label: 'Undervalued',    icon: '💎' },
  { key: 'highGrowth',  label: 'High Growth',    icon: '🚀' },
  { key: 'hedgeFunds',  label: 'Hedge Fund Favs', icon: '🏛️' },
  { key: 'aiPicks',     label: 'AI Picks',        icon: '🤖' },
];

interface Quote { ticker: string; name: string; price: number; changePct: number; change: number; marketCap: number; volume: number; pe: number; sector: string; logoUrl: string; }

export default function RecommendedStocks({ onSelect }: { onSelect: (t: string) => void }) {
  const [cat,  setCat]  = useState('trending');
  const [data, setData] = useState<Record<string, Quote[]>>({});
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider">AI Recommendations</h2>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              cat === c.key
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-[#141c2e] text-[#94a3b8] border border-[#1e2d4a] hover:text-white'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[#141c2e] animate-pulse" />
          ))}
        </div>
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
