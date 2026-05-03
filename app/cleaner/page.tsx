"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CleanerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentType: string;
  hourlyRate: number | null;
}

interface Job {
  id: string;
  createdAt: string;
  status: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  flatRateAmount: number | null;
  totalPay: number | null;
  completionNotes: string | null;
  booking: {
    id: string;
    name: string;
    address: string;
    homeSize: string;
    sqft: string | null;
    notes: string | null;
    scheduledDate: string | null;
    serviceType: string | null;
    phone: string | null;
  };
}

function formatDate(d: string | null) {
  if (!d) return "Not set";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function jobPillClass(status: string): string {
  switch (status) {
    case "assigned":
      return "pill-info";
    case "in_progress":
      return "pill-warning";
    case "completed":
      return "pill-success";
    case "cancelled":
      return "pill-danger";
    default:
      return "pill-neutral";
  }
}

export default function CleanerDashboard() {
  const router = useRouter();
  const [cleaner, setCleaner] = useState<CleanerInfo | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<Job | null>(null);
  const [notes, setNotes] = useState("");

  const loadData = useCallback(() => {
    fetch("/api/cleaner-portal/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        setCleaner(data.cleaner);
        setJobs(data.jobs || []);
      })
      .catch(() => {
        router.push("/cleaner/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/cleaner-portal/logout", { method: "POST" });
    router.push("/cleaner/login");
  }

  async function updateJob(jobId: string, body: Record<string, unknown>) {
    setUpdatingId(jobId);
    try {
      const res = await fetch(`/api/cleaner-portal/job/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) loadData();
    } catch {
      /* ignore */
    }
    setUpdatingId(null);
  }

  async function submitNotes() {
    if (!notesModal) return;
    await updateJob(notesModal.id, { completionNotes: notes, status: "completed" });
    setNotesModal(null);
    setNotes("");
  }

  if (loading) {
    return (
      <section className="section" style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
        <p className="text-muted">Loading your dashboard…</p>
      </section>
    );
  }

  if (!cleaner) return null;

  const assigned = jobs.filter((j) => j.status === "assigned");
  const inProgress = jobs.filter((j) => j.status === "in_progress");
  const completed = jobs.filter((j) => j.status === "completed");
  const totalEarned = completed.reduce((sum, j) => sum + (j.totalPay || 0), 0);

  return (
    <>
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}
          >
            <div>
              <span className="hero-eyebrow">Cleaner portal</span>
              <h1 className="section-title" style={{ marginTop: 10, marginBottom: 4 }}>
                Hi, {cleaner.name.split(" ")[0]}
              </h1>
              <p className="text-muted">{cleaner.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-outline"
            >
              {loggingOut ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </div>
      </section>

      <section className="section section-tight" style={{ paddingTop: 24 }}>
        <div className="container">
          <div
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Assigned
              </span>
              <p style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{assigned.length}</p>
            </div>
            <div>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                In progress
              </span>
              <p style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "var(--color-warning)" }}>
                {inProgress.length}
              </p>
            </div>
            <div>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Completed
              </span>
              <p style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "var(--color-success)" }}>
                {completed.length}
              </p>
            </div>
            <div>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Earnings
              </span>
              <p style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>${totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container full-bleed-auto">
          <h2 className="section-title" style={{ fontSize: 22, marginBottom: 16 }}>
            Active jobs
          </h2>
          {assigned.length === 0 && inProgress.length === 0 ? (
            <div className="card text-center" style={{ padding: "36px 24px" }}>
              <p className="text-muted">No active jobs right now. Check back soon!</p>
            </div>
          ) : (
            <div className="stack" style={{ gap: 16 }}>
              {[...inProgress, ...assigned].map((job) => (
                <div key={job.id} className="card stack" style={{ gap: 14 }}>
                  <div
                    className="row"
                    style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}
                  >
                    <div>
                      <strong style={{ fontSize: 17 }}>{job.booking.name}</strong>
                      <span className={`pill ${jobPillClass(job.status)}`} style={{ marginLeft: 10 }}>
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className="helper-text">{formatDate(job.booking.scheduledDate)}</span>
                  </div>

                  <div className="job-meta">
                    <div>
                      <span className="label">Address</span> {job.booking.address}
                    </div>
                    <div>
                      <span className="label">Size</span> {job.booking.homeSize}
                      {job.booking.sqft ? ` (${job.booking.sqft} sqft)` : ""}
                    </div>
                    {job.booking.phone ? (
                      <div>
                        <span className="label">Phone</span>{" "}
                        <a href={`tel:${job.booking.phone}`} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                          {job.booking.phone}
                        </a>
                      </div>
                    ) : null}
                    {job.booking.serviceType ? (
                      <div>
                        <span className="label">Service</span> {job.booking.serviceType}
                      </div>
                    ) : null}
                  </div>

                  {job.booking.notes ? (
                    <div
                      style={{
                        background: "var(--color-surface-2)",
                        padding: "12px 14px",
                        borderRadius: "var(--radius)",
                        fontSize: 14,
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <strong>Client notes:</strong> {job.booking.notes}
                    </div>
                  ) : null}

                  <div className="row" style={{ gap: 10 }}>
                    {job.status === "assigned" && (
                      <button
                        type="button"
                        onClick={() => updateJob(job.id, { status: "in_progress" })}
                        disabled={updatingId === job.id}
                        className="btn btn-primary btn-sm"
                      >
                        {updatingId === job.id ? "Updating…" : "Start Job"}
                      </button>
                    )}
                    {job.status === "in_progress" && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotesModal(job);
                          setNotes(job.completionNotes || "");
                        }}
                        disabled={updatingId === job.id}
                        className="btn btn-primary btn-sm"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {completed.length > 0 && (
        <section className="section section-tight" style={{ paddingTop: 0 }}>
          <div className="container full-bleed-auto">
            <h2 className="section-title" style={{ fontSize: 22, marginBottom: 16 }}>
              Completed jobs
            </h2>
            <div className="stack" style={{ gap: 12 }}>
              {completed.slice(0, 20).map((job) => (
                <div
                  key={job.id}
                  className="card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    opacity: 0.92,
                  }}
                >
                  <div>
                    <strong>{job.booking.name}</strong>
                    <span className="text-muted" style={{ marginLeft: 8, fontSize: 13 }}>
                      {job.booking.address}
                    </span>
                    <div className="helper-text" style={{ marginTop: 4 }}>
                      {formatDate(job.booking.scheduledDate)}
                      {job.completionNotes ? ` — ${job.completionNotes}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="pill pill-success">completed</span>
                    {job.totalPay != null ? (
                      <div style={{ marginTop: 6, fontWeight: 700 }}>${job.totalPay.toFixed(2)}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-tight" style={{ paddingTop: 0 }}>
        <div className="container text-center">
          <Link href="/" className="text-muted" style={{ fontSize: 14 }}>
            ← Back to Home
          </Link>
        </div>
      </section>

      {notesModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-modal-title"
          className="modal-overlay"
          onClick={() => setNotesModal(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 id="notes-modal-title">Complete job: {notesModal.booking.name}</h3>
            </div>
            <p className="text-muted" style={{ fontSize: 14 }}>
              {notesModal.booking.address}
            </p>
            <label>
              Completion notes (optional)
              <textarea
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Any notes about the job…"
              />
            </label>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setNotesModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitNotes}
                disabled={updatingId === notesModal.id}
              >
                {updatingId === notesModal.id ? "Saving…" : "Mark Complete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
