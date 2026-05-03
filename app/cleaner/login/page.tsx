"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Alert from "../../_components/Alert";

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
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Cleaner Portal</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in to view your assigned jobs."
            : "Set up your password to get started."}
        </p>

        <div className="segmented" role="tablist" aria-label="Sign in or set password">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "setup"}
            className={mode === "setup" ? "active" : ""}
            onClick={() => {
              setMode("setup");
              setError("");
            }}
          >
            Set Password
          </button>
        </div>

        {error ? <Alert variant="error" live>{error}</Alert> : null}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Your work email"
              autoComplete="email"
            />
            {mode === "setup" ? (
              <span className="helper-text">Use the email your admin registered you with.</span>
            ) : null}
          </label>

          <label>
            {mode === "setup" ? "New password" : "Password"}
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "setup" ? "new-password" : "current-password"}
            />
            {mode === "setup" ? (
              <span className="helper-text">At least 6 characters</span>
            ) : null}
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign In"
                : "Set Password & Sign In"}
          </button>
        </form>

        <div className="auth-foot">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
