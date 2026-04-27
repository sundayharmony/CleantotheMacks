"use client";

import { useState } from "react";

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
        body: JSON.stringify({
          token,
          signerName,
          signatureText,
          agreed,
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string; alreadySigned?: boolean } | null;
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
    return <p style={{ color: "tomato" }}>This video release link has expired. Please contact our office for a new link.</p>;
  }

  if (success) {
    return <p style={{ color: "limegreen" }}>Thank you. Your video release form has been signed successfully.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ display: "grid", gap: 14 }}>
      <h2 style={{ margin: 0, fontSize: 24 }}>Video Release Form</h2>
      <p style={{ color: "var(--color-muted)", margin: 0 }}>
        I, <strong>{clientName}</strong>, authorize Clean to the Macks to use
        photo and video content from services performed at my property for
        marketing and portfolio purposes (website, social media, and promotional materials).
      </p>
      {propertyAddress && (
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          <strong>Property address:</strong> {propertyAddress}
        </p>
      )}
      <label>
        Printed Name *
        <input
          className="input"
          required
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="Your full legal name"
        />
      </label>
      <label>
        Electronic Signature *
        <input
          className="input"
          required
          value={signatureText}
          onChange={(e) => setSignatureText(e.target.value)}
          placeholder="Type your full name to sign"
        />
      </label>
      <label style={{ display: "flex", gap: 10, alignItems: "start" }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <span>
          I confirm this electronic signature is mine and I agree to this video release.
        </span>
      </label>
      {error && <p style={{ color: "tomato", margin: 0 }}>{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Submitting..." : "Sign Release Form"}
      </button>
    </form>
  );
}
