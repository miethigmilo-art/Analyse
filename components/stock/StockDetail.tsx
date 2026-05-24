'use client';

import { useState, useEffect } from 'react';
import PriceChart from '@/components/charts/PriceChart';
import AIRatingCard from '@/components/stock/AIRatingCard';
import AnalysisTable from '@/components/stock/AnalysisTable';
import NewsPanel from '@/components/stock/NewsPanel';
import InsiderPanel from '@/components/stock/InsiderPanel';

interface FullStockData {
  quote:   Record<string, unknown>;
  analyst: Record<string, unknown> | null;
  insider: unknown[];
  history: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>;
  news:    unknown[];
}

interface AIAnalysis {
  rating: string; score: number; summary: string;
  opportunities: string[]; risks: string[];
  longTermOutlook: string; dailyRating: string;
  priceTarget: number; priceTargetLow: number; priceTargetHigh: number;
  sentiment: string;
  technicalScore: number; fundamentalScore: number;
  momentumScore: number; riskLevel: string;
}

export default function StockDetail({ ticker }: { ticker: string }) {
  const [data,     setData]     = useState<FullStockData | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'news' | 'insider' | 'portfolio'>('overview');

  useEffect(() => {
    setData(null); setAnalysis(null); setLoading(true);

    async function load() {
      try {
        const res = await fetch(`/api/stocks?ticker=${ticker}`);
        const d   = await res.json();
        setData(d);
      } finally { setLoading(false); }

      // Load AI analysis separately (can be slow)
      setAiLoading(true);
      try {
        const aiRes = await fetch(`/api/analyze?ticker=${ticker}`);
        const ai    = await aiRes.json();
        setAnalysis(ai.analysis);
      } finally { setAiLoading(false); }
    }

    load();
  }, [ticker]);

  if (loading) return <LoadingSkeleton />;
  if (!data?.quote) return <div className="text-[#94a3b8] p-8 text-center">Stock not found</div>;

  const q = data.quote as Record<string, number & string>;
  const up = (q.changePct as number) >= 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 p-6 rounded-2xl bg-[#141c2e] border border-[#1e2d4a]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl font-mono font-bold text-white">{ticker}</span>
            <span className="text-sm text-[#94a3b8]">{q.name as string}</span>
            <span className="text-xs bg-[#1e2d4a] text-[#94a3b8] px-2 py-0.5 rounded">{q.sector as string}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-mono font-bold text-white">${(q.price as number).toFixed(2)}</span>
            <span className={`text-lg font-mono ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '+' : ''}{(q.change as number).toFixed(2)} ({up ? '+' : ''}{(q.changePct as number).toFixed(2)}%)
            </span>
          </div>
          <div className="text-xs text-[#475569] mt-1">Real-time via Finnhub</div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Market Cap', value: q.marketCap as number > 1e9 ? `$${((q.marketCap as number)/1e9).toFixed(1)}B` : `$${((q.marketCap as number)/1e6).toFixed(0)}M` },
            { label: 'P/E Ratio',  value: q.pe ? (q.pe as number).toFixed(1) : 'N/A' },
            { label: 'Volume',     value: q.volume as number > 1e6 ? `${((q.volume as number)/1e6).toFixed(1)}M` : (q.volume as number).toLocaleString() },
            { label: '52W High',   value: `$${(q.week52High as number).toFixed(2)}` },
            { label: '52W Low',    value: `$${(q.week52Low as number).toFixed(2)}` },
            { label: 'Beta',       value: (q.beta as number).toFixed(2) },
          ].map(m => (
            <div key={m.label}>
              <div className="text-xs text-[#475569]">{m.label}</div>
              <div className="text-sm font-mono text-white">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart + AI Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PriceChart ticker={ticker} history={data.history} currentPrice={q.price as number} />
        </div>
        <div>
          <AIRatingCard analysis={analysis} loading={aiLoading} ticker={ticker} currentPrice={q.price as number} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e2d4a]">
        {(['overview', 'news', 'insider', 'portfolio'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              tab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <AnalysisTable quote={data.quote} analyst={data.analyst} analysis={analysis} />
      )}
      {tab === 'news' && <NewsPanel news={data.news} />}
      {tab === 'insider' && <InsiderPanel trades={data.insider} />}
      {tab === 'portfolio' && (
        <div className="text-[#94a3b8] text-center py-12">
          Connect your Trading 212 account to view portfolio data.
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-36 rounded-2xl bg-[#141c2e]" />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-80 rounded-2xl bg-[#141c2e]" />
        <div className="h-80 rounded-2