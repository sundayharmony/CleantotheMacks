"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const next =
      new URLSearchParams(window.location.search).get("next") || "/admin";

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, next }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Login failed");
      return;
    }

    const data = (await res.json()) as { redirectTo?: string };
    window.location.href = data.redirectTo || "/admin";
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Admin Login</h1>
      <p style={{ opacity: 0.8 }}>Enter the admin password to continue.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{ padding: 10, borderRadius: 8, border: "1px solid #555" }}
          />
        </label>

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #555",
            cursor: "pointer",
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {error ? (
          <div style={{ color: "tomato" }}>{error}</div>
        ) : null}
      </form>
    </main>
  );
}
