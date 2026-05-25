"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AllocationChart from "@/components/charts/AllocationChart";
import SectorChart from "@/components/charts/SectorChart";

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

const TABS = ["Risk Analysis", "Diversification", "Portfolio Score", "Warnings"] as const;
type Tab = typeof TABS[number];

function MetricCard({ label, value, sub, color = "#fff" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ color: "#8892b0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: "700", color }}>{value}</div>
      {sub && <div style={{ color: "#8892b0", fontSize: "0.8rem", marginTop: "0.25rem" }}>{sub}</div>}
    </div>
  );
}

export default function AnalysisPage() {
  const [tab, setTab] = useState<Tab>("Risk Analysis");
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalysis = useCallback(async () => {
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

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  const metrics = analysis?.metrics;
  const score = metrics?.portfolioScore ?? 0;
  const scoreColor = score >= 70 ? "#00d4aa" : score >= 40 ? "#f59e0b" : "#ff4757";

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#050810" }}>
        <Sidebar score={0} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#8892b0" }}>Analyzing portfolio...</div>
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
          <h1 style={{ color: "#fff", fontWeight: "700", fontSize: "1.5rem", marginBottom: "1.5rem" }}>Portfolio Analysis</h1>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.75rem", padding: "0.375rem", width: "fit-content" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none",
                background: tab === t ? "rgba(67,97,238,0.3)" : "transparent",
                color: tab === t ? "#fff" : "#8892b0", fontWeight: tab === t ? "600" : "400",
                fontSize: "0.875rem", cursor: "pointer", transition: "all 0.2s",
                borderColor: tab === t ? "rgba(67,97,238,0.4)" : "transparent",
                borderWidth: "1px", borderStyle: "solid",
              }}>{t}</button>
            ))}
          </div>

          {tab === "Risk Analysis" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                <MetricCard label="Portfolio Score" value={`${score}/100`} sub="Overall health" color={scoreColor} />
                <MetricCard
                  label="Risk Level"
                  value={score >= 70 ? "Moderate" : score >= 40 ? "High" : "Very High"}
                  sub="Based on concentration"
                  color={scoreColor}
                />
                <MetricCard
                  label="Diversification"
                  value={`${metrics?.scoreBreakdown.diversification ?? 0}/100`}
                  sub="Asset spread score"
                  color="#4361ee"
                />
                <MetricCard
                  label="Stability Score"
                  value={`${metrics?.scoreBreakdown.stability ?? 0}/100`}
                  sub="Defensive allocation"
                  color="#00d4aa"
                />
              </div>

              {/* Risk meter */}
              <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
                  Risk Meter
                </h3>
                <div style={{ position: "relative", height: "16px", background: "linear-gradient(90deg, #00d4aa, #f59e0b, #ff4757)", borderRadius: "999px", marginBottom: "0.75rem" }}>
                  <div style={{
                    position: "absolute",
                    left: `${100 - score}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "24px", height: "24px",
                    background: "#fff", borderRadius: "50%",
                    border: "3px solid #0a0f1e",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    transition: "left 1s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#8892b0", fontSize: "0.75rem" }}>
                  <span style={{ color: "#00d4aa" }}>Low Risk</span>
                  <span style={{ color: "#f59e0b" }}>Moderate</span>
                  <span style={{ color: "#ff4757" }}>High Risk</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="card" style={{ padding: "1.5rem" }}>
                  <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", marginBottom: "1rem" }}>Score Breakdown</h3>
                  {Object.entries(metrics?.scoreBreakdown ?? {}).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                        <span style={{ color: "#8892b0", fontSize: "0.875rem", textTransform: "capitalize" }}>{key}</span>
                        <span style={{ color: "#fff", fontWeight: "600" }}>{val}/100</span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px" }}>
                        <div style={{ height: "100%", width: `${val}%`, background: (val as number) >= 70 ? "#00d4aa" : (val as number) >= 40 ? "#f59e0b" : "#ff4757", borderRadius: "999px", transition: "width 1s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <AllocationChart data={analysis?.assetAllocation ?? []} title="Asset Mix" />
              </div>
            </div>
          )}

          {tab === "Diversification" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <SectorChart data={analysis?.sectorAllocation ?? []} />
              <AllocationChart data={analysis?.countryAllocation ?? []} title="Country Exposure" />
              <div className="card" style={{ padding: "1.5rem", gridColumn: "span 2" }}>
                <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", marginBottom: "1.25rem", textTransform: "uppercase" }}>Country Breakdown</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  {(analysis?.countryAllocation ?? []).map((c) => (
                    <div key={c.name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem 1.5rem", textAlign: "center", minWidth: "140px" }}>
                      <div style={{ color: "#fff", fontWeight: "700", fontSize: "1.5rem" }}>{c.percent.toFixed(1)}%</div>
                      <div style={{ color: "#8892b0", fontSize: "0.8rem", marginTop: "0.25rem" }}>{c.name}</div>
                      <div style={{ color: "#4a5568", fontSize: "0.75rem" }}>${(c.value / 1000).toFixed(1)}k</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Portfolio Score" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
                  <div style={{ color: "#8892b0", fontSize: "0.875rem", marginBottom: "1.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Score</div>
                  <svg width="160" height="160" viewBox="0 0 160 160" style={{ display: "block", margin: "0 auto" }}>
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle cx="80" cy="80" r="70" fill="none" stroke={scoreColor} strokeWidth="10"
                      strokeDasharray={`${(score / 100) * 2 * Math.PI * 70 * 0.75} ${2 * Math.PI * 70}`}
                      strokeDashoffset={2 * Math.PI * 70 * 0.125}
                      strokeLinecap="round"
                    />
                    <text x="80" y="75" textAnchor="middle" fill="#fff" fontSize="36" fontWeight="700">{score}</text>
                    <text x="80" y="98" textAnchor="middle" fill={scoreColor} fontSize="14">/ 100</text>
                  </svg>
                  <div style={{ marginTop: "1.5rem", color: scoreColor, fontWeight: "700", fontSize: "1.1rem" }}>
                    {score >= 70 ? "Well Diversified" : score >= 50 ? "Average Portfolio" : score >= 30 ? "Needs Improvement" : "High Risk Portfolio"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { key: "diversification", label: "Diversification", desc: "Asset & geographic spread", weight: "30%" },
                    { key: "risk", label: "Risk Management", desc: "Concentration & volatility", weight: "30%" },
                    { key: "growth", label: "Growth Potential", desc: "Tech & momentum exposure", weight: "20%" },
                    { key: "stability", label: "Stability", desc: "ETFs & defensive assets", weight: "20%" },
                  ].map(({ key, label, desc, weight }) => {
                    const val = metrics?.scoreBreakdown[key as keyof typeof metrics.scoreBreakdown] ?? 0;
                    const c = val >= 70 ? "#00d4aa" : val >= 40 ? "#f59e0b" : "#ff4757";
                    return (
                      <div key={key} className="card" style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.875rem" }}>{label}</div>
                            <div style={{ color: "#8892b0", fontSize: "0.75rem" }}>{desc} • weight: {weight}</div>
                          </div>
                          <div style={{ color: c, fontWeight: "700", fontSize: "1.25rem" }}>{val}</div>
                        </div>
                        <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", marginTop: "0.75rem" }}>
                          <div style={{ height: "100%", width: `${val}%`, background: c, borderRadius: "999px", transition: "width 1s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "Warnings" && (
            <div>
              {(metrics?.warnings ?? []).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {metrics!.warnings.map((w) => {
                    const colors = {
                      danger: { border: "rgba(255,71,87,0.3)", bg: "rgba(255,71,87,0.06)", icon: "🚨" },
                      warning: { border: "rgba(245,158,11,0.3)", bg: "rgba(245,158,11,0.06)", icon: "⚠️" },
                      info: { border: "rgba(67,97,238,0.3)", bg: "rgba(67,97,238,0.06)", icon: "ℹ️" },
                    };
                    const style = colors[w.type as keyof typeof colors] || colors.info;
                    return (
                      <div key={w.id} style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: "0.875rem", padding: "1.25rem", display: "flex", gap: "1rem" }}>
                        <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{style.icon}</span>
                        <div>
                          <div style={{ color: "#fff", fontWeight: "600", marginBottom: "0.375rem" }}>{w.title}</div>
                          <div style={{ color: "#8892b0", lineHeight: "1.5" }}>{w.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                  <div style={{ color: "#00d4aa", fontWeight: "700", fontSize: "1.25rem" }}>No Warnings</div>
                  <div style={{ color: "#8892b0", marginTop: "0.5rem" }}>Your portfolio is well-structured!</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
