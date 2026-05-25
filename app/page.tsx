"use client";

import { useState } from "react";
import SearchBar from "@/components/layout/SearchBar";
import MarketTicker from "@/components/layout/MarketTicker";
import StockDetail from "@/components/stock/StockDetail";
import RecommendedStocks from "@/components/stock/RecommendedStocks";
import PortfolioView from "@/components/portfolio/PortfolioView";

const QUICK_PICKS = ["AAPL","NVDA","MSFT","TSLA","META","AMZN","GOOGL","AMD"];

type View = "home" | "portfolio" | "stock";

export default function Dashboard() {
  const [view,   setView]   = useState<View>("home");
  const [ticker, setTicker] = useState<string | null>(null);

  function openStock(t: string) { setTicker(t); setView("stock"); }
  function goHome()              { setView("home"); setTicker(null); }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-[#1e2d4a] bg-[#0f1629] sticky top-0 z-10">
        <button onClick={goHome} className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ⬡ HELIX STOCKS
          </span>
          <span className="text-xs text-[#94a3b8] border border-[#1e2d4a] rounded px-1.5 py-0.5">AI</span>
        </button>

        <div className="flex-1 max-w-xl">
          <SearchBar onSelect={openStock} />
        </div>

        {/* Nav */}
        <nav className="flex gap-1">
          {([["home","Übersicht"],["portfolio","Portfolio"]] as const).map(([v,label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view === v ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-[#94a3b8] hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden md:block">
          <MarketTicker />
        </div>
        <button
          onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
          className="text-xs text-[#475569] hover:text-red-400 transition-colors flex-shrink-0"
          title="Ausloggen"
        >
          🔒
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {view === "stock" && ticker ? (
          <div className="slide-in">
            <button onClick={goHome}
              className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white mb-4 transition-colors">
              ← Zurück
            </button>
            <StockDetail ticker={ticker} />
          </div>

        ) : view === "portfolio" ? (
          <div className="slide-in">
            <h1 className="text-xl font-bold text-white mb-6">Mein Portfolio</h1>
            <PortfolioView />
          </div>

        ) : (
          <div className="space-y-10">
            {/* Hero */}
            <div className="flex flex-col items-center gap-6 pt-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-white">
                  Aktienanalyse{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    mit KI
                  </span>
                </h1>
                <p className="text-[#94a3b8] text-base">Aktie suchen und die vollständige Analyse erhalten.</p>
              </div>
              <div className="w-full max-w-lg">
                <SearchBar onSelect={openStock} large />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PICKS.map(t => (
                  <button key={t} onClick={() => openStock(t)}
                    className="px-4 py-1.5 rounded-full bg-[#141c2e] border border-[#1e2d4a] text-sm font-mono text-[#94a3b8] hover:text-white hover:border-blue-500/50 hover:bg-[#1a2340] transition-all">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <RecommendedStocks onSelect={openStock} />
          </div>
        )}
      </main>
    </div>
  );
}
