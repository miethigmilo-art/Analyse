"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Item {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface Props {
  data: Item[];
}

export default function SectorChart({ data }: Props) {
  if (!data || data.length === 0) return null;
  const top8 = data.slice(0, 8);

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Sector Distribution
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top8} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#8892b0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "#8892b0", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,15,30,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
            formatter={(value: number) => [`${(value as number).toFixed(1)}%`, "Allocation"]}
          />
          <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
            {top8.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
