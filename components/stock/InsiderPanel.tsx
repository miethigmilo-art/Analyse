'use client';

interface InsiderTrade {
  name: string; title: string; transactionType: string;
  shares: number; price: number; value: number; date: string;
}

export default function InsiderPanel({ trades }: { trades: unknown[] }) {
  const items = trades as InsiderTrade[];
  if (items.length === 0) return (
    <div className="text-center py-12 text-[#475569]">No insider trading data available</div>
  );

  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2d4a]">
      <table className="w-full">
        <thead>
          <tr className="bg-[#0f1629] border-b border-[#1e2d4a]">
            {['Name', 'Type', 'Shares', 'Price', 'Value', 'Date'].map(h => (
              <th key={h} className="px-4 py-3 text-xs font-medium text-[#94a3b8] text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((t, i) => {
            const buy = t.transactionType === 'P' || t.transactionType === 'A';
            return (
              <tr key={i} className="border-b border-[#1e2d4a]/50 hover:bg-[#1a2340]/30">
                <td className="px-4 py-2.5 text-sm text-white">{t.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    buy ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {buy ? 'BUY' : 'SELL'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm font-mono text-white">
                  {Math.abs(t.shares).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-sm font-mono text-white">
                  {t.price > 0 ? `$${t.price.toFixed(2)}` : 'N/A'}
                </td>
                <td className="px-4 py-2.5 text-sm font-mono text-white">
                  {t.value > 0 ? `$${(t.value / 1000).toFixed(0)}K` : 'N/A'}
                </td>
                <td className="px-4 py-2.5 text-xs text-[#94a3b8]">{t.date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
