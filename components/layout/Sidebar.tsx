'use client';

import { useState } from 'react';

const NAV = [
  { id: null,        label: 'Dashboard',   icon: '⊞' },
  { id: 'AAPL',      label: 'Apple',       icon: '●' },
  { id: 'NVDA',      label: 'Nvidia',      icon: '●' },
  { id: 'TSLA',      label: 'Tesla',       icon: '●' },
  { id: 'MSFT',      label: 'Microsoft',   icon: '●' },
];

export default function Sidebar({
  onSelect, selected,
}: { onSelect: (t: string | null) => void; selected: string | null }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-[#0f1629] border-r border-[#1e2d4a] transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'}`}
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 text-[#94a3b8] hover:text-white hover:bg-[#141c2e] transition-colors border-b border-[#1e2d4a] text-sm text-left"
      >
        {collapsed ? '→' : '← Collapse'}
      </button>

      <nav className="flex-1 p-2 space-y-1">
        {NAV.map(item => (
          <button
            key={String(item.id)}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              selected === item.id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-[#94a3b8] hover:bg-[#141c2e] hover:text-white'
            }`}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-[#1e2d4a]">
          <div className="text-xs text-[#475569]">Helix Stocks v1.0</div>
          <div className="text-xs text-[#475569]">AI-Powered Analysis</div>
        </div>
      )}
    </aside>
  );
}
