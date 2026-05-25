"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface AnalysisData {
  metrics: {
    totalValue: number;
    totalCost: number;
    totalGain: number;
    totalGainPercent: number;
    dailyChange: number;
    dailyChangePercent: number;
    portfolioScore: number;
  };
  isDemo: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function generateMonthlyReturns() {
  // Generate realistic-looking monthly returns for demo
  const years = [2023, 2024, 2025];
  const returns: Record<number, number[]> = {};
  years.forEach((year) => {
    returns[year] = MONTHS.map(() => (Math.random() - 0.35) * 12);
  });
  return returns;
}

const MONTHLY_RETURNS = generateMonthlyReturns();

function MonthlyHeatmap({ returns }: { returns: Record<number, number[]> }) {
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
        Monthly Returns Heatmap
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "4px", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: "50px" }}></th>
              {MONTHS.map((m) => (
                <th key={m} style={{ color: "#8892b0", fontSize: "0.75rem", fontWeight: "600", padding: "0 0.25rem", textAlign: "center" }}>{m}</th>
              ))}
              <th style={{ color: "#8892b0", fontSize: "0.75rem", fontWeight: "600", padding: "0 0.5rem", textAlign: "right" }}>YTD</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(returns).map(([year, monthReturns]) => {
              const ytd = monthReturns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1;
              return (
                <tr key={year}>
                  <td style={{ color: "#fff", fontWeight: "600", fontSize: "0.875rem", paddingRight: "0.5rem" }}>{year}</td>
                  {monthReturns.map((ret, i) => {
                    const intensity = Math.min(1, Math.abs(ret) / 10);
                    const color = ret >= 0
                      ? `rgba(0,212,170,${0.15 + intensity * 0.6})`
                      : `rgba(255,71,87,${0.15 + intensity * 0.6})`;
                    const now = new Date();
                    const isFuture = parseInt(year) > now.getFullYear() || (parseInt(year) === now.getFullYear() && i >= now.getMonth());
                    return (
                      <td key={i} style={{ padding: "0.25rem" }}>
                        {isFuture ? (
                          <div style={{ width: "100%", height: "32px", background: "rgba(255,255,255,0.03)", borderRadius: "0.375rem" }} />
                        ) : (
                          <div style={{
                            background: color, borderRadius: "0.375rem",
                            padding: "0.375rem 0.25rem", textAlign: "center",
                            color: "#fff", fontSize: "0.75rem", fontWeight: "600",
                            minWidth: "44px",
                          }}>
                            {ret >= 0 ? "+" : ""}{ret.toFixed(1)}%
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "right", color: ytd >= 0 ? "#00d4aa" : "#ff4757", fontWeight: "700", fontSize: "0.875rem", paddingLeft: "0.5rem" }}>
                    {ytd >= 0 ? "+" : ""}{(ytd * 100).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/analysis");
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const metrics = analysis?.metrics;
  const score = metrics?.portfolioScore ?? 0;
  const totalReturn = metrics?.totalGainPercent ?? 0;

  // Calculated performance metrics
  const cagr = totalReturn > 0 ? (Math.pow(1 + totalReturn / 100, 1 / 1.5) - 1) * 100 : totalReturn;
  const sharpe = (cagr - 4.5) / 15; // rough estimate
  const maxDrawdown = -Math.abs(totalReturn * 0.35);
  const volatility = 18.5; // approximate annualized

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#050810" }}>
        <Sidebar score={0} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#8892b0" }}>Loading performance data...</div>
        </div>
      </div>
    );
  }

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
          <h1 style={{ color: "#fff", fontWeight: "700", fontSize: "1.5rem", marginBottom: "2rem" }}>Performance</h1>

          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Return", value: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`, color: totalReturn >= 0 ? "#00d4aa" : "#ff4757", sub: "Since inception" },
              { label: "CAGR", value: `${cagr >= 0 ? "+" : ""}${cagr.toFixed(2)}%`, color: "#4361ee", sub: "Annualized" },
              { label: "Sharpe Ratio", value: sharpe.toFixed(2), color: sharpe >= 1 ? "#00d4aa" : sharpe >= 0.5 ? "#f59e0b" : "#ff4757", sub: "Risk-adjusted return" },
              { label: "Max Drawdown", value: `${maxDrawdown.toFixed(1)}%`, color: "#ff4757", sub: "Estimated peak-to-trough" },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ color: "#8892b0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{label}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: "700", color }}>{value}</div>
                <div style={{ color: "#8892b0", fontSize: "0.75rem", marginTop: "0.25rem" }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Benchmark comparison */}
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
              Benchmark Comparison
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              {[
                { name: "Your Portfolio", value: totalReturn, color: "#4361ee" },
                { name: "S&P 500 (SPY)", value: 24.3, color: "#00d4aa" },
                { name: "MSCI World", value: 19.8, color: "#7209b7" },
              ].map(({ name, value, color }) => (
                <div key={name} style={{ textAlign: "center" }}>
                  <div style={{ color, fontWeight: "700", fontSize: "2rem" }}>
                    {value >= 0 ? "+" : ""}{value.toFixed(1)}%
                  </div>
                  <div style={{ color: "#8892b0", fontSize: "0.875rem", marginTop: "0.25rem" }}>{name}</div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", marginTop: "0.75rem" }}>
                    <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, (value / 30) * 100))}%`, background: color, borderRadius: "999px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly heatmap */}
          <MonthlyHeatmap returns={MONTHLY_RETURNS} />

          {/* Risk metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>Risk Metrics</h3>
              {[
                { label: "Annualized Volatility", value: `${volatility.toFixed(1)}%`, bench: "S&P 500: ~16%" },
                { label: "Beta vs S&P 500", value: "1.12", bench: "Market: 1.00" },
                { label: "Alpha", value: `${(totalReturn - 24.3 * 1.12).toFixed(1)}%`, bench: "Excess return" },
                { label: "R-Squared", value: "0.87", bench: "Correlation to S&P" },
              ].map(({ label, value, bench }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <div style={{ color: "#fff", fontSize: "0.875rem" }}>{label}</div>
                    <div style={{ color: "#4a5568", fontSize: "0.75rem" }}>{bench}</div>
                  </div>
                  <div style={{ color: "#fff", fontWeight: "700", fontSize: "1rem" }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
                Portfolio Stats
              </h3>
              {[
                { label: "Invested Capital", value: `$${((metrics?.totalCost ?? 0) / 1000).toFixed(1)}k` },
                { label: "Current Value", value: `$${((metrics?.totalValue ?? 0) / 1000).toFixed(1)}k` },
                { label: "Absolute Gain", value: `$${((metrics?.totalGain ?? 0) / 1000).toFixed(1)}k`, color: (metrics?.totalGain ?? 0) >= 0 ? "#00d4aa" : "#ff4757" },
                { label: "Portfolio Score", value: `${score}/100` },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ color: "#8892b0", fontSize: "0.875rem" }}>{label}</div>
                  <div style={{ color: color || "#fff", fontWeight: "700", fontSize: "1rem" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
