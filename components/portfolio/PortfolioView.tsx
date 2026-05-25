"use client";

import { useState, useEffect } from "react";

interface Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  ppl: number;
  fxPpl?: number;
}

interface AIResult {
  rating: string;
  score: number;
  dailyRating: string;
  priceTarget: number;
  summary: string;
}

interface Enriched extends Position {
  name: string;
  sector: string;
  marketValue: number;
  allocation: number;
  pnlPct: number;
  ai: AIResult | null;
}

const RATING_COLOR: Record<string, string> = {
  "Strong Buy": "text-emerald-400",
  "Buy":        "text-green-400",
  "Hold":       "text-yellow-400",
  "Sell":       "text-orange-400",
  "Strong Sell":"text-red-500",
};

export default function PortfolioView() {
  const [positions, setPositions] = useState<Enriched[]>([]);
  const [cash, setCash]           = useState<{ free: number; total: number } | null>(null);
  const [loading, setLoading]     = useState(true);
  const [errMsg, setErrMsg]       = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [sortBy, setSortBy]       = useState<"value" | "pnl" | "pct">("value");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/t212?type=portfolio");
      const d   = await res.json();
      if (d.error) { setErrMsg(d.error); setLoading(false); return; }

      const rawPositions: Position[] = d.positions || [];
      setCash(d.cash);

      // Enrich with Yahoo Finance prices + names
      const enriched: Enriched[] = await Promise.all(
        rawPositions.map(async (p) => {
          const ticker = p.ticker?.replace(/_US_EQ|_EQ|_US/g, "") || p.ticker;
          let name = ticker, sector = "";
          let currentPrice = p.currentPrice || 0;
          try {
            const qr  = await fetch(`/api/stocks?ticker=${ticker}`);
            const qd  = await qr.json();
            name         = qd.quote?.name    || ticker;
            sector       = qd.quote?.sector  || "";
            currentPrice = qd.quote?.price   || currentPrice;
          } catch {}
          const marketValue = currentPrice * p.quantity;
          const pnl         = (currentPrice - p.averagePrice) * p.quantity;
          const pnlPct      = p.averagePrice > 0 ? ((currentPrice - p.averagePrice) / p.averagePrice) * 100 : 0;
          return { ...p, ticker, name, sector, marketValue, allocation: 0, pnlPct, ppl: pnl, currentPrice, ai: null };
        })
      );

      // Calculate allocations
      const totalVal = enriched.reduce((s, p) => s + p.marketValue, 0);
      enriched.forEach(p => { p.allocation = totalVal > 0 ? (p.marketValue / totalVal) * 100 : 0; });

      setPositions(enriched);
      setLoading(false);

      // AI analysis for each position
      setAiLoading(true);
      const withAI = await Promise.all(
        enriched.map(async (p) => {
          try {
            const ar = await fetch(`/api/analyze?ticker=${p.ticker}`);
            const ad = await ar.json();
            return { ...p, ai: ad.analysis };
          } catch { return p; }
        })
      );
      setPositions(withAI);
      setAiLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 rounded-2xl bg-[#141c2e]" />
      <div className="h-64 rounded-2xl bg-[#141c2e]" />
    </div>
  );

  if (errMsg) return (
    <div className="p-6 rounded-2xl bg-[#141c2e] border border-[#1e2d4a] space-y-2">
      <div className="text-white font-medium">⚠️ Trading 212 Fehler</div>
      <div className="text-xs text-red-400 font-mono break-all bg-red-900/20 rounded p-2">{errMsg}</div>
    </div>
  );

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalPnl   = positions.reduce((s, p) => s + p.ppl, 0);
  const totalPct   = positions.reduce((s, p) => s + p.averagePrice * p.quantity, 0);
  const overallPct = totalPct > 0 ? (totalPnl / totalPct) * 100 : 0;
  const up         = totalPnl >= 0;

  const sorted = [...positions].sort((a, b) => {
    if (sortBy === "pnl") return b.ppl - a.ppl;
    if (sortBy === "pct") return b.pnlPct - a.pnlPct;
    return b.marketValue - a.marketValue;
  });

  // Sector breakdown
  const sectors: Record<string, number> = {};
  positions.forEach(p => {
    const s = p.sector || "Andere";
    sectors[s] = (sectors[s] || 0) + p.marketValue;
  });

  const topSectors = Object.entries(sectors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const SECTOR_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];

  return (
    <div className="space-y-6">
      {/* ── Overview Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Portfolio Wert",  value: `$${totalValue.toFixed(2)}`,                     sub: "Aktien gesamt" },
          { label: "Gesamt P&L",      value: `${up?"+":""}$${totalPnl.toFixed(2)}`,            sub: `${up?"+":""}${overallPct.toFixed(2)}%`, up },
          { label: "Cash (frei)",     value: `$${(cash?.free ?? 0).toFixed(2)}`,               sub: "Nicht investiert" },
          { label: "Positionen",      value: String(positions.length),                          sub: "Offene Trades" },
        ].map(c => (
          <div key={c.label} className="p-5 rounded-2xl bg-[#141c2e] border border-[#1e2d4a]">
            <div className="text-xs text-[#475569] mb-1">{c.label}</div>
            <div className={`text-2xl font-mono font-bold ${"up" in c ? (c.up ? "text-emerald-400" : "text-red-400") : "text-white"}`}>{c.value}</div>
            {c.sub && <div className="text-xs text-[#94a3b8] mt-1">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Holdings + Sectors ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Holdings Table */}
        <div className="lg:col-span-2 bg-[#141c2e] border border-[#1e2d4a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d4a]">
            <h3 className="text-sm font-semibold text-white">Positionen</h3>
            <div className="flex gap-1">
              {(["value","pnl","pct"] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${sortBy===s?"bg-blue-600/30 text-blue-400":"text-[#475569] hover:text-white"}`}>
                  {s === "value" ? "Wert" : s === "pnl" ? "P&L $" : "P&L %"}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2d4a]/60">
                  {["Aktie","Stück","Ø Kauf","Aktuell","P&L","Anteil","KI"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-[#475569] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => {
                  const pu = p.ppl >= 0;
                  return (
                    <tr key={p.ticker} className="border-b border-[#1e2d4a]/30 hover:bg-[#1a2340]/40">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-white text-sm">{p.ticker}</div>
                        <div className="text-xs text-[#475569] truncate max-w-[120px]">{p.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#94a3b8] text-xs">{p.quantity}</td>
                      <td className="px-4 py-3 font-mono text-white text-xs">${p.averagePrice?.toFixed(2)}</td>
                      <td className="px-4 py-3 font-mono text-white text-xs">${p.currentPrice?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className={`font-mono text-xs font-medium ${pu?"text-emerald-400":"text-red-400"}`}>
                          {pu?"+":""}${p.ppl.toFixed(2)}
                        </div>
                        <div className={`font-mono text-xs ${pu?"text-emerald-400/70":"text-red-400/70"}`}>
                          {pu?"+":""}{p.pnlPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#1e2d4a] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{width:`${Math.min(100,p.allocation)}%`}} />
                          </div>
                          <span className="text-xs text-[#94a3b8] font-mono">{p.allocation.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {aiLoading ? (
                          <div className="h-3 w-12 bg-[#1e2d4a] rounded animate-pulse" />
                        ) : p.ai ? (
                          <div>
                            <div className={`text-xs font-medium ${RATING_COLOR[p.ai.rating] || "text-white"}`}>{p.ai.rating}</div>
                            <div className="text-xs text-[#475569]">Score: {p.ai.score}</div>
                          </div>
                        ) : <span className="text-xs text-[#475569]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sector Breakdown */}
        <div className="bg-[#141c2e] border border-[#1e2d4a] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Sektoren</h3>
          <div className="space-y-3">
            {topSectors.map(([sector, val], i) => {
              const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
              return (
                <div key={sector}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94a3b8]">{sector}</span>
                    <span className="text-white font-mono">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1e2d4a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, backgroundColor: SECTOR_COLORS[i]}} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily AI Summary */}
          <div className="pt-4 border-t border-[#1e2d4a]">
            <h4 className="text-xs text-[#94a3b8] uppercase tracking-wider mb-3">KI Tages-Analyse</h4>
            {aiLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_,i) => <div key={i} className="h-8 bg-[#1e2d4a] rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.slice(0,5).map(p => p.ai && (
                  <div key={p.ticker} className="flex items-center justify-between py-1.5 border-b border-[#1e2d4a]/30 last:border-0">
                    <span className="text-xs font-mono text-white">{p.ticker}</span>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${RATING_COLOR[p.ai.dailyRating || p.ai.rating] || "text-white"}`}>
                        {p.ai.dailyRating || p.ai.rating}
                      </div>
                      <div className="text-xs text-[#475569]">Ziel: ${p.ai.priceTarget?.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
