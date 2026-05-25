'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchResult { ticker: string; name: string; type: string; }

export default function SearchBar({
  onSelect,
  large = false,
}: {
  onSelect: (ticker: string) => void;
  large?: boolean;
}) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 1) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function select(ticker: string) {
    onSelect(ticker);
    setQuery('');
    setOpen(false);
  }

  const inputCls = large
    ? 'w-full bg-[#141c2e] border border-[#1e2d4a] rounded-xl pl-11 pr-4 py-4 text-base text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors shadow-lg'
    : 'w-full bg-[#141c2e] border border-[#1e2d4a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors';

  const iconCls = large
    ? 'absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]'
    : 'absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm';

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <span className={iconCls}>🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={large ? 'Aktie suchen... z.B. AAPL, Tesla, Nvidia' : 'Suchen... (AAPL, Tesla)'}
          className={inputCls}
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] text-xs">...</span>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-[#141c2e] border border-[#1e2d4a] rounded-lg shadow-2xl z-50 overflow-hidden">
          {results.map(r => (
            <button
              key={r.ticker}
              onClick={() => select(r.ticker)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a2340] transition-colors text-left"
            >
              <div>
                <span className="font-mono font-medium text-white text-sm">{r.ticker}</span>
                <p className="text-xs text-[#94a3b8] truncate max-w-xs">{r.name}</p>
              </div>
              <span className="text-xs text-[#475569] border border-[#1e2d4a] rounded px-1.5 py-0.5">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
