"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Invalid password");
        if (data.locked) setLocked(true);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #050810 0%, #0a0f1e 50%, #050810 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(67,97,238,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "20%",
          right: "10%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          backdropFilter: "blur(20px)",
          animation: "fadeIn 0.4s ease",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #4361ee, #00d4aa)",
              borderRadius: "1rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              marginBottom: "1rem",
            }}
          >
            📊
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #4361ee, #00d4aa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Portfolio Intelligence
          </h1>
          <p style={{ color: "#8892b0", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            AI-powered portfolio analytics
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                color: "#8892b0",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={locked || loading}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${error ? "rgba(255,71,87,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              autoFocus
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(255,71,87,0.1)",
                border: "1px solid rgba(255,71,87,0.3)",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
                color: "#ff4757",
                fontSize: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || locked || !password}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: loading || locked || !password
                ? "rgba(67,97,238,0.4)"
                : "linear-gradient(135deg, #4361ee, #00d4aa)",
              border: "none",
              borderRadius: "0.75rem",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: loading || locked || !password ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Authenticating..." : locked ? "Account Locked" : "Access Dashboard"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            color: "#4a5568",
            fontSize: "0.8rem",
            marginTop: "1.5rem",
          }}
        >
          Secured access • Portfolio Intelligence v1.0
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus {
          border-color: rgba(67,97,238,0.6) !important;
        }
      `}</style>
    </div>
  );
}
