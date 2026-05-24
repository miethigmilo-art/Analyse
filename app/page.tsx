'use client';

import { useState, useEffect, useCallback } from 'react';
import SearchBar from '@/components/layout/SearchBar';
import Sidebar from '@/components/layout/Sidebar';
import StockCard from '@/components/stock/StockCard';
import MarketTicker from '@/components/layout/MarketTicker';
import RecommendedStocks from '@/components/stock/RecommendedStocks';
import PortfolioSummary from '@/components/stock/PortfolioSummary';

interface QuoteData {
  ticker: string; name: string; price: number;
  changePct: number; change: number; marketCap: number;
  volume: number; pe: number; sector: string; logoUrl: string;
}

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker]   = useState<string | null>(null);
  const [featuredStocks, setFeaturedStocks]   = useState<QuoteData[]>([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const tickers = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'META', 'AMZN'];
        const quotes  = await Promise.allSettled(
          tickers.map(t => fetch(`/api/stocks?ticker=${t}`).then(r => r.json()).then(d => d.quote))
        );
        setFeaturedStocks(
          quotes.filter(q => q.status === 'fulfilled' && q.value?.price)
                .map(q => (q as PromiseFulfilledResult<QuoteData>).value)
        );
      } finally { setLoading(false); }
    }
    loadFeatured();
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
      <Sidebar onSelect={setSelectedTicker} selected={selectedTicker} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-[#1e2d4a] bg-[#0f1629]">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ⬡ HELIX STOCKS
            </span>
            <span className="text-xs text-[#94a3b8] border border-[#1e2d4a] rounded px-1.5 py-0.5">AI</span>
          </div>
          <div className="flex-1 max-w-xl">
            <SearchBar onSelect={setSelectedTicker} />
          </div>
          <MarketTicker />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedTicker ? (
            <StockAnalysisView ticker={selectedTicker} onBack={() => setSelectedTicker(null)} />
          ) : (
            <>
              {/* Featured stocks grid */}
              <div>
                <h2 className="text-sm font-medium text-[#94a3b8] uppercase tracking-wider mb-3">
                  Market Overview
                </h2>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-28 rounded-xl bg-[#141c2e] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {featuredStocks.map(q => (
                      <StockCard key={q.ticker} quote={q} onClick={() => setSelectedTicker(q.ticker)} />
                    ))}
                  </div>
                )}
              </div>

              <PortfolioSummary />
              <RecommendedStocks onSelect={setSelectedTicker} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Full analysis view ────────────────────────────────────────
import StockDetail from '@/components/stock/StockDetail';

function StockAnalysisView({ ticker, onBack }: { ticker: string; onBack: () => void }) {
  return (
    <div className="slide-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white mb-4 transition-colors"
      >
        ← Back to Dashboard
      </button>
      <StockDetail ticker={ticker} />
    </div>
  );
}
