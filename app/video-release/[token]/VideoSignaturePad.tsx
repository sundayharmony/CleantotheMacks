"use client";

import { useCallback, useEffect, useRef } from "react";
import SignaturePad from "signature_pad";

type Props = {
  /** Called when the user finishes a stroke or clears the pad */
  onSignatureChange: (dataUrl: string | null) => void;
};

/**
 * Follows signature_pad resize guidance: create the pad first, then set canvas
 * pixel size, scale the 2D context for DPR, and call pad.clear() so isEmpty is correct.
 */
export default function VideoSignaturePad({ onSignatureChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const onChangeRef = useRef(onSignatureChange);
  onChangeRef.current = onSignatureChange;

  const syncFromPad = useCallback(() => {
    const pad = padRef.current;
    if (!pad) return;
    if (pad.isEmpty()) onChangeRef.current(null);
    else onChangeRef.current(pad.toDataURL("image/png"));
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const wrapEl = wrap;
    const canvasEl = canvas;

    const pad = new SignaturePad(canvasEl, {
      minWidth: 0.45,
      maxWidth: 2.4,
      penColor: "#0f172a",
      backgroundColor: "#ffffff",
    });
    padRef.current = pad;
    pad.addEventListener("endStroke", syncFromPad);

    function resize() {
      const width = Math.max(wrapEl.clientWidth, 280);
      const height = 180;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvasEl.width = Math.floor(width * ratio);
      canvasEl.height = Math.floor(height * ratio);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      const ctx = canvasEl.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
      }
      pad.clear();
      onChangeRef.current(null);
    }

    resize();

    return () => {
      pad.off();
      padRef.current = null;
    };
  }, [syncFromPad]);

  function handleClear() {
    padRef.current?.clear();
    onSignatureChange(null);
  }

  return (
    <div className="release-signature-pad">
      <div ref={wrapRef} className="release-signature-pad__canvas-wrap">
        <canvas ref={canvasRef} className="release-signature-pad__canvas" aria-label="Draw your signature" />
      </div>
      <div className="release-signature-pad__actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={handleClear}>
          Clear signature
        </button>
        <span className="release-signature-pad__hint">Sign with your finger or mouse / trackpad</span>
      </div>
    </div>
  );
}
