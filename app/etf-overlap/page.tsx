"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface ETFOverlapData {
  combined: Record<string, number>;
  matrix: Record<string, Record<string, number>>;
  duplicates: Array<{ ticker: string; etfs: string[]; combinedWeight: number }>;
}

interface AnalysisData {
  metrics: {
    totalValue: number;
    dailyChange: number;
    dailyChangePercent: number;
    totalGain: number;
    totalGainPercent: number;
    portfolioScore: number;
  };
  etfOverlap: ETFOverlapData;
  isDemo: boolean;
}

export default function ETFOverlapPage() {
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
  const overlap = analysis?.etfOverlap;
  const score = metrics?.portfolioScore ?? 0;
  const top20Combined = Object.entries(overlap?.combined ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  const etfs = Object.keys(overlap?.matrix ?? {});

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#050810" }}>
        <Sidebar score={0} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#8892b0" }}>Analyzing ETF overlaps...</div>
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
          <h1 style={{ color: "#fff", fontWeight: "700", fontSize: "1.5rem", marginBottom: "0.5rem" }}>ETF Overlap Analysis</h1>
          <p style={{ color: "#8892b0", marginBottom: "2rem" }}>See your true underlying positions across all ETF holdings</p>

          {etfs.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
              <div style={{ color: "#fff", fontWeight: "600", fontSize: "1.1rem" }}>No ETFs in Portfolio</div>
              <div style={{ color: "#8892b0", marginTop: "0.5rem" }}>Add ETFs like IWDA, CSPX, or EQQQ to see overlap analysis</div>
            </div>
          ) : (
            <>
              {/* Duplicate warnings */}
              {(overlap?.duplicates ?? []).length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ color: "#fff", fontWeight: "600", fontSize: "1rem", marginBottom: "1rem" }}>⚠️ Double Exposure Warnings</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {overlap!.duplicates.slice(0, 5).map((d) => (
                      <div key={d.ticker} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "0.75rem", padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ color: "#fff", fontWeight: "700" }}>{d.ticker}</span>
                          <span style={{ color: "#8892b0", fontSize: "0.85rem", marginLeft: "0.75rem" }}>
                            held in {d.etfs.join(", ")}
                          </span>
                        </div>
                        <div style={{ color: "#f59e0b", fontWeight: "700" }}>
                          ~{d.combinedWeight.toFixed(1)}% combined weight
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ETF overlap matrix */}
              {etfs.length > 1 && (
                <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
                  <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
                    ETF Overlap Matrix (% shared holdings by weight)
                  </h3>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "0.625rem 1rem", color: "#8892b0", fontSize: "0.8rem" }}></th>
                        {etfs.map((e) => (
                          <th key={e} style={{ padding: "0.625rem 1rem", color: "#8892b0", fontSize: "0.8rem", textAlign: "center" }}>{e}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {etfs.map((row) => (
                        <tr key={row}>
                          <td style={{ padding: "0.625rem 1rem", color: "#fff", fontWeight: "600", fontSize: "0.875rem" }}>{row}</td>
                          {etfs.map((col) => {
                            const val = overlap?.matrix[row]?.[col] ?? 0;
                            const opacity = val / 100;
                            return (
                              <td key={col} style={{ padding: "0.625rem 1rem", textAlign: "center" }}>
                                <div style={{
                                  background: row === col ? "rgba(67,97,238,0.3)" : `rgba(${val > 50 ? "255,71,87" : val > 30 ? "245,158,11" : "0,212,170"}, ${opacity * 0.5 + 0.1})`,
                                  borderRadius: "0.375rem", padding: "0.375rem 0.625rem",
                                  color: "#fff", fontSize: "0.875rem", fontWeight: "600",
                                }}>
                                  {val}%
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top 20 combined holdings */}
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
                  Top 20 Effective Holdings (Combined ETF Weight)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {top20Combined.map(([ticker, weight], i) => (
                    <div key={ticker} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ color: "#8892b0", fontSize: "0.8rem", width: "24px", textAlign: "right", flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ color: "#fff", fontWeight: "600", width: "80px", flexShrink: 0 }}>{ticker}</div>
                      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px" }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, (weight / (top20Combined[0]?.[1] ?? 1)) * 100)}%`,
                          background: "linear-gradient(90deg, #4361ee, #00d4aa)",
                          borderRadius: "999px",
                        }} />
                      </div>
                      <div style={{ color: "#00d4aa", fontWeight: "600", width: "60px", textAlign: "right", flexShrink: 0 }}>
                        {weight.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
