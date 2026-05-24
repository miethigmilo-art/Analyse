'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number; }

const RANGES = [
  { label: '1W',  days: 7   },
  { label: '1M',  days: 30  },
  { label: '3M',  days: 90  },
  { label: '6M',  days: 180 },
  { label: '1Y',  days: 365 },
];

function fmt(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!active || !(payload as unknown[])?.length) return null;
  const d = (payload as Array<{ payload: Record<string, number> }>)[0]?.payload;
  const up = d.close >= d.open;
  return (
    <div className="bg-[#141c2e] border border-[#1e2d4a] rounded-lg p-3 text-xs shadow-xl">
      <div className="text-[#94a3b8] mb-1">{fmt(d.time)}</div>
      <div className={`font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>${d.close.toFixed(2)}</div>
      <div className="text-[#475569]">O: ${d.open.toFixed(2)} H: ${d.high.toFixed(2)} L: ${d.low.toFixed(2)}</div>
    </div>
  );
}

export default function PriceChart({
  ticker, history, currentPrice,
}: { ticker: string; history: Bar[]; currentPrice: number }) {
  const [range, setRange] = useState(1);

  const filtered = useMemo(() => {
    const cutoff = Date.now() / 1000 - RANGES[range].days * 86400;
    return history.filter(b => b.time >= cutoff);
  }, [history, range]);

  const startPrice = filtered[0]?.close || currentPrice;
  const up         = currentPrice >= startPrice;
  const pct        = startPrice > 0 ? ((currentPrice - startPrice) / startPrice * 100).toFixed(2) : '0.00';

  const color = up ? '#10b981' : '#ef4444';

  return (
    <div className="p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a] h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-medium text-white">{ticker} Price</span>
          <span className={`ml-3 text-sm font-mono ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? '+' : ''}{pct}% ({RANGES[range].label})
          </span>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRange(i)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                range === i ? 'bg-blue-600 text-white' : 'text-[#94a3b8] hover:bg-[#1a2340] hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-[#475569] text-sm">
          No chart data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={filtered} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={fmt}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v.toFixed(0)}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={startPrice} stroke="#1e2d4a" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${ticker})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#0a0e1a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
