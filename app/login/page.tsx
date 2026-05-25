"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 3) {
        setLocked(true);
        setError("");
      } else {
        setError(`Falsches Passwort. ${3 - next} Versuch${3 - next === 1 ? "" : "e"} verbleibend.`);
        setPassword("");
      }
    }
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <div className="text-red-500 font-mono text-xl">ACCESS DENIED</div>
          <div className="text-[#475569] text-sm font-mono">Too many failed attempts.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
            ⬡ HELIX STOCKS
          </div>
          <div className="text-[#475569] text-sm">AI-Powered Stock Analysis</div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#0f1629] border border-[#1e2d4a] rounded-2xl p-8 space-y-5 shadow-2xl"
        >
          <div>
            <label className="block text-xs text-[#94a3b8] mb-2 uppercase tracking-wider">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full bg-[#141c2e] border border-[#1e2d4a] rounded-lg px-4 py-3 text-white placeholder-[#475569] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center bg-red-900/20 rounded-lg py-2 px-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 transition-colors"
          >
            {loading ? "..." : "Einloggen"}
          </button>
        </form>

        <div className="text-center text-xs text-[#2a3a5a]">
          {attempts > 0 && !locked && `${attempts}/3 Versuche`}
        </div>
      </div>
    </div>
  );
}
