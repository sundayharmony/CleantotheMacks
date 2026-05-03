"use client";

import { useState } from "react";
import Alert from "../../_components/Alert";

type Props = {
  token: string;
  clientName: string;
  propertyAddress: string | null;
  alreadySigned: boolean;
  expired: boolean;
};

export default function SignVideoReleaseForm({
  token,
  clientName,
  propertyAddress,
  alreadySigned,
  expired,
}: Props) {
  const [signerName, setSignerName] = useState(clientName);
  const [signatureText, setSignatureText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(alreadySigned);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/video-release/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signerName, signatureText, agreed }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string; alreadySigned?: boolean }
        | null;
      if (!res.ok) {
        setError(data?.error || "Failed to submit signature");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (expired) {
    return (
      <div className="card card-padded">
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>Video Release Form</h1>
        <Alert variant="warning" title="This link has expired.">
          Please contact our office and we&apos;ll send you a new release link.
        </Alert>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card card-padded text-center">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-success-soft)",
            color: "var(--color-success)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
          aria-hidden="true"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 5 5L20 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>Thank you!</h1>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Your video release form has been signed successfully.
        </p>
      </div>
    );
  }

  const canSubmit =
    !!agreed && signerName.trim().length > 0 && signatureText.trim().length > 0 && !loading;

  return (
    <form onSubmit={onSubmit} className="card card-padded" style={{ display: "grid", gap: 18 }}>
      <header>
        <span className="hero-eyebrow">Video release</span>
        <h1 style={{ fontSize: 28, marginTop: 10, marginBottom: 6 }}>Sign your release form</h1>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Please review and sign below. This authorizes Clean to the Macks to
          use photo and video of services performed at your property.
        </p>
      </header>

      <div className="terms-box" tabIndex={0} role="region" aria-label="Authorization terms">
        <p>
          I, <strong>{clientName}</strong>, authorize Clean to the Macks to
          capture and use photo and video content from services performed at my
          property for marketing and portfolio purposes (website, social media,
          and promotional materials).
        </p>
        {propertyAddress ? (
          <p>
            <strong>Property address:</strong> {propertyAddress}
          </p>
        ) : null}
        <p>
          I confirm I have authority to grant this release and waive any claim
          for compensation related to the use of these materials. I understand
          this consent can be revoked in writing at any time.
        </p>
      </div>

      <label>
        Printed name
        <input
          className="input"
          required
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="Your full legal name"
          autoComplete="name"
        />
      </label>
      <label>
        Electronic signature
        <input
          className="input"
          required
          value={signatureText}
          onChange={(e) => setSignatureText(e.target.value)}
          placeholder="Type your full name to sign"
          autoComplete="off"
        />
      </label>
      <label className="inline" style={{ alignItems: "flex-start" }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ width: 20, height: 20, accentColor: "var(--color-primary)", marginTop: 2 }}
        />
        <span style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text)" }}>
          I confirm this electronic signature is mine and I agree to this video release.
        </span>
      </label>

      {error ? <Alert variant="error" live>{error}</Alert> : null}

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={!canSubmit}
      >
        {loading ? "Submitting…" : "Sign release form"}
      </button>
    </form>
  );
}
