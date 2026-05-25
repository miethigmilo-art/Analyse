"use client";
import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PortfolioTable from "@/components/portfolio/PortfolioTable";
import AddPositionModal from "@/components/portfolio/AddPositionModal";

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

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [score, setScore] = useState(0);
  const [metrics, setMetrics] = useState({
    totalValue: 0, dailyChange: 0, dailyChangePercent: 0, totalGain: 0, totalGainPercent: 0,
  });

  const loadPositions = useCallback(async () => {
    try {
      const [posRes, analysisRes] = await Promise.all([
        fetch("/api/portfolio"),
        fetch("/api/analysis"),
      ]);
      const posData = await posRes.json();
      const analysisData = await analysisRes.json();
      const pos: Position[] = posData.positions || [];
      setPositions(pos);
      setIsDemo(posData.demo || false);
      setScore(analysisData.metrics?.portfolioScore ?? 0);
      setMetrics({
        totalValue: analysisData.metrics?.totalValue ?? 0,
        dailyChange: analysisData.metrics?.dailyChange ?? 0,
        dailyChangePercent: analysisData.metrics?.dailyChangePercent ?? 0,
        totalGain: analysisData.metrics?.totalGain ?? 0,
        totalGainPercent: analysisData.metrics?.totalGainPercent ?? 0,
      });

      if (pos.length > 0) {
        const tickers = pos.map((p) => p.ticker).join(",");
        const qRes = await fetch(`/api/stocks?tickers=${tickers}`);
        const qData = await qRes.json();
        setQuotes(qData.quotes || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPositions(); }, [loadPositions]);

  async function handleAddPosition(formData: {
    ticker: string; name: string; type: "stock" | "etf" | "crypto" | "cash";
    quantity: number; avgPrice: number; currency: string; sector?: string; country?: string;
  }) {
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to add position");
    }
    await loadPositions();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this position?")) return;
    await fetch(`/api/portfolio?id=${id}`, { method: "DELETE" });
    await loadPositions();
  }

  async function handleT212Import() {
    try {
      const res = await fetch('/api/t212');
      const d   = await res.json();
      if (d.error) { alert('T212 Fehler: ' + d.error); return; }
      const toImport = d.positions || [];
      let count = 0;
      for (const p of toImport) {
        if (!p.ticker || !p.quantity || !p.avgPrice) continue;
        const r = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...p, name: p.ticker, type: 'stock' }),
        });
        if (r.ok) count++;
      }
      alert(count + ' Positionen aus Trading 212 importiert!');
      loadData();
    } catch (e) {
      alert('Fehler: ' + String(e));
    }
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });
        return obj;
      });
      try {
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        const data = await res.json();
        alert(`Imported ${data.imported} positions successfully!`);
        await loadPositions();
      } catch {
        alert("Import failed. Check the CSV format.");
      }
    };
    input.click();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", background: "#050810" }}>
        <Sidebar score={0} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#8892b0" }}>Loading portfolio...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#050810" }}>
      <Sidebar score={score} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          totalValue={metrics.totalValue}
          dailyChange={metrics.dailyChange}
          dailyChangePercent={metrics.dailyChangePercent}
          totalReturn={metrics.totalGain}
          totalReturnPercent={metrics.totalGainPercent}
          isDemo={isDemo}
        />
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
          <PortfolioTable
            positions={positions}
            quotes={quotes}
            totalValue={metrics.totalValue}
            isDemo={isDemo}
            onDelete={handleDelete}
            onAdd={() => setShowAdd(true)}
            onImport={handleImport}
            onT212Import={handleT212Import}
          />
        </main>
      </div>
      {showAdd && (
        <AddPositionModal onClose={() => setShowAdd(false)} onAdd={handleAddPosition} />
      )}
    </div>
  );
}
