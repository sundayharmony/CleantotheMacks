"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CleanerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? "/api/cleaner-portal/login"
          : "/api/cleaner-portal/set-password";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push("/cleaner");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, marginBottom: 8, textAlign: "center" }}>
          Cleaner Portal
        </h1>
        <p className="section-subtitle" style={{ textAlign: "center", marginBottom: 32 }}>
          {mode === "login"
            ? "Sign in to view your assigned jobs."
            : "Set up your password to get started."}
        </p>

        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 24,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background: mode === "login" ? "var(--color-primary)" : "var(--color-surface)",
              color: mode === "login" ? "#fff" : "var(--color-text)",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("setup"); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background: mode === "setup" ? "var(--color-primary)" : "var(--color-surface)",
              color: mode === "setup" ? "#fff" : "var(--color-text)",
            }}
          >
            Set Password
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.3)",
              color: "#dc2626",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Email *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Your work email"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: 15,
              }}
            />
            {mode === "setup" && (
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                Use the email your admin registered you with.
              </span>
            )}
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {mode === "setup" ? "New Password *" : "Password *"}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: 15,
              }}
            />
            {mode === "setup" && (
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                At least 6 characters
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginTop: 8, padding: "12px 0", fontSize: 16, width: "100%" }}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Set Password & Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/" style={{ color: "var(--color-muted)", fontSize: 14 }}>
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
