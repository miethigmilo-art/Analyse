interface HeaderProps {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  isDemo?: boolean;
}

export default function Header({
  totalValue,
  dailyChange,
  dailyChangePercent,
  totalReturn,
  totalReturnPercent,
  isDemo = false,
}: HeaderProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const pnlColor = (val: number) => (val >= 0 ? "#00d4aa" : "#ff4757");
  const pnlSign = (val: number) => (val >= 0 ? "+" : "");

  return (
    <header
      style={{
        background: "rgba(10,15,30,0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div>
        <div style={{ color: "#8892b0", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
          Total Portfolio Value
          {isDemo && (
            <span
              style={{
                marginLeft: "0.5rem",
                background: "rgba(67,97,238,0.2)",
                color: "#4361ee",
                padding: "0.1rem 0.5rem",
                borderRadius: "999px",
                fontSize: "0.7rem",
                fontWeight: "600",
              }}
            >
              DEMO
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#fff",
            textShadow: "0 0 30px rgba(67,97,238,0.3)",
          }}
        >
          {formatCurrency(totalValue)}
        </div>
      </div>

      <div style={{ display: "flex", gap: "2.5rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#8892b0", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
            Today&apos;s P&L
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: "600", color: pnlColor(dailyChange) }}>
            {pnlSign(dailyChange)}{formatCurrency(dailyChange)}
          </div>
          <div style={{ fontSize: "0.8rem", color: pnlColor(dailyChangePercent) }}>
            {pnlSign(dailyChangePercent)}{dailyChangePercent.toFixed(2)}%
          </div>
        </div>

        <div style={{ width: "1px", background: "rgba(255,255,255,0.06)" }} />

        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#8892b0", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
            Total Return
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: "600", color: pnlColor(totalReturn) }}>
            {pnlSign(totalReturn)}{formatCurrency(totalReturn)}
          </div>
          <div style={{ fontSize: "0.8rem", color: pnlColor(totalReturnPercent) }}>
            {pnlSign(totalReturnPercent)}{totalReturnPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#00d4aa",
            boxShadow: "0 0 8px rgba(0,212,170,0.6)",
            animation: "pulse 2s infinite",
          }}
        />
        <span style={{ color: "#8892b0", fontSize: "0.8rem" }}>Live</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}
