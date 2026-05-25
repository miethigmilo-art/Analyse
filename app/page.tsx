"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PortfolioChart from "@/components/charts/PortfolioChart";
import AllocationChart from "@/components/charts/AllocationChart";
import SectorChart from "@/components/charts/SectorChart";

interface Position {
  id?: string;
  ticker: string;
  name: string;
  type: string;
  quantity: number;
  avgPrice: number;
  currency: string;
  sector?: string;
  country?: string;
}

interface Quote {
  price: number;
  change: number;
  changePercent: number;
}

interface AnalysisData {
  metrics: {
    totalValue: number;
    totalCost: number;
    totalGain: number;
    totalGainPercent: number;
    dailyChange: number;
    dailyChangePercent: number;
    portfolioScore: number;
    scoreBreakdown: { diversification: number; risk: number; growth: number; stability: number };
    warnings: Array<{ id: string; type: string; title: string; description: string }>;
  };
  assetAllocation: Array<{ name: string; value: number; percent: number; color: string }>;
  sectorAllocation: Array<{ name: string; value: number; percent: number; color: string }>;
  countryAllocation: Array<{ name: string; value: number; percent: number; color: string }>;
  isDemo: boolean;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

function WarningCard({ warning }: { warning: { type: string; title: string; description: string } }) {
  const colors = {
    danger: { border: "rgba(255,71,87,0.3)", bg: "rgba(255,71,87,0.06)", icon: "🚨", iconColor: "#ff4757" },
    warning: { border: "rgba(245,158,11,0.3)", bg: "rgba(245,158,11,0.06)", icon: "⚠️", iconColor: "#f59e0b" },
    info: { border: "rgba(67,97,238,0.3)", bg: "rgba(67,97,238,0.06)", icon: "ℹ️", iconColor: "#4361ee" },
  };
  const style = colors[warning.type as keyof typeof colors] || colors.info;
  return (
    <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: "0.75rem", padding: "1rem", display: "flex", gap: "0.75rem" }}>
      <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{style.icon}</span>
      <div>
        <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.875rem", marginBottom: "0.25rem" }}>{warning.title}</div>
        <div style={{ color: "#8892b0", fontSize: "0.8rem", lineHeight: "1.4" }}>{warning.description}</div>
      </div>
    </div>
  );
}

function ScoreGauge({ score, breakdown }: { score: number; breakdown: { diversification: number; risk: number; growth: number; stability: number } }) {
  const scoreColor = score >= 70 ? "#00d4aa" : score >= 40 ? "#f59e0b" : "#ff4757";
  const circumference = 2 * Math.PI * 60;
  const strokeDash = (score / 100) * circumference * 0.75;

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
        Portfolio Score
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
          <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="70" cy="70" r="60" fill="none" stroke={scoreColor} strokeWidth="8"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeDashoffset={circumference * 0.125}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.5s ease, stroke 0.5s ease" }}
          />
          <text x="70" y="65" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700">{score}</text>
          <text x="70" y="85" textAnchor="middle" fill={scoreColor} fontSize="11">/100</text>
        </svg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ color: "#8892b0", fontSize: "0.75rem", textTransform: "capitalize" }}>{key}</span>
                <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: "600" }}>{val}</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "999px" }}>
                <div style={{
                  height: "100%", width: `${val}%`,
                  background: val >= 70 ? "#00d4aa" : val >= 40 ? "#f59e0b" : "#ff4757",
                  borderRadius: "999px", transition: "width 1s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopHoldings({ positions, quotes, totalValue }: { positions: Position[]; quotes: Record<string, Quote>; totalValue: number }) {
  const sorted = [...positions]
    .map((p) => {
      const price = quotes[p.ticker]?.price ?? p.avgPrice;
      const value = price * p.quantity;
      return { ...p, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
        Top Holdings
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {sorted.map((pos, i) => (
          <div key={pos.ticker} style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "0.5rem",
              background: `linear-gradient(135deg, ${["#4361ee","#00d4aa","#7209b7","#f59e0b","#ef4444"][i]}, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: "700", fontSize: "0.75rem", flexShrink: 0,
            }}>
              {pos.ticker.slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#fff", fontWeight: "600", fontSize: "0.875rem" }}>{pos.ticker}</span>
                <span style={{ color: "#fff", fontSize: "0.875rem", fontWeight: "600" }}>{pos.pct.toFixed(1)}%</span>
              </div>
              <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", marginTop: "0.375rem" }}>
                <div style={{
                  height: "100%", width: `${Math.min(100, pos.pct)}%`,
                  background: ["linear-gradient(90deg, #4361ee, #7209b7)","linear-gradient(90deg, #00d4aa, #4361ee)","linear-gradient(90deg, #7209b7, #4361ee)","linear-gradient(90deg, #f59e0b, #ef4444)","linear-gradient(90deg, #ef4444, #7209b7)"][i],
                  borderRadius: "999px",
                }} />
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: "#fff", fontSize: "0.8rem", fontWeight: "600" }}>{formatCurrency(pos.value)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [analysisRes, positionsRes] = await Promise.all([
        fetch("/api/analysis"),
        fetch("/api/portfolio"),
      ]);
      const analysisData = await analysisRes.json();
      const positionsData = await positionsRes.json();
      setAnalysis(analysisData);
      setPositions(positionsData.positions || []);

      // Fetch quotes
      const tickers = (positionsData.positions || []).map((p: Position) => p.ticker).join(",");
      if (tickers) {
        const quotesRes = await fetch(`/api/stocks?tickers=${tickers}`);
        const quotesData = await quotesRes.json();
        setQuotes(quotesData.quotes || {});
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#050810" }}>
        <Sidebar score={0} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
            <div style={{ color: "#8892b0" }}>Loading portfolio data...</div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = analysis?.metrics;
  const score = metrics?.portfolioScore ?? 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#050810" }}>
      <Sidebar score={score} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          totalValue={metrics?.totalValue ?? 0}
          dailyChange={metrics?.dailyChange ?? 0}
          dailyChangePercent={metrics?.dailyChangePercent ?? 0}
          totalReturn={metrics?.totalGain ?? 0}
          totalReturnPercent={metrics?.totalGainPercent ?? 0}
          isDemo={analysis?.isDemo}
        />
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          {/* Background orbs */}
          <div style={{ position: "fixed", top: "15%", right: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(67,97,238,0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "fixed", bottom: "10%", left: "15%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", zIndex: 0 }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Portfolio chart - full width */}
            <div style={{ marginBottom: "1.5rem" }}>
              <PortfolioChart totalValue={metrics?.totalValue ?? 0} />
            </div>

            {/* Row 2: Allocation + Sectors + Score */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <AllocationChart data={analysis?.assetAllocation ?? []} title="Asset Allocation" />
              <SectorChart data={analysis?.sectorAllocation ?? []} />
              <ScoreGauge
                score={score}
                breakdown={metrics?.scoreBreakdown ?? { diversification: 0, risk: 0, growth: 0, stability: 0 }}
              />
            </div>

            {/* Row 3: Top Holdings + Warnings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <TopHoldings positions={positions} quotes={quotes} totalValue={metrics?.totalValue ?? 0} />
              <div>
                <div style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                  Risk Alerts
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {(metrics?.warnings ?? []).length > 0 ? (
                    metrics!.warnings.map((w) => <WarningCard key={w.id} warning={w} />)
                  ) : (
                    <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                      <div style={{ color: "#00d4aa", fontWeight: "600" }}>No critical alerts</div>
                      <div style={{ color: "#8892b0", fontSize: "0.85rem", marginTop: "0.25rem" }}>Your portfolio looks healthy!</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
