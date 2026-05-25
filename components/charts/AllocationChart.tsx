"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Item {
  name: string;
  value: number;
  percent: number;
  color: string;
}

interface Props {
  data: Item[];
  title: string;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export default function AllocationChart({ data, title }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", marginBottom: "1rem" }}>{title}</h3>
        <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a5568" }}>No data</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ color: "#8892b0", fontSize: "0.875rem", fontWeight: "600", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(10,15,30,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.5rem",
              color: "#fff",
            }}
            formatter={(value: number, name: string) => [
              `${formatCurrency(value)} (${data.find((d) => d.name === name)?.percent.toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
        {data.map((item) => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <span style={{ color: "#8892b0", fontSize: "0.8rem" }}>{item.name}</span>
            </div>
            <span style={{ color: "#fff", fontSize: "0.8rem", fontWeight: "600" }}>
              {item.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
