"use client";
import { useState } from "react";

interface Props {
  onClose: () => void;
  onAdd: (position: PositionFormData) => Promise<void>;
}

interface PositionFormData {
  ticker: string;
  name: string;
  type: "stock" | "etf" | "crypto" | "cash";
  quantity: number;
  avgPrice: number;
  currency: string;
  sector?: string;
  country?: string;
}

const SECTORS = ["Technology", "Healthcare", "Financials", "Consumer Discretionary", "Consumer Staples", "Energy", "Utilities", "Materials", "Industrials", "Communication", "Real Estate", "ETF", "Crypto", "Other"];
const COUNTRIES = ["USA", "Germany", "UK", "France", "Japan", "China", "India", "Switzerland", "Netherlands", "Canada", "Australia", "Global", "Emerging"];

export default function AddPositionModal({ onClose, onAdd }: Props) {
  const [form, setForm] = useState<PositionFormData>({
    ticker: "", name: "", type: "stock", quantity: 0, avgPrice: 0, currency: "USD",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ticker || !form.name || form.quantity <= 0 || form.avgPrice <= 0) {
      setError("Please fill all required fields with valid values.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAdd(form);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.625rem", color: "#fff", fontSize: "0.9rem",
    outline: "none",
  };

  const labelStyle = { color: "#8892b0", fontSize: "0.8rem", fontWeight: "600", display: "block", marginBottom: "0.375rem" };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1.25rem", padding: "2rem", width: "100%", maxWidth: "480px",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#fff", fontWeight: "700", fontSize: "1.25rem" }}>Add Position</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8892b0", cursor: "pointer", fontSize: "1.25rem" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Ticker *</label>
              <input style={inputStyle} value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="AAPL" required />
            </div>
            <div>
              <label style={labelStyle}>Type *</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as PositionFormData["type"] })}
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="crypto">Crypto</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Company / Asset Name *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Apple Inc." required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Quantity *</label>
              <input type="number" min="0" step="any" style={inputStyle} value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })} placeholder="10" required />
            </div>
            <div>
              <label style={labelStyle}>Avg Buy Price *</label>
              <input type="number" min="0" step="any" style={inputStyle} value={form.avgPrice || ""} onChange={(e) => setForm({ ...form, avgPrice: parseFloat(e.target.value) || 0 })} placeholder="150.00" required />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Sector</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.sector || ""} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
                <option value="">Select sector</option>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", borderRadius: "0.5rem", padding: "0.75rem", color: "#ff4757", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "0.875rem", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.625rem",
              color: "#8892b0", cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: "0.875rem",
              background: "linear-gradient(135deg, #4361ee, #00d4aa)",
              border: "none", borderRadius: "0.625rem", color: "#fff",
              fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Adding..." : "Add Position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
