'use client';

import { useState, useEffect } from 'react';

const TICKERS = ['SPY', 'QQQ', 'IWM', 'BTC-USD'];

interface TickerData { ticker: string; price: number; changePct: number; }

export default function MarketTicker() {
  const [data, setData] = useState<TickerData[]>([]);

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled(
        TICKERS.map(t => fetch(`/api/stocks?ticker=${t}`).then(r => r.json()).then(d => ({
          ticker: t, price: d.quote?.price || 0, changePct: d.quote?.changePct || 0,
        })))
      );
      setData(results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<TickerData>).value));
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (data.length === 0) return null;

  return (
    <div className="hidden lg:flex items-center gap-4 text-xs">
      {data.map(d => (
        <div key={d.ticker} className="flex items-center gap-1.5">
          <span className="text-[#94a3b8] font-mono">{d.ticker}</span>
          <span className="font-mono text-white">${d.price.toFixed(2)}</span>
          <span className={d.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {d.changePct >= 0 ? '+' : ''}{d.changePct.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
