'use client';

interface Quote {
  ticker: string; name: string; price: number;
  changePct: number; change: number; marketCap: number;
  volume: number; pe: number; sector: string; logoUrl: string;
}

export default function StockCard({ quote, onClick }: { quote: Quote; onClick: () => void }) {
  const up = quote.changePct >= 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-[#141c2e] border border-[#1e2d4a] hover:border-blue-500/40 hover:bg-[#1a2340] transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-mono font-bold text-white text-sm">{quote.ticker}</div>
          <div className="text-xs text-[#94a3b8] truncate max-w-28">{quote.name}</div>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${up ? 'bg-emerald-900/60 text-emerald-400' : 'bg-red-900/60 text-red-400'}`}>
          {up ? '+' : ''}{quote.changePct.toFixed(2)}%
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-bold text-white font-mono">${quote.price.toFixed(2)}</div>
          <div className={`text-xs font-mono ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? '+' : ''}{quote.change.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#94a3b8]">Vol</div>
          <div className="text-xs font-mono text-white">
            {quote.volume > 1e6 ? `${(quote.volume / 1e6).toFixed(1)}M` : quote.volume.toLocaleString()}
          </div>
        </div>
      </div>
    </button>
  );
}
