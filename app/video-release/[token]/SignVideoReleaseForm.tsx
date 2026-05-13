"use client";

import { useState } from "react";
import Alert from "../../_components/Alert";
import VideoSignaturePad from "./VideoSignaturePad";
import "./video-release-document.css";

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
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(alreadySigned);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!signatureDataUrl) {
      setError("Please draw your signature in the signature box.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/video-release/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signerName: signerName.trim(),
          signatureImageDataUrl: signatureDataUrl,
          agreed,
        }),
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
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>Thank you</h1>
        <p className="text-muted" style={{ fontSize: 15 }}>
          Your video / media release has been signed and recorded. You may close this page.
        </p>
      </div>
    );
  }

  const canSubmit =
    agreed &&
    signerName.trim().length > 0 &&
    !!signatureDataUrl &&
    !loading;

  return (
    <form onSubmit={onSubmit} className="release-doc" noValidate>
      <header className="release-doc__masthead">
        <div className="release-doc__masthead-badge">Legal authorization</div>
        <h1>Video &amp; media release — authorization to use recordings</h1>
        <p className="release-doc__masthead-meta">
          Clean to the Macks &nbsp;·&nbsp; Electronic signature permitted under the U.S. E-SIGN Act and
          equivalent state laws where applicable.
        </p>
      </header>

      <div className="release-doc__body">
        <p className="release-doc__intro">
          This document authorizes Clean to the Macks (&quot;Company&quot;) to capture and use
          photographic and video recordings of services performed at the property identified below,
          for business purposes including marketing, portfolio, website, and social media, subject to
          the terms in Sections 1–5.
        </p>

        <dl className="release-doc__parties">
          <div>
            <dt>Client / authorized party</dt>
            <dd>{clientName}</dd>
          </div>
          {propertyAddress ? (
            <div>
              <dt>Service location</dt>
              <dd>{propertyAddress}</dd>
            </div>
          ) : null}
        </dl>

        <ol className="release-doc__clauses">
          <li>
            I confirm I have authority to grant this release on behalf of myself and, where applicable,
            other residents or owners of the premises.
          </li>
          <li>
            I authorize Company and its personnel to record still images and video before, during, and
            after scheduled services at the address above, without additional compensation for such use
            as described in this release.
          </li>
          <li>
            I grant Company a non-exclusive, royalty-free license to use, reproduce, edit, distribute,
            and publicly display those recordings in connection with Company&apos;s business, including
            online and print marketing.
          </li>
          <li>
            I understand I may request in writing that Company cease using identifiable recordings
            going forward; Company will use reasonable efforts to comply where practicable and will not
            be required to recall materials already distributed.
          </li>
          <li>
            I release Company from claims arising from authorized use consistent with this document,
            except for gross negligence or willful misconduct to the extent such a limitation is
            permitted by law.
          </li>
        </ol>

        <p className="release-doc__esign-notice">
          By signing below, you agree this electronic record is valid and enforceable to the same extent
          as a handwritten signature. Your IP address and browser information may be stored with this
          submission for audit purposes.
        </p>

        <div>
          <p className="release-doc__section-title">Printed full legal name</p>
          <label className="release-doc__label" htmlFor="release-signer-name">
            Type your full legal name as it should appear on file
          </label>
          <input
            id="release-signer-name"
            className="input"
            required
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="e.g. Jane Q. Public"
            autoComplete="name"
            style={{ marginBottom: 22 }}
          />
        </div>

        <div>
          <p className="release-doc__section-title">Signature</p>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 10 }}>
            Draw your signature in the box — this replaces a wet ink signature for this authorization.
          </p>
          <div className="release-doc__signature-block">
            <VideoSignaturePad onSignatureChange={setSignatureDataUrl} />
          </div>
        </div>

        <label className="release-doc__checkbox-row">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <span>
            I have read Sections 1–5 and the notice above, and I voluntarily agree to this video &amp;
            media release.
          </span>
        </label>

        {error ? <Alert variant="error" live>{error}</Alert> : null}

        <button type="submit" className="btn btn-primary btn-lg release-doc__submit" disabled={!canSubmit}>
          {loading ? "Submitting…" : "Sign and submit release"}
        </button>
      </div>
    </form>
  );
}
