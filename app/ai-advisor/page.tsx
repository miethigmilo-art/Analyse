"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

const SUGGESTIONS = [
  "How risky is my portfolio?",
  "Which ETFs overlap?",
  "How to optimize for better returns?",
  "Should I add more international exposure?",
  "What dividend stocks should I consider?",
  "How is my crypto allocation?",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "1rem" }}>
      {!isUser && (
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "linear-gradient(135deg, #4361ee, #00d4aa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginRight: "0.75rem", alignSelf: "flex-end",
        }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser
          ? "linear-gradient(135deg, #4361ee, rgba(67,97,238,0.6))"
          : "rgba(255,255,255,0.05)",
        border: `1px solid ${isUser ? "rgba(67,97,238,0.4)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: isUser ? "1.25rem 1.25rem 0.25rem 1.25rem" : "0.25rem 1.25rem 1.25rem 1.25rem",
        padding: "0.875rem 1.125rem",
      }}>
        <div style={{
          color: "#fff", fontSize: "0.9rem", lineHeight: "1.6",
          whiteSpace: "pre-wrap",
        }}>
          {msg.content.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginLeft: "0.75rem", alignSelf: "flex-end",
          fontSize: "1.1rem",
        }}>
          👤
        </div>
      )}
    </div>
  );
}

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I\'m your Portfolio Intelligence AI Advisor. I have access to your real portfolio data and can help you analyze risk, find ETF overlaps, optimize returns, and answer any investment questions. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const userMessage = text || input;
    if (!userMessage.trim() || loading) return;
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.response || "Sorry, I could not generate a response.", timestamp: new Date() }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, there was an error connecting to the AI service. Please try again.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#050810" }}>
      <Sidebar score={72} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,15,30,0.8)",
          backdropFilter: "blur(20px)",
          display: "flex", alignItems: "center", gap: "1rem",
        }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%",
            background: "linear-gradient(135deg, #4361ee, #00d4aa)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem",
          }}>🤖</div>
          <div>
            <div style={{ color: "#fff", fontWeight: "700" }}>AI Portfolio Advisor</div>
            <div style={{ color: "#00d4aa", fontSize: "0.8rem" }}>● Online • Portfolio data connected</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #4361ee, #00d4aa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginRight: "0.75rem",
              }}>🤖</div>
              <div style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.25rem 1.25rem 1.25rem 1.25rem",
                padding: "0.875rem 1.125rem",
              }}>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "#4361ee",
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div style={{ padding: "0 2rem 1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button key={s} onClick={() => sendMessage(s)} style={{
                padding: "0.5rem 1rem",
                background: "rgba(67,97,238,0.1)",
                border: "1px solid rgba(67,97,238,0.25)",
                borderRadius: "999px",
                color: "#8892b0", fontSize: "0.8rem", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(67,97,238,0.5)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#8892b0"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(67,97,238,0.25)"; }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: "1rem 2rem 1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,15,30,0.6)",
        }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about your portfolio, risk, ETF overlaps, strategies..."
              disabled={loading}
              style={{
                flex: 1, padding: "0.875rem 1.25rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.875rem", color: "#fff", fontSize: "0.9rem",
                outline: "none", resize: "none",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: "48px", height: "48px",
                background: loading || !input.trim()
                  ? "rgba(67,97,238,0.3)"
                  : "linear-gradient(135deg, #4361ee, #00d4aa)",
                border: "none", borderRadius: "0.875rem",
                color: "#fff", fontSize: "1.25rem",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
          }
          input:focus { border-color: rgba(67,97,238,0.4) !important; }
        `}</style>
      </div>
    </div>
  );
}
