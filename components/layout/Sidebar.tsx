"use client";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", icon: "⬛", label: "Dashboard" },
  { href: "/portfolio", icon: "📁", label: "Portfolio" },
  { href: "/analysis", icon: "📈", label: "Analysis" },
  { href: "/etf-overlap", icon: "🔄", label: "ETF Overlap" },
  { href: "/ai-advisor", icon: "🤖", label: "AI Advisor" },
  { href: "/performance", icon: "🏆", label: "Performance" },
];

interface SidebarProps {
  score?: number;
}

export default function Sidebar({ score = 72 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const scoreColor = score >= 70 ? "#00d4aa" : score >= 40 ? "#f59e0b" : "#ff4757";
  const circumference = 2 * Math.PI * 20;
  const strokeDash = (score / 100) * circumference;

  return (
    <aside
      style={{
        width: "240px",
        minWidth: "240px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "rgba(10,15,30,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
        backdropFilter: "blur(20px)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #4361ee, #00d4aa)",
              borderRadius: "0.625rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              flexShrink: 0,
            }}
          >
            📊
          </div>
          <div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "0.95rem",
                background: "linear-gradient(135deg, #4361ee, #00d4aa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Portfolio
            </div>
            <div style={{ color: "#8892b0", fontSize: "0.75rem", marginTop: "-2px" }}>
              Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 0.75rem" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 0.875rem",
                borderRadius: "0.75rem",
                marginBottom: "0.25rem",
                textDecoration: "none",
                color: isActive ? "#fff" : "#8892b0",
                background: isActive
                  ? "linear-gradient(135deg, rgba(67,97,238,0.2), rgba(0,212,170,0.1))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(67,97,238,0.3)"
                  : "1px solid transparent",
                fontSize: "0.875rem",
                fontWeight: isActive ? "600" : "400",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#8892b0";
                }
              }}
            >
              <span style={{ fontSize: "1rem", width: "20px", textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Score ring at bottom */}
      <div
        style={{
          padding: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          marginTop: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="4"
            />
            <circle
              cx="26"
              cy="26"
              r="20"
              fill="none"
              stroke={scoreColor}
              strokeWidth="4"
              strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
            <text
              x="26"
              y="30"
              textAnchor="middle"
              fill={scoreColor}
              fontSize="11"
              fontWeight="700"
            >
              {score}
            </text>
          </svg>
          <div>
            <div style={{ color: "#fff", fontSize: "0.875rem", fontWeight: "600" }}>
              Portfolio Score
            </div>
            <div style={{ color: "#8892b0", fontSize: "0.75rem" }}>
              {score >= 70 ? "Good shape" : score >= 40 ? "Needs work" : "At risk"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            marginTop: "1rem",
            padding: "0.625rem",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.5rem",
            color: "#8892b0",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#ff4757";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,71,87,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#8892b0";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
