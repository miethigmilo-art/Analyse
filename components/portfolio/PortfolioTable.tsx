"use client";
import { useState } from "react";

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

interface Props {
  onDeleteAll?: () => void;
  positions: Position[];
  quotes: Record<string, Quote>;
  totalValue: number;
  isDemo?: boolean;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  onImport?: () => void;
  onT212Import?: () => void;
}

type SortKey = "ticker" | "value" | "pnl" | "pnlPct" | "allocation";
type SortDir = "asc" | "desc";

const TYPE_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  stock: { bg: "rgba(67,97,238,0.15)", color: "#4361ee" },
  etf: { bg: "rgba(0,212,170,0.15)", color: "#00d4aa" },
  crypto: { bg: "rgba(114,9,183,0.15)", color: "#a855f7" },
  cash: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
};

const formatCurrency = (val: number, compact = false) => {
  if (compact && Math.abs(val) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      notation: "compact", maximumFractionDigits: 1,
    }).format(val);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val);
};

export default function PortfolioTable({
  positions, quotes, totalValue, isDemo = false, onDelete, onAdd, onImport, onT212Import, onDeleteAll,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const enriched = positions.map((pos) => {
    const quote = quotes[pos.ticker];
    const currentPrice = quote?.price ?? pos.avgPrice;
    const value = currentPrice * pos.quantity;
    const cost = pos.avgPrice * pos.quantity;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    const allocation = totalValue > 0 ? (value / totalValue) * 100 : 0;
    return { ...pos, currentPrice, value, pnl, pnlPct, allocation, quote };
  });

  const sorted = [...enriched].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    switch (sortKey) {
      case "ticker": return dir * a.ticker.localeCompare(b.ticker);
      case "value": return dir * (a.value - b.value);
      case "pnl": return dir * (a.pnl - b.pnl);
      case "pnlPct": return dir * (a.pnlPct - b.pnlPct);
      case "allocation": return dir * (a.allocation - b.allocation);
      default: return 0;
    }
  });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(k)}
      style={{
        background: "none", border: "none", color: sortKey === k ? "#fff" : "#8892b0",
        fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", display: "flex",
        alignItems: "center", gap: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em",
      }}
    >
      {label} {sortKey === k ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </button>
  );

  return (
    <div>
      {/* Actions bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ color: "#fff", fontWeight: "700", fontSize: "1.25rem" }}>
            Positions
            {isDemo && (
              <span style={{ marginLeft: "0.5rem", background: "rgba(67,97,238,0.2)", color: "#4361ee", padding: "0.1rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem" }}>
                DEMO
              </span>
            )}
          </h2>
          <p style={{ color: "#8892b0", fontSize: "0.875rem" }}>{positions.length} positions tracked</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {onDeleteAll && (
            <button onClick={() => { if(confirm("Alle Positionen löschen?")) onDeleteAll(); }} style={{
              padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer",
              background: "rgba(239,68,68,0.15)", color: "#ef4444",
              fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              🗑️ Alle löschen
            </button>
          )}
          {onT212Import && (
            <button onClick={onT212Import} style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
              background: 'rgba(0,212,170,0.15)', color: '#00d4aa',
              fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              📲 Trading 212 Import
            </button>
          )}
          {onImport && (
            <button onClick={onImport} style={{
              padding: "0.625rem 1.25rem", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.625rem",
              color: "#8892b0", fontSize: "0.85rem", cursor: "pointer",
            }}>
              📥 Import CSV
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} style={{
              padding: "0.625rem 1.25rem",
              background: "linear-gradient(135deg, #4361ee, #00d4aa)",
              border: "none", borderRadius: "0.625rem",
              color: "#fff", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer",
            }}>
              + Add Position
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Asset", key: "ticker" as SortKey },
                  { label: "Type", key: null },
                  { label: "Qty", key: null },
                  { label: "Avg Price", key: null },
                  { label: "Current", key: null },
                  { label: "Value", key: "value" as SortKey },
                  { label: "P&L", key: "pnl" as SortKey },
                  { label: "P&L %", key: "pnlPct" as SortKey },
                  { label: "Allocation", key: "allocation" as SortKey },
                  { label: "", key: null },
                ].map((col, i) => (
                  <th key={i} style={{ padding: "0.875rem 1rem", textAlign: i >= 2 ? "right" : "left" }}>
                    {col.key ? <SortBtn k={col.key} label={col.label} /> : (
                      <span style={{ color: "#8892b0", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {col.label}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((pos, idx) => {
                const badge = TYPE_BADGE_COLORS[pos.type] || TYPE_BADGE_COLORS.stock;
                const pnlColor = pos.pnl >= 0 ? "#00d4aa" : "#ff4757";
                return (
                  <tr
                    key={pos.id || pos.ticker + idx}
                    style={{
                      borderBottom: idx < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div>
                        <div style={{ color: "#fff", fontWeight: "600", fontSize: "0.95rem" }}>{pos.ticker}</div>
                        <div style={{ color: "#8892b0", fontSize: "0.75rem", marginTop: "0.1rem" }}>{pos.name.slice(0, 24)}</div>
                      </div>
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "600" }}>
                        {pos.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right", color: "#8892b0", fontSize: "0.875rem" }}>
                      {pos.quantity % 1 === 0 ? pos.quantity : pos.quantity.toFixed(4)}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right", color: "#8892b0", fontSize: "0.875rem" }}>
                      {formatCurrency(pos.avgPrice)}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right", color: "#fff", fontSize: "0.875rem" }}>
                      {formatCurrency(pos.currentPrice)}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right", color: "#fff", fontWeight: "600" }}>
                      {formatCurrency(pos.value, true)}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right", color: pnlColor, fontWeight: "600" }}>
                      {pos.pnl >= 0 ? "+" : ""}{formatCurrency(pos.pnl, true)}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                      <span style={{
                        color: pnlColor, fontWeight: "600",
                        background: pos.pnl >= 0 ? "rgba(0,212,170,0.1)" : "rgba(255,71,87,0.1)",
                        padding: "0.2rem 0.5rem", borderRadius: "0.375rem", fontSize: "0.85rem",
                      }}>
                        {pos.pnl >= 0 ? "+" : ""}{pos.pnlPct.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                        <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "600" }}>
                          {pos.allocation.toFixed(1)}%
                        </span>
                        <div style={{ width: "60px", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "999px" }}>
                          <div style={{ width: `${Math.min(100, pos.allocation)}%`, height: "100%", background: "linear-gradient(90deg, #4361ee, #00d4aa)", borderRadius: "999px" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.875rem 0.5rem", textAlign: "center" }}>
                      {onDelete && pos.id && (
                        <button
                          onClick={() => onDelete(pos.id!)}
                          style={{ background: "none", border: "none", color: "#4a5568", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ff4757"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4a5568"; }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
