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

function statusStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    assigned: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    in_progress: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
    completed: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    cancelled: { bg: "rgba(220,38,38,0.15)", color: "#dc2626" },
  };
  const s = map[status] || map.assigned;
  return {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    background: s.bg,
    color: s.color,
    display: "inline-block",
  };
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

  useEffect(() => { loadData(); }, [loadData]);

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
      if (res.ok) {
        loadData();
      }
    } catch { /* ignore */ }
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
      <section className="section" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-muted)" }}>Loading your dashboard...</p>
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
      {/* Header */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, marginBottom: 4 }}>
                Hi, {cleaner.name.split(" ")[0]}
              </h1>
              <p style={{ color: "var(--color-muted)" }}>{cleaner.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                cursor: "pointer",
              }}
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ paddingTop: 24, paddingBottom: 0 }}>
        <div className="container">
          <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Assigned</span>
              <p style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{assigned.length}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>In Progress</span>
              <p style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "#eab308" }}>{inProgress.length}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Completed</span>
              <p style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "#22c55e" }}>{completed.length}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Earnings</span>
              <p style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>${totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Jobs (Assigned + In Progress) */}
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Active Jobs</h2>
          {assigned.length === 0 && inProgress.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <p style={{ color: "var(--color-muted)" }}>No active jobs right now. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[...inProgress, ...assigned].map((job) => (
                <div key={job.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <strong style={{ fontSize: 16 }}>{job.booking.name}</strong>
                      <span style={{ ...statusStyle(job.status), marginLeft: 10 }}>{job.status.replace("_", " ")}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
                      {formatDate(job.booking.scheduledDate)}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, fontSize: 14 }}>
                    <div>
                      <span style={{ color: "var(--color-muted)" }}>Address: </span>
                      {job.booking.address}
                    </div>
                    <div>
                      <span style={{ color: "var(--color-muted)" }}>Size: </span>
                      {job.booking.homeSize}
                      {job.booking.sqft && ` (${job.booking.sqft} sqft)`}
                    </div>
                    {job.booking.phone && (
                      <div>
                        <span style={{ color: "var(--color-muted)" }}>Phone: </span>
                        <a href={`tel:${job.booking.phone}`} style={{ color: "var(--color-primary)" }}>{job.booking.phone}</a>
                      </div>
                    )}
                    {job.booking.serviceType && (
                      <div>
                        <span style={{ color: "var(--color-muted)" }}>Service: </span>
                        {job.booking.serviceType}
                      </div>
                    )}
                  </div>

                  {job.booking.notes && (
                    <div style={{ background: "var(--color-surface-2)", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>
                      <strong>Client notes:</strong> {job.booking.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {job.status === "assigned" && (
                      <button
                        onClick={() => updateJob(job.id, { status: "in_progress" })}
                        disabled={updatingId === job.id}
                        className="btn btn-primary"
                        style={{ fontSize: 14 }}
                      >
                        {updatingId === job.id ? "Updating..." : "Start Job"}
                      </button>
                    )}
                    {job.status === "in_progress" && (
                      <button
                        onClick={() => { setNotesModal(job); setNotes(job.completionNotes || ""); }}
                        disabled={updatingId === job.id}
                        className="btn btn-primary"
                        style={{ fontSize: 14 }}
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

      {/* Completed Jobs */}
      {completed.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Completed Jobs</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {completed.slice(0, 20).map((job) => (
                <div key={job.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, opacity: 0.85 }}>
                  <div>
                    <strong>{job.booking.name}</strong>
                    <span style={{ color: "var(--color-muted)", marginLeft: 8, fontSize: 13 }}>
                      {job.booking.address}
                    </span>
                    <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
                      {formatDate(job.booking.scheduledDate)}
                      {job.completionNotes && ` - ${job.completionNotes}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={statusStyle("completed")}>completed</span>
                    {job.totalPay != null && (
                      <div style={{ marginTop: 4, fontWeight: 600 }}>${job.totalPay.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer link */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ textAlign: "center" }}>
          <Link href="/" style={{ color: "var(--color-muted)", fontSize: 14 }}>
            Back to Home
          </Link>
        </div>
      </section>

      {/* Completion notes modal */}
      {notesModal && (
        <div
          role="dialog"
          onClick={() => setNotesModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", padding: 16, zIndex: 1000 }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 96vw)", display: "grid", gap: 14 }}>
            <h3 style={{ fontSize: 18 }}>Complete Job: {notesModal.booking.name}</h3>
            <p style={{ fontSize: 14, color: "var(--color-muted)" }}>{notesModal.booking.address}</p>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Completion Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Any notes about the job..."
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setNotesModal(null)}
                className="btn"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitNotes}
                disabled={updatingId === notesModal.id}
                className="btn btn-primary"
              >
                {updatingId === notesModal.id ? "Saving..." : "Mark Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
