import type { ReactNode } from "react";

export default function BookingSummary({
  serviceLabel,
  dateLabel,
  timeLabel,
  durationMin,
  footer,
  ready,
}: {
  serviceLabel?: string;
  dateLabel?: string;
  timeLabel?: string;
  durationMin?: number;
  footer?: ReactNode;
  ready?: boolean;
}) {
  return (
    <aside className="summary-card" aria-label="Request summary">
      <h3>Your request</h3>
      <div className="summary-row">
        <span className="label">Service</span>
        <span className="value">{serviceLabel || <span className="text-subtle">Not selected</span>}</span>
      </div>
      <div className="summary-row">
        <span className="label">Preferred date</span>
        <span className="value">{dateLabel || <span className="text-subtle">Not selected</span>}</span>
      </div>
      <div className="summary-row">
        <span className="label">Preferred time</span>
        <span className="value">{timeLabel || <span className="text-subtle">Not selected</span>}</span>
      </div>
      <div className="summary-row">
        <span className="label">Duration</span>
        <span className="value">{durationMin ? `${durationMin} min` : <span className="text-subtle">—</span>}</span>
      </div>
      <div className="summary-divider" />
      <div className="alert alert-info" style={{ fontSize: 13 }}>
        <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-5M12 8h.01" strokeLinecap="round" />
        </svg>
        <span>
          {ready
            ? "Ready to submit. We'll confirm your appointment after reviewing your request."
            : "Complete the steps to submit your request."}
        </span>
      </div>
      {footer}
    </aside>
  );
}
