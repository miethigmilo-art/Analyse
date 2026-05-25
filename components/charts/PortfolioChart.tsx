"use client";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
}

interface Props {
  ticker?: string;
  totalValue?: number;
}

const RANGES = ["1W", "1M", "3M", "1Y"] as const;
type Range = typeof RANGES[number];

const rangeToYF: Record<Range, { range: string }> = {
  "1W": { range: "5d" },
  "1M": { range: "1mo" },
  "3M": { range: "3mo" },
  "1Y": { range: "1y" },
};

// Generate synthetic portfolio history based on current value
function generateSyntheticHistory(totalValue: number, range: Range): DataPoint[] {
  const points = range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : 365;
  const result: DataPoint[] = [];
  let value = totalValue * (range === "1Y" ? 0.72 : range === "3M" ? 0.88 : range === "1M" ? 0.94 : 0.97);
  const volatility = range === "1Y" ? 0.015 : 0.008;
  const trend = (totalValue - value) / points;

  for (let i = 0; i < points; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (points - i));
    const noise = (Math.random() - 0.45) * value * volatility;
    value = Math.max(value + trend + noise, totalValue * 0.5);
    result.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value),
    });
  }
  result.push({ date: "Today", value: Math.round(totalValue) });
  return result;
}

export default function PortfolioChart({ totalValue = 100000 }: Props) {
  const [range, setRange] = useState<Range>("1M");
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    setData(generateSyntheticHistory(totalValue, range));
  }, [totalValue, range]);

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const change = data.length >= 2 ? data[data.length - 1].value - data[0].value : 0;
  const isPositive = change >= 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Portfolio Value
          </h3>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "#fff", marginTop: "0.25rem" }}>
            {formatCurrency(totalValue)}
          </div>
          <div style={{ fontSize: "0.875rem", color: isPositive ? "#00d4aa" : "#ff4757", marginTop: "0.25rem" }}>
            {isPositive ? "+" : ""}{formatCurrency(change)} ({range})
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem", padding: "0.25rem" }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: "0.375rem",
                border: "none",
                background: range === r ? "rgba(67,97,238,0.3)" : "transparent",
                color: range === r ? "#fff" : "#8892b0",
                fontSize: "0.8rem",
                fontWeight: range === r ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#4361ee" : "#ff4757"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? "#4361ee" : "#ff4757"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8892b0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minVal * 0.98, maxVal * 1.02]}
            tick={{ fill: "#8892b0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={55}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,15,30,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
            formatter={(value: number) => [formatCurrency(value), "Portfolio Value"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#4361ee" : "#ff4757"}
            strokeWidth={2}
            fill="url(#colorValue)"
            dot={false}
            activeDot={{ r: 4, fill: isPositive ? "#4361ee" : "#ff4757" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
