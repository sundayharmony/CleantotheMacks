"use client";

import { useEffect, useMemo, useState, useCallback, type CSSProperties } from "react";

/* ─── Shared Types ─── */

type BookingStatus = "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELED";
type JobStatus = "assigned" | "in_progress" | "completed" | "cancelled";
type Tab = "dashboard" | "bookings" | "schedule" | "clients" | "cleaners" | "jobs" | "testimonials" | "gallery" | "videoReleases";

type Booking = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  sqft: string | null;
  homeSize: string;
  notes: string | null;
  status: string;
  clientId: string | null;
  scheduledDate: string | null;
  serviceType: string | null;
  slotMinutes?: number | null;
  cleaningJob?: { id: string; cleanerId: string; status: string } | null;
};

type AvailabilityRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  enabled: boolean;
};

type BlockedSlot = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
};

type Client = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  preferredDay: string | null;
  preferredTime: string | null;
  specialInstructions: string | null;
  pets: string | null;
  accessCodes: string | null;
  communicationNotes: string | null;
  referralSource: string | null;
  bookings: {
    id: string;
    createdAt: string;
    status: string;
    serviceType: string | null;
    cleaningJob: { totalPay: number | null; status: string } | null;
  }[];
  satisfactionNotes: {
    id: string;
    createdAt: string;
    rating: number | null;
    notes: string | null;
    followUpRequired: boolean;
  }[];
};

type Cleaner = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  paymentType: string;
  hourlyRate: number | null;
  cleaningJobs: {
    id: string;
    status: string;
    totalPay: number | null;
    createdAt: string;
  }[];
};

type Job = {
  id: string;
  createdAt: string;
  bookingId: string;
  cleanerId: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  flatRateAmount: number | null;
  status: string;
  completionNotes: string | null;
  totalPay: number | null;
  booking: {
    id: string;
    name: string;
    address: string;
    homeSize: string;
    sqft: string | null;
    status: string;
    scheduledDate: string | null;
  };
  cleaner: {
    id: string;
    name: string;
    paymentType: string;
    hourlyRate: number | null;
  };
};

type Testimonial = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  quote: string;
  rating: number | null;
  visible: boolean;
  sortOrder: number;
};

type GalleryItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  visible: boolean;
  sortOrder: number;
};

type VideoRelease = {
  id: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  clientEmail: string;
  propertyAddress: string | null;
  bookingId: string | null;
  tokenExpiresAt: string;
  status: string;
  signedAt: string | null;
  signerName: string | null;
  signatureText: string | null;
  signerIp: string | null;
  signerUserAgent: string | null;
};

/* ─── Helpers ─── */

function fmt(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

/** For `<input type="datetime-local" />` in the browser's local timezone */
function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return "$" + n.toFixed(2);
}

function statusBadge(status: string) {
  const s: Record<string, React.CSSProperties> = {
    NEW: { border: "1px solid var(--color-border)", color: "var(--color-text)", background: "rgba(255,255,255,0.06)" },
    CONFIRMED: { border: "1px solid rgba(88,166,255,0.5)", color: "var(--color-secondary)", background: "rgba(88,166,255,0.12)" },
    COMPLETED: { border: "1px solid rgba(34,197,94,0.4)", color: "#86efac", background: "rgba(34,197,94,0.12)" },
    CANCELED: { border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", background: "rgba(239,68,68,0.12)" },
    assigned: { border: "1px solid var(--color-border)", color: "var(--color-text)", background: "rgba(255,255,255,0.06)" },
    in_progress: { border: "1px solid rgba(251,191,36,0.5)", color: "#fde68a", background: "rgba(251,191,36,0.12)" },
    completed: { border: "1px solid rgba(34,197,94,0.4)", color: "#86efac", background: "rgba(34,197,94,0.12)" },
    cancelled: { border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", background: "rgba(239,68,68,0.12)" },
  };
  return s[status] ?? s.NEW;
}

const pillStyle = (status: string): React.CSSProperties => ({
  fontSize: 12, padding: "4px 10px", borderRadius: 999, fontWeight: 600, ...statusBadge(status),
});

/* ─── Modal Overlay ─── */

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.72)", display: "grid", placeItems: "center", padding: 16, zIndex: 1000 }}
    >
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: "min(920px,96vw)", maxHeight: "88vh", overflowY: "auto", display: "grid", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  // Data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [videoReleases, setVideoReleases] = useState<VideoRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  /* Cross-tab UI state. Lifted up so a Recent-Bookings click on Dashboard
     can open the same modal that Bookings + Schedule use. */
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);
  const [bookingsInitialFilter, setBookingsInitialFilter] = useState<"ALL" | BookingStatus>("ALL");

  function jumpToBookingsFiltered(filter: "ALL" | BookingStatus) {
    setBookingsInitialFilter(filter);
    setTab("bookings");
  }

  const openBooking = bookings.find((b) => b.id === openBookingId) ?? null;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // Fetch each resource independently so one failure doesn't break everything
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      // Run requests sequentially to avoid connection spikes on pooled DBs.
      const bData = await safeFetch("/api/book");
      const cData = await safeFetch("/api/client");
      const clData = await safeFetch("/api/cleaner");
      const jData = await safeFetch("/api/job");
      const tData = await safeFetch("/api/testimonial?all=true");
      const gData = await safeFetch("/api/gallery?all=true");
      const vrData = await safeFetch("/api/video-release");

      // Only show error if ALL core routes failed
      if (!bData && !cData && !clData && !jData) {
        throw new Error("Failed to load data — check your connection or login status");
      }

      setBookings(bData ? (Array.isArray(bData) ? bData : bData.bookings ?? []) : []);
      setClients(cData?.clients ?? []);
      setCleaners(clData?.cleaners ?? []);
      setJobs(jData?.jobs ?? []);
      setTestimonials(tData?.testimonials ?? []);
      setGallery(gData?.gallery ?? []);
      setVideoReleases(vrData?.releases ?? []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch { /* ignore */ }
    window.location.href = "/admin/login";
  }

  return (
    <section className="section">
      <div className="container container-wide">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>Admin Dashboard</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={loadAll} className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 14 }}>Refresh</button>
            <button onClick={logout} className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 14 }}>Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav">
          {(["dashboard", "bookings", "schedule", "clients", "cleaners", "jobs", "testimonials", "gallery", "videoReleases"] as Tab[]).map((t) => (
            <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t === "dashboard"
                ? "Dashboard"
                : t === "bookings"
                  ? "Bookings"
                  : t === "schedule"
                    ? "Schedule"
                    : t === "clients"
                      ? "Clients"
                      : t === "cleaners"
                        ? "Cleaners"
                        : t === "jobs"
                          ? "Jobs"
                          : t === "testimonials"
                            ? "Testimonials"
                            : t === "gallery"
                              ? "Gallery"
                              : "Video Releases"}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ opacity: 0.75 }}>Loading…</p>
        ) : err ? (
          <p style={{ color: "tomato" }}>{err}</p>
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab bookings={bookings} clients={clients} jobs={jobs} testimonials={testimonials} setTab={setTab} jumpToBookingsFiltered={jumpToBookingsFiltered} onOpenBooking={setOpenBookingId} />}
            {tab === "bookings" && <BookingsTab bookings={bookings} cleaners={cleaners} onOpenBooking={setOpenBookingId} initialFilter={bookingsInitialFilter} clearInitialFilter={() => setBookingsInitialFilter("ALL")} />}
            {tab === "schedule" && <ScheduleTab bookings={bookings} cleaners={cleaners} reload={loadAll} setTab={setTab} onOpenBooking={setOpenBookingId} />}
            {tab === "clients" && <ClientsTab clients={clients} setClients={setClients} reload={loadAll} />}
            {tab === "cleaners" && <CleanersTab cleaners={cleaners} setCleaners={setCleaners} reload={loadAll} />}
            {tab === "jobs" && <JobsTab jobs={jobs} setJobs={setJobs} bookings={bookings} cleaners={cleaners} reload={loadAll} />}
            {tab === "testimonials" && <TestimonialsTab testimonials={testimonials} setTestimonials={setTestimonials} reload={loadAll} />}
            {tab === "gallery" && <GalleryTab gallery={gallery} setGallery={setGallery} reload={loadAll} />}
            {tab === "videoReleases" && <VideoReleasesTab videoReleases={videoReleases} bookings={bookings} reload={loadAll} />}
          </>
        )}
      </div>

      <BookingDetailModal
        booking={openBooking}
        clients={clients}
        cleaners={cleaners}
        onClose={() => setOpenBookingId(null)}
        onSaved={loadAll}
        onDeleted={(id) => setBookings((prev) => prev.filter((r) => r.id !== id))}
      />
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED BOOKING DETAIL MODAL
   ════════════════════════════════════════════════════════════════ */

function BookingDetailModal({
  booking,
  clients,
  cleaners,
  onClose,
  onSaved,
  onDeleted,
}: {
  booking: Booking | null;
  clients: Client[];
  cleaners: Cleaner[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sendingRelease, setSendingRelease] = useState(false);

  useEffect(() => {
    if (!booking) return;
    setDraft({
      name: booking.name,
      email: booking.email,
      phone: booking.phone ?? "",
      address: booking.address,
      homeSize: booking.homeSize,
      sqft: booking.sqft ?? "",
      notes: booking.notes ?? "",
      status: booking.status,
      clientId: booking.clientId ?? "",
      serviceType: booking.serviceType ?? "",
      scheduledDate: toDatetimeLocalValue(booking.scheduledDate),
      cancellationReason: "",
    });
  }, [booking]);

  function updateStatus(nextStatus: string) {
    setDraft((prev) => ({
      ...prev,
      status: nextStatus,
      cancellationReason: nextStatus === "CANCELED" ? prev.cancellationReason ?? "" : "",
    }));
  }

  function close() {
    if (!saving) onClose();
  }

  async function save() {
    if (!booking) return;
    setSaving(true);
    try {
      const scheduledDatePatch =
        draft.scheduledDate?.trim() ? new Date(draft.scheduledDate).toISOString() : null;
      const res = await fetch(`/api/book/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          address: draft.address,
          homeSize: draft.homeSize,
          sqft: draft.sqft,
          notes: draft.notes,
          status: draft.status,
          clientId: draft.clientId?.trim() ? draft.clientId : null,
          serviceType: draft.serviceType?.trim() || null,
          scheduledDate: scheduledDatePatch,
          cancellationReason:
            draft.status === "CANCELED" && draft.cancellationReason?.trim()
              ? draft.cancellationReason.trim()
              : null,
        }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errData?.error || `Save failed (${res.status})`);
      }
      await onSaved();
      onClose();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBooking() {
    if (!booking || !window.confirm(`Delete booking for ${booking.name}?`)) return;
    try {
      await fetch(`/api/book/${booking.id}`, { method: "DELETE" });
      onDeleted(booking.id);
      onClose();
    } catch {
      alert("Delete failed");
    }
  }

  async function assignCleaner(bookingId: string, cleanerId: string) {
    try {
      const res = await fetch("/api/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, cleanerId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "Assign failed");
      }
      await onSaved();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Assign failed");
    }
  }

  async function sendVideoRelease(b: Booking) {
    setSendingRelease(true);
    try {
      const res = await fetch("/api/video-release/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: b.name,
          clientEmail: b.email,
          propertyAddress: b.address,
          bookingId: b.id,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to send video release form");
      }
      alert(`Video release sent to ${b.email}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to send video release form");
    } finally {
      setSendingRelease(false);
    }
  }

  return (
    <Modal open={!!booking} onClose={close}>
      {booking && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>Booking Details</h2>
              <p style={{ marginTop: 4, opacity: 0.75, fontSize: 14 }}>Created: {fmt(booking.createdAt)}</p>
            </div>
            <button className="btn btn-outline" onClick={close} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
          </div>

          <div className="grid grid-2">
            <label>Name<input className="input" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
            <label>Email<input className="input" type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label>Phone<input className="input" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            <label>Bedrooms<input className="input" value={draft.homeSize ?? ""} onChange={(e) => setDraft({ ...draft, homeSize: e.target.value })} /></label>
            <label>Sq Ft<input className="input" value={draft.sqft ?? ""} onChange={(e) => setDraft({ ...draft, sqft: e.target.value })} /></label>
            <label>Status
              <select className="input" value={draft.status ?? "NEW"} onChange={(e) => updateStatus(e.target.value)}>
                <option value="NEW">NEW</option><option value="CONFIRMED">CONFIRMED</option><option value="COMPLETED">COMPLETED</option><option value="CANCELED">CANCELED</option>
              </select>
            </label>
            <label>Link Client
              <select className="input" value={draft.clientId ?? ""} onChange={(e) => setDraft({ ...draft, clientId: e.target.value })}>
                <option value="">None</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </label>
            <label>Service Type
              <select className="input" value={draft.serviceType ?? ""} onChange={(e) => setDraft({ ...draft, serviceType: e.target.value })}>
                <option value="">—</option>
                <option value="standard">Standard Cleaning</option>
                <option value="deep_clean">Deep Clean</option>
                <option value="move_in">Move-In/Out</option>
                <option value="recurring">Recurring</option>
                <option value="painting">Interior Painting</option>
              </select>
            </label>
          </div>
          <label>
            Appointment date &amp; time (optional)
            <input
              type="datetime-local"
              className="input"
              value={draft.scheduledDate ?? ""}
              onChange={(e) => setDraft({ ...draft, scheduledDate: e.target.value })}
            />
            <small style={{ display: "block", marginTop: 6, opacity: 0.75, fontSize: 12 }}>
              Fills the Schedule calendar and list. Requests submitted before scheduling launched have no date—set one here, or leave blank.
            </small>
          </label>
          <label>Address<input className="input" value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
          <label>Notes<textarea className="input" rows={3} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>

          {draft.status === "CANCELED" && (
            <label>
              Reason for cancellation (optional, sent to customer)
              <textarea
                className="input"
                rows={2}
                placeholder="e.g. We had to reschedule due to a conflict."
                value={draft.cancellationReason ?? ""}
                onChange={(e) => setDraft({ ...draft, cancellationReason: e.target.value })}
              />
            </label>
          )}

          {!booking.cleaningJob && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
              <label>Assign Cleaner
                <select className="input" defaultValue="" onChange={(e) => { if (e.target.value) assignCleaner(booking.id, e.target.value); }}>
                  <option value="" disabled>Select a cleaner…</option>
                  {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.paymentType === "hourly" ? `$${c.hourlyRate}/hr` : "Per job"}</option>)}
                </select>
              </label>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-outline" onClick={deleteBooking} disabled={saving} style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}>Delete Booking</button>
            <div style={{ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
              <button
                className="btn btn-outline"
                onClick={() => sendVideoRelease(booking)}
                disabled={sendingRelease}
              >
                {sendingRelease ? "Sending..." : "Send Video Release"}
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   BOOKINGS TAB
   ════════════════════════════════════════════════════════════════ */

function BookingsTab({ bookings, cleaners, onOpenBooking, initialFilter, clearInitialFilter }: {
  bookings: Booking[];
  cleaners: Cleaner[];
  onOpenBooking: (id: string) => void;
  initialFilter: "ALL" | BookingStatus;
  clearInitialFilter: () => void;
}) {
  const [filter, setFilter] = useState<"ALL" | BookingStatus>(initialFilter);
  const [q, setQ] = useState("");
  const [sendingRelease, setSendingRelease] = useState(false);

  /* When AdminPage navigated us here with a pre-set filter (e.g. from Dashboard's
     "New / Pending" tile), apply it once on mount and clear the parent flag so
     that future visits to this tab don't re-override the user's manual choice. */
  useEffect(() => {
    if (initialFilter !== "ALL") {
      setFilter(initialFilter);
      clearInitialFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return bookings
      .filter((r) => {
        if (filter !== "ALL" && r.status !== filter) return false;
        if (!query) return true;
        return [r.name, r.email, r.phone ?? "", r.address, r.homeSize, r.sqft ?? "", r.notes ?? "", r.status, r.scheduledDate ?? ""]
          .join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, filter, q]);

  async function sendVideoRelease(booking: Booking) {
    setSendingRelease(true);
    try {
      const res = await fetch("/api/video-release/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: booking.name,
          clientEmail: booking.email,
          propertyAddress: booking.address,
          bookingId: booking.id,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to send video release form");
      }
      alert(`Video release sent to ${booking.email}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to send video release form");
    } finally {
      setSendingRelease(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bookings…"
          style={{ width: 300, maxWidth: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", outline: "none" }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as "ALL" | BookingStatus)}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}>
          <option value="ALL">All statuses</option>
          <option value="NEW">NEW</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
        <span style={{ opacity: 0.75, fontSize: 14 }}>Showing <b>{filtered.length}</b> of <b>{bookings.length}</b></span>
      </div>

      {filtered.length === 0 ? <p style={{ opacity: 0.75 }}>No bookings found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Submitted</th><th>Scheduled</th><th>Name</th><th>Email</th><th>Phone</th>
                <th>Address</th><th>Bedrooms</th><th>Status</th><th>Cleaner</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const assignedCleaner = b.cleaningJob ? cleaners.find((c) => c.id === b.cleaningJob?.cleanerId)?.name : null;
                return (
                  <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => onOpenBooking(b.id)}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(b.createdAt)}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                      {b.scheduledDate ? fmt(b.scheduledDate) : <span style={{ opacity: 0.5 }}>—</span>}
                    </td>
                    <td>{b.name}</td>
                    <td><span style={{ color: "var(--color-secondary)" }}>{b.email}</span></td>
                    <td>{b.phone || <span style={{ opacity: 0.5 }}>—</span>}</td>
                    <td>{b.address}</td>
                    <td>{b.homeSize}</td>
                    <td><span style={pillStyle(b.status)}>{b.status}</span></td>
                    <td>{assignedCleaner || <span style={{ opacity: 0.5 }}>Unassigned</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                          onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer"
                          style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: 13 }}>
                          Map
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sendVideoRelease(b);
                          }}
                          disabled={sendingRelease}
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 8,
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text)",
                            background: "transparent",
                            fontSize: 13,
                            cursor: sendingRelease ? "wait" : "pointer",
                          }}
                        >
                          {sendingRelease ? "Sending..." : "Send Release"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   CLIENTS TAB
   ════════════════════════════════════════════════════════════════ */

function ClientsTab({ clients, setClients, reload }: {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  reload: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return clients.filter((c) => {
      if (!query) return true;
      return [c.name, c.email, c.phone ?? "", c.address, c.referralSource ?? ""].join(" ").toLowerCase().includes(query);
    });
  }, [clients, q]);

  const selected = selectedId ? clients.find((c) => c.id === selectedId) ?? null : null;

  function openClient(c: Client) {
    setCreating(false);
    setSelectedId(c.id);
    setDraft({
      name: c.name, email: c.email, phone: c.phone ?? "", address: c.address,
      preferredDay: c.preferredDay ?? "", preferredTime: c.preferredTime ?? "",
      specialInstructions: c.specialInstructions ?? "", pets: c.pets ?? "",
      accessCodes: c.accessCodes ?? "", communicationNotes: c.communicationNotes ?? "",
      referralSource: c.referralSource ?? "",
    });
  }

  function startCreate() {
    setSelectedId(null);
    setCreating(true);
    setDraft({ name: "", email: "", phone: "", address: "", preferredDay: "", preferredTime: "", specialInstructions: "", pets: "", accessCodes: "", communicationNotes: "", referralSource: "" });
  }

  function close() { if (!saving) { setSelectedId(null); setCreating(false); } }

  async function save() {
    setSaving(true);
    try {
      if (creating) {
        const res = await fetch("/api/client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Create failed"); }
      } else if (selected) {
        const res = await fetch(`/api/client/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        if (!res.ok) throw new Error("Save failed");
      }
      await reload();
      setSelectedId(null);
      setCreating(false);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function deleteClient() {
    if (!selected || !window.confirm(`Delete client ${selected.name}?`)) return;
    try {
      await fetch(`/api/client/${selected.id}`, { method: "DELETE" });
      setClients((prev) => prev.filter((c) => c.id !== selected.id));
      setSelectedId(null);
    } catch { alert("Delete failed"); }
  }

  function lifetimeSpend(c: Client) {
    return c.bookings.reduce((sum, b) => sum + (b.cleaningJob?.totalPay ?? 0), 0);
  }

  function lastVisit(c: Client) {
    const completed = c.bookings.filter((b) => b.status === "COMPLETED");
    if (!completed.length) return null;
    return completed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…"
          style={{ width: 300, maxWidth: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", outline: "none" }} />
        <button className="btn btn-primary" onClick={startCreate} style={{ padding: "10px 16px", fontSize: 14 }}>+ Add Client</button>
        <span style={{ opacity: 0.75, fontSize: 14 }}>{filtered.length} clients</span>
      </div>

      {filtered.length === 0 ? <p style={{ opacity: 0.75 }}>No clients found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Last Visit</th><th>Visits</th><th>Lifetime Spend</th><th>Referral</th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => openClient(c)}>
                  <td>{c.name}</td>
                  <td><span style={{ color: "var(--color-secondary)" }}>{c.email}</span></td>
                  <td>{c.phone || <span style={{ opacity: 0.5 }}>—</span>}</td>
                  <td>{c.address}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDate(lastVisit(c))}</td>
                  <td>{c.bookings.length}</td>
                  <td>{money(lifetimeSpend(c))}</td>
                  <td>{c.referralSource || <span style={{ opacity: 0.5 }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected || creating} onClose={close}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>{creating ? "New Client" : "Client Details"}</h2>
          <button className="btn btn-outline" onClick={close} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
        </div>

        <div className="grid grid-2">
          <label>Name *<input className="input" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Email *<input className="input" type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
          <label>Phone<input className="input" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
          <label>Address *<input className="input" value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
          <label>Preferred Day
            <select className="input" value={draft.preferredDay ?? ""} onChange={(e) => setDraft({ ...draft, preferredDay: e.target.value })}>
              <option value="">—</option>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>Preferred Time
            <select className="input" value={draft.preferredTime ?? ""} onChange={(e) => setDraft({ ...draft, preferredTime: e.target.value })}>
              <option value="">—</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
            </select>
          </label>
        </div>

        <label>Special Instructions<textarea className="input" rows={2} value={draft.specialInstructions ?? ""} onChange={(e) => setDraft({ ...draft, specialInstructions: e.target.value })} /></label>

        <div className="grid grid-2">
          <label>Pets<input className="input" value={draft.pets ?? ""} onChange={(e) => setDraft({ ...draft, pets: e.target.value })} placeholder="e.g. 2 cats, 1 dog" /></label>
          <label>Access Codes<input className="input" value={draft.accessCodes ?? ""} onChange={(e) => setDraft({ ...draft, accessCodes: e.target.value })} placeholder="e.g. Gate: 1234" /></label>
        </div>

        <label>Communication Notes<textarea className="input" rows={2} value={draft.communicationNotes ?? ""} onChange={(e) => setDraft({ ...draft, communicationNotes: e.target.value })} /></label>
        <label>Referral Source<input className="input" value={draft.referralSource ?? ""} onChange={(e) => setDraft({ ...draft, referralSource: e.target.value })} placeholder="e.g. Google, Referral from…" /></label>

        {/* Visit History (only when editing) */}
        {selected && selected.bookings.length > 0 && (
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Visit History ({selected.bookings.length})</h3>
            <div style={{ display: "grid", gap: 8, maxHeight: 200, overflowY: "auto" }}>
              {selected.bookings.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-surface-2)", borderRadius: 8, fontSize: 13 }}>
                  <span>{fmtDate(b.createdAt)}</span>
                  <span style={pillStyle(b.status)}>{b.status}</span>
                  <span>{b.serviceType || "—"}</span>
                  <span>{money(b.cleaningJob?.totalPay)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Satisfaction Notes */}
        {selected && selected.satisfactionNotes.length > 0 && (
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Satisfaction Notes</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {selected.satisfactionNotes.map((n) => (
                <div key={n.id} style={{ padding: "8px 12px", background: "var(--color-surface-2)", borderRadius: 8, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{fmtDate(n.createdAt)}</span>
                    {n.rating && <span>{"★".repeat(n.rating)}{"☆".repeat(5 - n.rating)}</span>}
                    {n.followUpRequired && <span style={{ color: "#fde68a" }}>Follow-up needed</span>}
                  </div>
                  {n.notes && <p style={{ marginTop: 4, opacity: 0.85 }}>{n.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {!creating && <button className="btn btn-outline" onClick={deleteClient} disabled={saving} style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}>Delete Client</button>}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginLeft: "auto" }}>{saving ? "Saving…" : creating ? "Create Client" : "Save Changes"}</button>
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   CLEANERS TAB
   ════════════════════════════════════════════════════════════════ */

function CleanersTab({ cleaners, setCleaners, reload }: {
  cleaners: Cleaner[];
  setCleaners: React.Dispatch<React.SetStateAction<Cleaner[]>>;
  reload: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cleaners.filter((c) => {
      if (!query) return true;
      return [c.name, c.email, c.phone].join(" ").toLowerCase().includes(query);
    });
  }, [cleaners, q]);

  const selected = selectedId ? cleaners.find((c) => c.id === selectedId) ?? null : null;

  function openCleaner(c: Cleaner) {
    setCreating(false);
    setSelectedId(c.id);
    setDraft({
      name: c.name, email: c.email, phone: c.phone, address: c.address ?? "",
      paymentType: c.paymentType, hourlyRate: c.hourlyRate?.toString() ?? "",
    });
  }

  function startCreate() {
    setSelectedId(null);
    setCreating(true);
    setDraft({ name: "", email: "", phone: "", address: "", paymentType: "hourly", hourlyRate: "" });
  }

  function close() { if (!saving) { setSelectedId(null); setCreating(false); } }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...draft, hourlyRate: draft.hourlyRate ? parseFloat(draft.hourlyRate) : null };
      if (creating) {
        const res = await fetch("/api/cleaner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Create failed"); }
      } else if (selected) {
        const res = await fetch(`/api/cleaner/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Save failed"); }
      }
      await reload();
      setSelectedId(null);
      setCreating(false);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function deleteCleaner() {
    if (!selected || !window.confirm(`Delete cleaner ${selected.name}?`)) return;
    try {
      const res = await fetch(`/api/cleaner/${selected.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Delete failed"); }
      setCleaners((prev) => prev.filter((c) => c.id !== selected.id));
      setSelectedId(null);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Delete failed"); }
  }

  function activeJobs(c: Cleaner) { return c.cleaningJobs.filter((j) => j.status !== "completed" && j.status !== "cancelled").length; }
  function monthlyEarnings(c: Cleaner) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return c.cleaningJobs
      .filter((j) => j.status === "completed" && new Date(j.createdAt) >= start)
      .reduce((sum, j) => sum + (j.totalPay ?? 0), 0);
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cleaners…"
          style={{ width: 300, maxWidth: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", outline: "none" }} />
        <button className="btn btn-primary" onClick={startCreate} style={{ padding: "10px 16px", fontSize: 14 }}>+ Add Cleaner</button>
        <span style={{ opacity: 0.75, fontSize: 14 }}>{filtered.length} cleaners</span>
      </div>

      {filtered.length === 0 ? <p style={{ opacity: 0.75 }}>No cleaners found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Pay Type</th><th>Rate</th><th>Active Jobs</th><th>This Month</th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => openCleaner(c)}>
                  <td>{c.name}</td>
                  <td><span style={{ color: "var(--color-secondary)" }}>{c.email}</span></td>
                  <td>{c.phone}</td>
                  <td><span style={pillStyle(c.paymentType === "hourly" ? "CONFIRMED" : "NEW")}>{c.paymentType === "hourly" ? "Hourly" : "Per Job"}</span></td>
                  <td>{c.paymentType === "hourly" ? `$${c.hourlyRate}/hr` : "—"}</td>
                  <td>{activeJobs(c)}</td>
                  <td>{money(monthlyEarnings(c))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected || creating} onClose={close}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>{creating ? "New Cleaner" : "Cleaner Details"}</h2>
          <button className="btn btn-outline" onClick={close} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
        </div>

        <div className="grid grid-2">
          <label>Name *<input className="input" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label>Email *<input className="input" type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
          <label>Phone *<input className="input" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
          <label>Address<input className="input" value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
        </div>

        <div className="grid grid-2">
          <label>Payment Type
            <select className="input" value={draft.paymentType ?? "hourly"} onChange={(e) => setDraft({ ...draft, paymentType: e.target.value })}>
              <option value="hourly">Hourly</option>
              <option value="per_job">Per Job</option>
            </select>
          </label>
          {draft.paymentType === "hourly" && (
            <label>Hourly Rate ($) *<input className="input" type="number" step="0.01" min="0" value={draft.hourlyRate ?? ""} onChange={(e) => setDraft({ ...draft, hourlyRate: e.target.value })} /></label>
          )}
        </div>

        {/* Job History (only when editing) */}
        {selected && selected.cleaningJobs.length > 0 && (
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Job History ({selected.cleaningJobs.length})</h3>
            <div style={{ display: "grid", gap: 8, maxHeight: 200, overflowY: "auto" }}>
              {selected.cleaningJobs.map((j) => (
                <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-surface-2)", borderRadius: 8, fontSize: 13 }}>
                  <span>{fmtDate(j.createdAt)}</span>
                  <span style={pillStyle(j.status)}>{j.status}</span>
                  <span>{money(j.totalPay)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {!creating && <button className="btn btn-outline" onClick={deleteCleaner} disabled={saving} style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}>Delete Cleaner</button>}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginLeft: "auto" }}>{saving ? "Saving…" : creating ? "Create Cleaner" : "Save Changes"}</button>
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   JOBS TAB
   ════════════════════════════════════════════════════════════════ */

function JobsTab({ jobs, setJobs, bookings, cleaners, reload }: {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  bookings: Booking[];
  cleaners: Cleaner[];
  reload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<"ALL" | JobStatus>("ALL");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const unassignedBookings = useMemo(() => bookings.filter((b) => !b.cleaningJob), [bookings]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filter !== "ALL" && j.status !== filter) return false;
      if (!query) return true;
      return [j.booking.name, j.booking.address, j.cleaner.name].join(" ").toLowerCase().includes(query);
    });
  }, [jobs, filter, q]);

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null;

  function openJob(j: Job) {
    setCreating(false);
    setSelectedId(j.id);
    setDraft({
      cleanerId: j.cleanerId, status: j.status,
      flatRateAmount: j.flatRateAmount?.toString() ?? "",
      completionNotes: j.completionNotes ?? "",
      totalPay: j.totalPay?.toString() ?? "",
    });
  }

  function startCreate() {
    setSelectedId(null);
    setCreating(true);
    setDraft({ bookingId: "", cleanerId: "", flatRateAmount: "" });
  }

  function close() { if (!saving) { setSelectedId(null); setCreating(false); } }

  function hoursWorked(j: Job) {
    if (!j.clockInTime || !j.clockOutTime) return null;
    const h = (new Date(j.clockOutTime).getTime() - new Date(j.clockInTime).getTime()) / (1000 * 60 * 60);
    return Math.round(h * 100) / 100;
  }

  async function save() {
    setSaving(true);
    try {
      if (creating) {
        const res = await fetch("/api/job", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: draft.bookingId,
            cleanerId: draft.cleanerId,
            flatRateAmount: draft.flatRateAmount ? parseFloat(draft.flatRateAmount) : null,
          }),
        });
        if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Create failed"); }
      } else if (selected) {
        const res = await fetch(`/api/job/${selected.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cleanerId: draft.cleanerId, status: draft.status,
            flatRateAmount: draft.flatRateAmount ? parseFloat(draft.flatRateAmount) : null,
            completionNotes: draft.completionNotes,
            totalPay: draft.totalPay ? parseFloat(draft.totalPay) : null,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
      }
      await reload();
      setSelectedId(null);
      setCreating(false);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function clockIn() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clockIn: true }),
      });
      if (!res.ok) throw new Error("Clock-in failed");
      await reload();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Clock-in failed"); }
    finally { setSaving(false); }
  }

  async function clockOut() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clockOut: true, flatRateAmount: draft.flatRateAmount ? parseFloat(draft.flatRateAmount) : null }),
      });
      if (!res.ok) throw new Error("Clock-out failed");
      await reload();
      setSelectedId(null);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Clock-out failed"); }
    finally { setSaving(false); }
  }

  async function deleteJob() {
    if (!selected || !window.confirm("Delete this job assignment?")) return;
    try {
      await fetch(`/api/job/${selected.id}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== selected.id));
      setSelectedId(null);
    } catch { alert("Delete failed"); }
  }

  // Stats
  const totalPay = jobs.filter((j) => j.status === "completed").reduce((s, j) => s + (j.totalPay ?? 0), 0);
  const activeCount = jobs.filter((j) => j.status === "assigned" || j.status === "in_progress").length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;

  return (
    <>
      <div className="stat-row">
        <div className="stat-card"><strong>{activeCount}</strong><small>Active Jobs</small></div>
        <div className="stat-card"><strong>{completedCount}</strong><small>Completed</small></div>
        <div className="stat-card"><strong>{money(totalPay)}</strong><small>Total Paid</small></div>
        <div className="stat-card"><strong>{unassignedBookings.length}</strong><small>Unassigned Bookings</small></div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs…"
          style={{ width: 300, maxWidth: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", outline: "none" }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as "ALL" | JobStatus)}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}>
          <option value="ALL">All statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-primary" onClick={startCreate} style={{ padding: "10px 16px", fontSize: 14 }}>+ Assign Job</button>
        <span style={{ opacity: 0.75, fontSize: 14 }}>{filtered.length} jobs</span>
      </div>

      {filtered.length === 0 ? <p style={{ opacity: 0.75 }}>No jobs found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Client</th><th>Address</th><th>Cleaner</th><th>Status</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Pay</th></tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id} style={{ cursor: "pointer" }} onClick={() => openJob(j)}>
                  <td>{j.booking.name}</td>
                  <td>{j.booking.address}</td>
                  <td>{j.cleaner.name}</td>
                  <td><span style={pillStyle(j.status)}>{j.status}</span></td>
                  <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{fmt(j.clockInTime)}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{fmt(j.clockOutTime)}</td>
                  <td>{hoursWorked(j) != null ? `${hoursWorked(j)}h` : "—"}</td>
                  <td style={{ fontWeight: 600 }}>{money(j.totalPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected || creating} onClose={close}>
        {creating ? (
          <>
            <h2 style={{ margin: 0, fontSize: 24 }}>Assign Cleaner to Booking</h2>
            <div className="grid grid-2">
              <label>Booking *
                <select className="input" value={draft.bookingId ?? ""} onChange={(e) => setDraft({ ...draft, bookingId: e.target.value })}>
                  <option value="" disabled>Select booking…</option>
                  {unassignedBookings.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
                </select>
              </label>
              <label>Cleaner *
                <select className="input" value={draft.cleanerId ?? ""} onChange={(e) => setDraft({ ...draft, cleanerId: e.target.value })}>
                  <option value="" disabled>Select cleaner…</option>
                  {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.paymentType === "hourly" ? `$${c.hourlyRate}/hr` : "Per job"}</option>)}
                </select>
              </label>
            </div>
            <label>Flat Rate Amount (for per-job pay)
              <input className="input" type="number" step="0.01" min="0" value={draft.flatRateAmount ?? ""} onChange={(e) => setDraft({ ...draft, flatRateAmount: e.target.value })} placeholder="Leave empty for hourly" />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn btn-outline" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Assigning…" : "Assign Job"}</button>
            </div>
          </>
        ) : selected && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24 }}>Job Details</h2>
                <p style={{ marginTop: 4, opacity: 0.75, fontSize: 14 }}>Created: {fmt(selected.createdAt)}</p>
              </div>
              <button className="btn btn-outline" onClick={close} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
            </div>

            {/* Booking info */}
            <div style={{ background: "var(--color-surface-2)", borderRadius: 12, padding: 14 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--color-muted)" }}>Booking</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
                <span><b>Client:</b> {selected.booking.name}</span>
                <span><b>Address:</b> {selected.booking.address}</span>
                <span><b>Size:</b> {selected.booking.homeSize} BR / {selected.booking.sqft ?? "—"} sqft</span>
                <span><b>Scheduled:</b> {fmtDate(selected.booking.scheduledDate)}</span>
              </div>
            </div>

            <div className="grid grid-2">
              <label>Cleaner
                <select className="input" value={draft.cleanerId ?? ""} onChange={(e) => setDraft({ ...draft, cleanerId: e.target.value })}>
                  {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>Status
                <select className="input" value={draft.status ?? "assigned"} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            {/* Time tracking */}
            <div style={{ background: "var(--color-surface-2)", borderRadius: 12, padding: 14 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--color-muted)" }}>Time & Pay</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14, marginBottom: 12 }}>
                <span><b>Clock In:</b> {fmt(selected.clockInTime)}</span>
                <span><b>Clock Out:</b> {fmt(selected.clockOutTime)}</span>
                <span><b>Hours:</b> {hoursWorked(selected) != null ? `${hoursWorked(selected)}h` : "—"}</span>
                <span><b>Pay Type:</b> {selected.cleaner.paymentType === "hourly" ? `Hourly ($${selected.cleaner.hourlyRate}/hr)` : "Per Job"}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {!selected.clockInTime && selected.status === "assigned" && (
                  <button className="btn btn-primary" onClick={clockIn} disabled={saving} style={{ padding: "8px 16px", fontSize: 13 }}>Clock In</button>
                )}
                {selected.clockInTime && !selected.clockOutTime && (
                  <button className="btn btn-primary" onClick={clockOut} disabled={saving} style={{ padding: "8px 16px", fontSize: 13, background: "#16a34a" }}>Clock Out</button>
                )}
              </div>
            </div>

            <div className="grid grid-2">
              <label>Flat Rate Amount ($)
                <input className="input" type="number" step="0.01" min="0" value={draft.flatRateAmount ?? ""} onChange={(e) => setDraft({ ...draft, flatRateAmount: e.target.value })} />
              </label>
              <label>Total Pay ($) (override)
                <input className="input" type="number" step="0.01" min="0" value={draft.totalPay ?? ""} onChange={(e) => setDraft({ ...draft, totalPay: e.target.value })} />
              </label>
            </div>

            <label>Completion Notes
              <textarea className="input" rows={2} value={draft.completionNotes ?? ""} onChange={(e) => setDraft({ ...draft, completionNotes: e.target.value })} />
            </label>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-outline" onClick={deleteJob} disabled={saving} style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}>Delete Job</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   VIDEO RELEASES TAB
   ════════════════════════════════════════════════════════════════ */

function VideoReleasesTab({
  videoReleases,
  bookings,
  reload,
}: {
  videoReleases: VideoRelease[];
  bookings: Booking[];
  reload: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({
    clientName: "",
    clientEmail: "",
    propertyAddress: "",
    bookingId: "",
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return videoReleases.filter((r) => {
      if (!query) return true;
      return [r.clientName, r.clientEmail, r.propertyAddress ?? "", r.status]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [videoReleases, q]);

  const selected = selectedId
    ? videoReleases.find((r) => r.id === selectedId) ?? null
    : null;

  function displayStatus(r: VideoRelease) {
    if (r.status === "SIGNED") return "SIGNED";
    return new Date(r.tokenExpiresAt).getTime() < Date.now() ? "EXPIRED" : "PENDING";
  }

  async function resendRelease(releaseId: string) {
    setSending(true);
    try {
      const res = await fetch("/api/video-release/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releaseId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to resend release");
      }
      alert("Release email resent.");
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to resend release");
    } finally {
      setSending(false);
    }
  }

  async function createAndSend() {
    setSending(true);
    try {
      const res = await fetch("/api/video-release/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: draft.clientName,
          clientEmail: draft.clientEmail,
          propertyAddress: draft.propertyAddress || undefined,
          bookingId: draft.bookingId || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to send release");
      }
      alert("Video release sent.");
      setDraft({ clientName: "", clientEmail: "", propertyAddress: "", bookingId: "" });
      setCreating(false);
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to send release");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search releases..."
          style={{ width: 320, maxWidth: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", outline: "none" }}
        />
        <button className="btn btn-primary" onClick={() => setCreating((v) => !v)} style={{ padding: "10px 16px", fontSize: 14 }}>
          {creating ? "Cancel" : "+ Send New Release"}
        </button>
        <span style={{ opacity: 0.75, fontSize: 14 }}>{filtered.length} releases</span>
      </div>

      {creating && (
        <div className="card" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Send Video Release Form</h3>
          <div className="grid grid-2">
            <label>Client Name *<input className="input" value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} /></label>
            <label>Client Email *<input className="input" type="email" value={draft.clientEmail} onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })} /></label>
            <label>Property Address<input className="input" value={draft.propertyAddress} onChange={(e) => setDraft({ ...draft, propertyAddress: e.target.value })} /></label>
            <label>Link Booking (optional)
              <select className="input" value={draft.bookingId} onChange={(e) => setDraft({ ...draft, bookingId: e.target.value })}>
                <option value="">None</option>
                {bookings.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" disabled={sending || !draft.clientName || !draft.clientEmail} onClick={createAndSend}>
              {sending ? "Sending..." : "Send Release Form"}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ opacity: 0.75 }}>No video releases found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Created</th><th>Client</th><th>Email</th><th>Address</th><th>Expires</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const state = displayStatus(r);
                return (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td>
                    <td>{r.clientName}</td>
                    <td><span style={{ color: "var(--color-secondary)" }}>{r.clientEmail}</span></td>
                    <td>{r.propertyAddress || <span style={{ opacity: 0.5 }}>—</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(r.tokenExpiresAt)}</td>
                    <td><span style={pillStyle(state === "PENDING" ? "CONFIRMED" : state === "SIGNED" ? "completed" : "cancelled")}>{state}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setSelectedId(r.id)}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid var(--color-border)", color: "var(--color-text)", background: "transparent", cursor: "pointer", fontSize: 13 }}
                        >
                          View
                        </button>
                        <button
                          disabled={sending || state === "SIGNED"}
                          onClick={() => resendRelease(r.id)}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid var(--color-border)", color: state === "SIGNED" ? "var(--color-muted)" : "var(--color-text)", background: "transparent", cursor: sending || state === "SIGNED" ? "not-allowed" : "pointer", fontSize: 13 }}
                        >
                          {sending ? "Sending..." : "Resend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)}>
        {selected && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24 }}>Release Details</h2>
                <p style={{ marginTop: 4, opacity: 0.75, fontSize: 14 }}>Created: {fmt(selected.createdAt)}</p>
              </div>
              <button className="btn btn-outline" onClick={() => setSelectedId(null)} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
            </div>
            <div className="grid grid-2">
              <div><b>Client:</b> {selected.clientName}</div>
              <div><b>Email:</b> {selected.clientEmail}</div>
              <div><b>Address:</b> {selected.propertyAddress || "—"}</div>
              <div><b>Status:</b> {displayStatus(selected)}</div>
              <div><b>Signed at:</b> {fmt(selected.signedAt)}</div>
              <div><b>Signer name:</b> {selected.signerName || "—"}</div>
            </div>
            <div><b>Signature:</b> {selected.signatureText || "—"}</div>
            <div><b>Signer IP:</b> {selected.signerIp || "—"}</div>
            <div><b>User Agent:</b> {selected.signerUserAgent || "—"}</div>
          </>
        )}
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD TAB
   ════════════════════════════════════════════════════════════════ */

function DashboardTab({ bookings, clients, jobs, testimonials, setTab, jumpToBookingsFiltered, onOpenBooking }: {
  bookings: Booking[];
  clients: Client[];
  jobs: Job[];
  testimonials: Testimonial[];
  setTab: (t: Tab) => void;
  jumpToBookingsFiltered: (filter: "ALL" | BookingStatus) => void;
  onOpenBooking: (id: string) => void;
}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const bookingsThisMonth = bookings.filter((b) => new Date(b.createdAt) >= monthStart).length;
  const newBookings = bookings.filter((b) => b.status === "NEW").length;
  const activeJobs = jobs.filter((j) => j.status === "assigned" || j.status === "in_progress").length;
  const revenueThisMonth = jobs
    .filter((j) => j.status === "completed" && new Date(j.createdAt) >= monthStart)
    .reduce((sum, j) => sum + (j.totalPay ?? 0), 0);
  const totalClients = clients.length;
  const newClientsThisMonth = clients.filter((c) => new Date(c.createdAt) >= monthStart).length;
  const visibleTestimonials = testimonials.filter((t) => t.visible).length;

  // Recent activity — last 10 bookings
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const clickableTileStyle: CSSProperties = {
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "border-color 0.15s",
  };

  return (
    <>
      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setTab("bookings")} style={{ padding: "10px 18px", fontSize: 14 }}>View Bookings</button>
        <button className="btn btn-outline" onClick={() => setTab("schedule")} style={{ padding: "10px 18px", fontSize: 14 }}>Schedule</button>
        <button className="btn btn-outline" onClick={() => setTab("clients")} style={{ padding: "10px 18px", fontSize: 14 }}>Manage Clients</button>
        <button className="btn btn-outline" onClick={() => setTab("testimonials")} style={{ padding: "10px 18px", fontSize: 14 }}>Manage Testimonials</button>
      </div>

      {/* Stats Grid */}
      <div className="stat-row" style={{ marginBottom: 24 }}>
        <div className="stat-card"><strong>{bookingsThisMonth}</strong><small>Bookings This Month</small></div>
        <button
          type="button"
          className="stat-card"
          onClick={() => jumpToBookingsFiltered("NEW")}
          style={clickableTileStyle}
          title="Open Bookings filtered to NEW"
        >
          <strong>{newBookings}</strong><small>New / Pending</small>
        </button>
        <div className="stat-card"><strong>{activeJobs}</strong><small>Active Jobs</small></div>
        <div className="stat-card"><strong>${revenueThisMonth.toFixed(2)}</strong><small>Revenue This Month</small></div>
        <div className="stat-card"><strong>{totalClients}</strong><small>Total Clients</small></div>
        <div className="stat-card"><strong>{newClientsThisMonth}</strong><small>New Clients This Month</small></div>
        <div className="stat-card"><strong>{visibleTestimonials}/{testimonials.length}</strong><small>Testimonials Visible</small></div>
      </div>

      {/* Recent Activity */}
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>Recent Bookings</h3>
      {recentBookings.length === 0 ? (
        <p style={{ opacity: 0.75 }}>No recent bookings.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {recentBookings.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onOpenBooking(b.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 14,
                width: "100%",
                textAlign: "left",
                color: "inherit",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{b.name}</span>
                <span style={{ color: "var(--color-muted)" }}>{b.address}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: "var(--color-muted)", fontSize: 13 }}>{fmtDate(b.createdAt)}</span>
                <span style={pillStyle(b.status)}>{b.status}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   TESTIMONIALS TAB
   ════════════════════════════════════════════════════════════════ */

function TestimonialsTab({ testimonials, setTestimonials, reload }: {
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  reload: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return testimonials.filter((t) => {
      if (!query) return true;
      return [t.name, t.quote].join(" ").toLowerCase().includes(query);
    });
  }, [testimonials, q]);

  const selected = selectedId ? testimonials.find((t) => t.id === selectedId) ?? null : null;

  function openTestimonial(t: Testimonial) {
    setCreating(false);
    setSelectedId(t.id);
    setDraft({
      name: t.name,
      quote: t.quote,
      rating: t.rating?.toString() ?? "",
      visible: t.visible,
      sortOrder: t.sortOrder.toString(),
    });
  }

  function startCreate() {
    setSelectedId(null);
    setCreating(true);
    setDraft({ name: "", quote: "", rating: "", visible: true, sortOrder: "0" });
  }

  function close() {
    if (!saving) { setSelectedId(null); setCreating(false); }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        quote: draft.quote,
        rating: draft.rating ? parseInt(draft.rating as string, 10) : null,
        visible: draft.visible,
        sortOrder: draft.sortOrder ? parseInt(draft.sortOrder as string, 10) : 0,
      };

      if (creating) {
        const res = await fetch("/api/testimonial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(d?.error || "Create failed");
        }
      } else if (selected) {
        const res = await fetch(`/api/testimonial/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
      }
      await reload();
      setSelectedId(null);
      setCreating(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTestimonial() {
    if (!selected || !window.confirm(`Delete testimonial from ${selected.name}?`)) return;
    try {
      await fetch(`/api/testimonial/${selected.id}`, { method: "DELETE" });
      setTestimonials((prev) => prev.filter((t) => t.id !== selected.id));
      setSelectedId(null);
    } catch {
      alert("Delete failed");
    }
  }

  async function seedTestimonials() {
    try {
      const res = await fetch("/api/testimonial/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Seed failed");
        return;
      }
      alert(data.message);
      await reload();
    } catch {
      alert("Seed failed");
    }
  }

  async function toggleVisibility(t: Testimonial) {
    try {
      const res = await fetch(`/api/testimonial/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !t.visible }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      await reload();
    } catch {
      alert("Failed to toggle visibility");
    }
  }

  const visibleCount = testimonials.filter((t) => t.visible).length;

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search testimonials…"
          style={{ width: 300, maxWidth: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", outline: "none" }} />
        <button className="btn btn-primary" onClick={startCreate} style={{ padding: "10px 16px", fontSize: 14 }}>+ Add Testimonial</button>
        {testimonials.length === 0 && (
          <button className="btn btn-outline" onClick={seedTestimonials} style={{ padding: "10px 16px", fontSize: 14, borderColor: "rgba(88,166,255,0.5)", color: "var(--color-secondary)" }}>Seed Default Testimonials</button>
        )}
        <span style={{ opacity: 0.75, fontSize: 14 }}>{visibleCount} visible / {testimonials.length} total</span>
      </div>

      {filtered.length === 0 ? <p style={{ opacity: 0.75 }}>No testimonials found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Order</th><th>Name</th><th>Quote</th><th>Rating</th><th>Visible</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => openTestimonial(t)}>
                  <td>{t.sortOrder}</td>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td style={{ color: "var(--color-muted)", maxWidth: 400 }}>
                    {t.quote.length > 80 ? t.quote.slice(0, 80) + "…" : t.quote}
                  </td>
                  <td>{t.rating ? "★".repeat(t.rating) + "☆".repeat(5 - t.rating) : <span style={{ opacity: 0.5 }}>—</span>}</td>
                  <td>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(t); }}
                      style={{
                        padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
                        ...(t.visible
                          ? { borderColor: "rgba(34,197,94,0.4)", color: "#86efac", background: "rgba(34,197,94,0.12)" }
                          : { borderColor: "var(--color-border)", color: "var(--color-muted)", background: "rgba(255,255,255,0.06)" }),
                      }}
                    >
                      {t.visible ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={(e) => { e.stopPropagation(); openTestimonial(t); }}
                      style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid var(--color-border)", color: "var(--color-text)", background: "transparent", cursor: "pointer", fontSize: 13 }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected || creating} onClose={close}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>{creating ? "New Testimonial" : "Edit Testimonial"}</h2>
          <button className="btn btn-outline" onClick={close} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
        </div>

        <div className="grid grid-2">
          <label>Name *<input className="input" value={(draft.name as string) ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Ashley R." /></label>
          <label>Rating
            <select className="input" value={(draft.rating as string) ?? ""} onChange={(e) => setDraft({ ...draft, rating: e.target.value })}>
              <option value="">No rating</option>
              <option value="5">★★★★★ (5)</option>
              <option value="4">★★★★☆ (4)</option>
              <option value="3">★★★☆☆ (3)</option>
              <option value="2">★★☆☆☆ (2)</option>
              <option value="1">★☆☆☆☆ (1)</option>
            </select>
          </label>
        </div>

        <label>Quote *<textarea className="input" rows={4} value={(draft.quote as string) ?? ""} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} placeholder="What did the customer say?" /></label>

        <div className="grid grid-2">
          <label>Sort Order
            <input className="input" type="number" min="0" value={(draft.sortOrder as string) ?? "0"} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} />
          </label>
          <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={draft.visible as boolean} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
              style={{ width: 20, height: 20, accentColor: "var(--color-primary)" }} />
            <span>Visible on website</span>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {!creating && <button className="btn btn-outline" onClick={deleteTestimonial} disabled={saving} style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}>Delete Testimonial</button>}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginLeft: "auto" }}>{saving ? "Saving…" : creating ? "Add Testimonial" : "Save Changes"}</button>
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   GALLERY TAB
   ════════════════════════════════════════════════════════════════ */

function GalleryTab({ gallery, setGallery, reload }: {
  gallery: GalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  reload: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return gallery.filter((g) => {
      if (!query) return true;
      return [g.title, g.description ?? ""].join(" ").toLowerCase().includes(query);
    });
  }, [gallery, q]);

  const selected = selectedId ? gallery.find((g) => g.id === selectedId) ?? null : null;

  function openItem(g: GalleryItem) {
    setCreating(false);
    setSelectedId(g.id);
    setDraft({
      title: g.title, description: g.description ?? "",
      beforeImageUrl: g.beforeImageUrl, afterImageUrl: g.afterImageUrl,
      visible: g.visible, sortOrder: g.sortOrder.toString(),
    });
  }

  function startCreate() {
    setSelectedId(null);
    setCreating(true);
    setDraft({ title: "", description: "", beforeImageUrl: "", afterImageUrl: "", visible: true, sortOrder: "0" });
  }

  function close() { if (!saving) { setSelectedId(null); setCreating(false); } }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title: draft.title, description: draft.description,
        beforeImageUrl: draft.beforeImageUrl, afterImageUrl: draft.afterImageUrl,
        visible: draft.visible, sortOrder: draft.sortOrder ? parseInt(draft.sortOrder as string, 10) : 0,
      };
      if (creating) {
        const res = await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Create failed"); }
      } else if (selected) {
        const res = await fetch(`/api/gallery/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Save failed");
      }
      await reload();
      setSelectedId(null);
      setCreating(false);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function deleteItem() {
    if (!selected || !window.confirm(`Delete "${selected.title}"?`)) return;
    try {
      await fetch(`/api/gallery/${selected.id}`, { method: "DELETE" });
      setGallery((prev) => prev.filter((g) => g.id !== selected.id));
      setSelectedId(null);
    } catch { alert("Delete failed"); }
  }

  async function toggleVisibility(g: GalleryItem) {
    try {
      const res = await fetch(`/api/gallery/${g.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !g.visible }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      await reload();
    } catch { alert("Failed to toggle visibility"); }
  }

  const visibleCount = gallery.filter((g) => g.visible).length;

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gallery..."
          style={{ width: 300, maxWidth: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", outline: "none" }} />
        <button className="btn btn-primary" onClick={startCreate} style={{ padding: "10px 16px", fontSize: 14 }}>+ Add Before/After</button>
        <span style={{ opacity: 0.75, fontSize: 14 }}>{visibleCount} visible / {gallery.length} total</span>
      </div>

      {filtered.length === 0 ? <p style={{ opacity: 0.75 }}>No gallery items found. Add your first before/after photo pair above.</p> : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {filtered.map((g) => (
            <div key={g.id} className="card" style={{ cursor: "pointer", opacity: g.visible ? 1 : 0.5 }} onClick={() => openItem(g)}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", height: 120, background: "var(--color-surface-2)", position: "relative" }}>
                  <span style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, zIndex: 1 }}>BEFORE</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.beforeImageUrl} alt="Before" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", height: 120, background: "var(--color-surface-2)", position: "relative" }}>
                  <span style={{ position: "absolute", top: 4, left: 4, background: "rgba(34,197,94,0.7)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, zIndex: 1 }}>AFTER</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.afterImageUrl} alt="After" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{g.title}</strong>
                  {g.description && <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>{g.description}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(g); }}
                  style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
                    ...(g.visible ? { borderColor: "rgba(34,197,94,0.4)", color: "#86efac", background: "rgba(34,197,94,0.12)" }
                      : { borderColor: "var(--color-border)", color: "var(--color-muted)", background: "rgba(255,255,255,0.06)" }) }}>
                  {g.visible ? "Visible" : "Hidden"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected || creating} onClose={close}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>{creating ? "New Gallery Item" : "Edit Gallery Item"}</h2>
          <button className="btn btn-outline" onClick={close} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
        </div>

        <label>Title *<input className="input" value={(draft.title as string) ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Living Room Reset" /></label>
        <label>Description<textarea className="input" rows={2} value={(draft.description as string) ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Optional description" /></label>

        <div className="grid grid-2">
          <label>Before Image URL *<input className="input" value={(draft.beforeImageUrl as string) ?? ""} onChange={(e) => setDraft({ ...draft, beforeImageUrl: e.target.value })} placeholder="https://..." /></label>
          <label>After Image URL *<input className="input" value={(draft.afterImageUrl as string) ?? ""} onChange={(e) => setDraft({ ...draft, afterImageUrl: e.target.value })} placeholder="https://..." /></label>
        </div>

        {((draft.beforeImageUrl as string) || (draft.afterImageUrl as string)) && (
          <div style={{ display: "flex", gap: 8 }}>
            {(draft.beforeImageUrl as string) && (
              <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", height: 140, background: "var(--color-surface-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.beforeImageUrl as string} alt="Before preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {(draft.afterImageUrl as string) && (
              <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", height: 140, background: "var(--color-surface-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.afterImageUrl as string} alt="After preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-2">
          <label>Sort Order<input className="input" type="number" min="0" value={(draft.sortOrder as string) ?? "0"} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
          <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={draft.visible as boolean} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} style={{ width: 20, height: 20, accentColor: "var(--color-primary)" }} />
            <span>Visible on website</span>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {!creating && <button className="btn btn-outline" onClick={deleteItem} disabled={saving} style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}>Delete Item</button>}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginLeft: "auto" }}>{saving ? "Saving..." : creating ? "Add Item" : "Save Changes"}</button>
        </div>
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   SCHEDULE TAB
   ════════════════════════════════════════════════════════════════ */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ScheduleTab({ bookings, cleaners, reload, setTab, onOpenBooking }: {
  bookings: Booking[];
  cleaners: Cleaner[];
  reload: () => Promise<void>;
  setTab: (t: Tab) => void;
  onOpenBooking: (id: string) => void;
}) {
  const [view, setView] = useState<"calendar" | "list" | "availability" | "blocked">("calendar");
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [config, setConfig] = useState<AvailabilityRule[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loadingCfg, setLoadingCfg] = useState(false);
  const [savingCfg, setSavingCfg] = useState(false);
  const [blockDraft, setBlockDraft] = useState({ startAt: "", endAt: "", reason: "" });
  const [busyBlock, setBusyBlock] = useState(false);

  const pendingNoDate = useMemo(
    () => bookings.filter((b) => b.status === "NEW" && !b.scheduledDate).length,
    [bookings],
  );

  const ruleByDow = useMemo(() => {
    const m = new Map<number, AvailabilityRule>();
    for (const r of config) m.set(r.dayOfWeek, r);
    return m;
  }, [config]);

  const blocksByDayKey = useMemo(() => {
    const m = new Map<string, BlockedSlot[]>();
    for (const b of blocked) {
      const start = new Date(b.startAt);
      const end = new Date(b.endAt);
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cursor.getTime() < end.getTime()) {
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        if (!m.has(key)) m.set(key, []);
        m.get(key)!.push(b);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return m;
  }, [blocked]);

  const loadScheduleData = useCallback(async () => {
    setLoadingCfg(true);
    try {
      const [cfgRes, blkRes] = await Promise.all([
        fetch("/api/availability/config", { cache: "no-store" }),
        fetch("/api/availability/block", { cache: "no-store" }),
      ]);
      if (cfgRes.ok) {
        const cd = await cfgRes.json();
        setConfig(cd.config ?? []);
      }
      if (blkRes.ok) {
        const bd = await blkRes.json();
        setBlocked(bd.blocks ?? []);
      }
    } finally {
      setLoadingCfg(false);
    }
  }, []);

  useEffect(() => { loadScheduleData(); }, [loadScheduleData]);

  const monthStart = monthCursor;
  const monthEnd = useMemo(
    () => new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0),
    [monthStart],
  );

  const calendarCells = useMemo(() => {
    const cells: { date: Date; inMonth: boolean }[] = [];
    const startWeekday = monthStart.getDay();
    for (let i = startWeekday; i > 0; i--) {
      const d = new Date(monthStart);
      d.setDate(d.getDate() - i);
      cells.push({ date: d, inMonth: false });
    }
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      cells.push({ date: new Date(monthStart.getFullYear(), monthStart.getMonth(), day), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [monthStart, monthEnd]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (!b.scheduledDate) continue;
      const d = new Date(b.scheduledDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [bookings]);

  const scheduledList = useMemo(() => {
    return bookings
      .filter((b) => b.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
  }, [bookings]);

  function shiftMonth(delta: number) {
    setMonthCursor(new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1));
  }

  async function setStatus(bookingId: string, status: string) {
    try {
      const res = await fetch(`/api/book/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    }
  }

  function updateRule(dayOfWeek: number, patch: Partial<AvailabilityRule>) {
    setConfig((prev) => {
      const next = prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r));
      if (!next.some((r) => r.dayOfWeek === dayOfWeek)) {
        next.push({ dayOfWeek, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: false, ...patch });
      }
      return next.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  }

  async function saveConfig() {
    setSavingCfg(true);
    try {
      const res = await fetch("/api/availability/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "Save failed");
      }
      alert("Availability saved.");
      await loadScheduleData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingCfg(false);
    }
  }

  async function addBlock() {
    if (!blockDraft.startAt || !blockDraft.endAt) {
      alert("Please pick a start and end time.");
      return;
    }
    setBusyBlock(true);
    try {
      const res = await fetch("/api/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: new Date(blockDraft.startAt).toISOString(),
          endAt: new Date(blockDraft.endAt).toISOString(),
          reason: blockDraft.reason || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "Failed to block");
      }
      setBlockDraft({ startAt: "", endAt: "", reason: "" });
      await loadScheduleData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to block");
    } finally {
      setBusyBlock(false);
    }
  }

  async function removeBlock(id: string) {
    if (!window.confirm("Remove this blocked time?")) return;
    try {
      const res = await fetch(`/api/availability/block?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Remove failed");
      await loadScheduleData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to remove");
    }
  }

  return (
    <>
      {pendingNoDate > 0 && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            marginBottom: 12,
            borderRadius: 8,
            background: "rgba(245, 158, 11, 0.10)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            fontSize: 13,
          }}
        >
          <span>
            <strong>{pendingNoDate}</strong> pending request{pendingNoDate === 1 ? "" : "s"} need{pendingNoDate === 1 ? "s" : ""} a date — these don&apos;t appear on the calendar yet.
          </span>
          <button
            type="button"
            onClick={() => setTab("bookings")}
            className="btn btn-outline"
            style={{ padding: "4px 12px", fontSize: 13 }}
          >
            Open Bookings
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["calendar", "list", "availability", "blocked"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`tab-btn${view === v ? " active" : ""}`}
            style={{ padding: "8px 14px" }}
          >
            {v === "calendar" ? "Calendar" : v === "list" ? "List" : v === "availability" ? "Availability" : "Blocked Times"}
          </button>
        ))}
      </div>

      {view === "calendar" && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <button className="btn btn-outline" onClick={() => shiftMonth(-1)} style={{ padding: "6px 12px" }}>← Prev</button>
            <strong style={{ fontSize: 16 }}>
              {monthStart.toLocaleDateString([], { month: "long", year: "numeric" })}
            </strong>
            <button className="btn btn-outline" onClick={() => shiftMonth(1)} style={{ padding: "6px 12px" }}>Next →</button>
            <button className="btn btn-outline" onClick={() => setMonthCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} style={{ padding: "6px 12px" }}>Today</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 13 }}>
            {DAY_LABELS.map((d) => (
              <div key={d} style={{ textAlign: "center", padding: 6, fontWeight: 600, color: "var(--color-muted)" }}>{d}</div>
            ))}
            {calendarCells.map((cell, idx) => {
              const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
              const dayBookings = bookingsByDay.get(key) ?? [];
              const isToday = cell.date.toDateString() === new Date().toDateString();
              const clickable = dayBookings.length > 0;
              const rule = ruleByDow.get(cell.date.getDay());
              const dowClosed = cell.inMonth && rule !== undefined && rule.enabled === false;
              const dayBlocks = blocksByDayKey.get(key) ?? [];
              const hasBlock = dayBlocks.length > 0;
              const cellStyle: CSSProperties = {
                minHeight: 100,
                border: `1px solid ${isToday ? "var(--color-primary)" : "var(--color-border)"}`,
                borderLeft: hasBlock
                  ? "3px solid rgba(245, 158, 11, 0.7)"
                  : `1px solid ${isToday ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: 8,
                padding: 6,
                background: dowClosed
                  ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 6px, rgba(255,255,255,0.05) 6px 12px)"
                  : cell.inMonth
                    ? "var(--color-surface)"
                    : "rgba(255,255,255,0.02)",
                opacity: cell.inMonth ? 1 : 0.5,
                textAlign: "left",
                font: "inherit",
                color: "inherit",
                cursor: clickable ? "pointer" : "default",
                transition: "background 0.15s",
                width: "100%",
              };
              const blockTooltip = hasBlock
                ? dayBlocks
                    .map((b) => `Blocked: ${b.reason || "(no reason given)"}`)
                    .join("\n")
                : undefined;
              const cellChildren = (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{cell.date.getDate()}</span>
                    {dowClosed && (
                      <span
                        style={{
                          fontSize: 9,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: "var(--color-muted)",
                        }}
                      >
                        Closed
                      </span>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: 3 }}>
                    {dayBookings.slice(0, 3).map((b) => {
                      const isCanceled = b.status === "CANCELED";
                      return (
                        <div
                          key={b.id}
                          title={`${b.name} - ${b.address}${isCanceled ? " (canceled)" : ""}`}
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 4,
                            ...statusBadge(b.status),
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            opacity: isCanceled ? 0.45 : 1,
                            textDecoration: isCanceled ? "line-through" : undefined,
                          }}
                        >
                          {new Date(b.scheduledDate!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} {b.name}
                        </div>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <div style={{ fontSize: 10, color: "var(--color-muted)" }}>+{dayBookings.length - 3} more</div>
                    )}
                  </div>
                </>
              );
              if (!clickable) {
                return (
                  <div key={idx} style={cellStyle} title={blockTooltip}>
                    {cellChildren}
                  </div>
                );
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOpenDayKey(key)}
                  className="schedule-day-cell"
                  style={cellStyle}
                  title={blockTooltip}
                  aria-label={`Open ${cell.date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })} (${dayBookings.length} booking${dayBookings.length === 1 ? "" : "s"})`}
                >
                  {cellChildren}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 12,
              fontSize: 12,
              opacity: 0.8,
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 4px, rgba(255,255,255,0.12) 4px 8px)",
                  border: "1px solid var(--color-border)",
                }}
              />
              Closed day
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  borderLeft: "3px solid rgba(245, 158, 11, 0.7)",
                  border: "1px solid var(--color-border)",
                  borderLeftWidth: 3,
                  borderLeftColor: "rgba(245, 158, 11, 0.7)",
                }}
              />
              Has blocked time
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ textDecoration: "line-through", opacity: 0.45 }}>3:00 PM Jane</span>
              <span style={{ opacity: 0.7 }}>= canceled</span>
            </span>
          </div>
        </>
      )}

      {view === "list" && (
        <>
          {scheduledList.length === 0 ? (
            <p style={{ opacity: 0.75 }}>No scheduled appointments yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date / Time</th><th>Client</th><th>Service</th><th>Address</th><th>Status</th><th>Cleaner</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledList.map((b) => {
                    const cleanerName = b.cleaningJob
                      ? cleaners.find((c) => c.id === b.cleaningJob!.cleanerId)?.name ?? "—"
                      : "—";
                    return (
                      <tr
                        key={b.id}
                        onClick={() => onOpenBooking(b.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ whiteSpace: "nowrap" }}>{fmt(b.scheduledDate)}</td>
                        <td>{b.name}</td>
                        <td>{b.serviceType || <span style={{ opacity: 0.5 }}>—</span>}</td>
                        <td>{b.address}</td>
                        <td><span style={pillStyle(b.status)}>{b.status}</span></td>
                        <td>{cleanerName}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {b.status !== "CONFIRMED" && b.status !== "CANCELED" && (
                              <button
                                onClick={() => setStatus(b.id, "CONFIRMED")}
                                style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(88,166,255,0.5)", color: "var(--color-secondary)", background: "transparent", cursor: "pointer", fontSize: 13 }}
                              >
                                Approve
                              </button>
                            )}
                            {b.status !== "CANCELED" && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Cancel this appointment? The customer will be emailed.")) {
                                    setStatus(b.id, "CANCELED");
                                  }
                                }}
                                style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", background: "transparent", cursor: "pointer", fontSize: 13 }}
                              >
                                Cancel
                              </button>
                            )}
                            {b.status !== "COMPLETED" && b.status !== "CANCELED" && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Mark this appointment as complete?")) {
                                    setStatus(b.id, "COMPLETED");
                                  }
                                }}
                                style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.4)", color: "#86efac", background: "transparent", cursor: "pointer", fontSize: 13 }}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {view === "availability" && (
        <>
          {loadingCfg ? (
            <p style={{ opacity: 0.75 }}>Loading availability...</p>
          ) : (
            <>
              <div className="admin-table-wrap" style={{ marginBottom: 16 }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Day</th><th>Enabled</th><th>Start</th><th>End</th><th>Slot (min)</th></tr>
                  </thead>
                  <tbody>
                    {[0,1,2,3,4,5,6].map((dow) => {
                      const rule = config.find((r) => r.dayOfWeek === dow) ?? {
                        dayOfWeek: dow, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: false,
                      };
                      return (
                        <tr key={dow}>
                          <td>{DAY_LABELS_LONG[dow]}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => updateRule(dow, { enabled: e.target.checked })}
                              style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className="input"
                              value={rule.startTime}
                              onChange={(e) => updateRule(dow, { startTime: e.target.value })}
                              style={{ width: 130 }}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className="input"
                              value={rule.endTime}
                              onChange={(e) => updateRule(dow, { endTime: e.target.value })}
                              style={{ width: 130 }}
                            />
                          </td>
                          <td>
                            <select
                              className="input"
                              value={rule.slotMinutes}
                              onChange={(e) => updateRule(dow, { slotMinutes: parseInt(e.target.value, 10) })}
                              style={{ width: 100 }}
                            >
                              {[30, 45, 60, 90, 120, 180, 240].map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary" onClick={saveConfig} disabled={savingCfg}>
                {savingCfg ? "Saving..." : "Save Availability"}
              </button>
            </>
          )}
        </>
      )}

      {view === "blocked" && (
        <>
          <div className="card" style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Block Time Range</h3>
            <div className="grid grid-2">
              <label>Start
                <input
                  type="datetime-local"
                  className="input"
                  value={blockDraft.startAt}
                  onChange={(e) => setBlockDraft({ ...blockDraft, startAt: e.target.value })}
                />
              </label>
              <label>End
                <input
                  type="datetime-local"
                  className="input"
                  value={blockDraft.endAt}
                  onChange={(e) => setBlockDraft({ ...blockDraft, endAt: e.target.value })}
                />
              </label>
            </div>
            <label>Reason (optional)
              <input
                className="input"
                value={blockDraft.reason}
                onChange={(e) => setBlockDraft({ ...blockDraft, reason: e.target.value })}
                placeholder="e.g. Out of office, holiday"
              />
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={addBlock} disabled={busyBlock}>
                {busyBlock ? "Saving..." : "Add Blocked Range"}
              </button>
            </div>
          </div>

          {blocked.length === 0 ? (
            <p style={{ opacity: 0.75 }}>No blocked time ranges.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Start</th><th>End</th><th>Reason</th><th></th></tr>
                </thead>
                <tbody>
                  {blocked.map((b) => (
                    <tr key={b.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(b.startAt)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(b.endAt)}</td>
                      <td>{b.reason || <span style={{ opacity: 0.5 }}>—</span>}</td>
                      <td>
                        <button
                          onClick={() => removeBlock(b.id)}
                          style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", background: "transparent", cursor: "pointer", fontSize: 13 }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={!!openDayKey} onClose={() => setOpenDayKey(null)}>
        {openDayKey && (() => {
          const dayBookings = (bookingsByDay.get(openDayKey) ?? [])
            .slice()
            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
          const sample = dayBookings[0]?.scheduledDate
            ? new Date(dayBookings[0].scheduledDate)
            : (() => {
                const [y, m, d] = openDayKey.split("-").map((n) => parseInt(n, 10));
                return new Date(y, m, d);
              })();
          const titleDate = sample.toLocaleDateString([], {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          });
          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22 }}>{titleDate}</h2>
                  <p style={{ marginTop: 4, opacity: 0.75, fontSize: 14 }}>
                    {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"} scheduled
                  </p>
                </div>
                <button className="btn btn-outline" onClick={() => setOpenDayKey(null)} style={{ padding: "6px 14px", fontSize: 13 }}>Close</button>
              </div>

              {dayBookings.length === 0 ? (
                <p style={{ opacity: 0.75 }}>No bookings on this day.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {dayBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onOpenBooking(b.id);
                        setOpenDayKey(null);
                      }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: 12,
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface)",
                        color: "inherit",
                        font: "inherit",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14, minWidth: 80 }}>
                        {new Date(b.scheduledDate!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                        <strong style={{ fontSize: 14 }}>{b.name}</strong>
                        <span style={{ fontSize: 12, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {b.serviceType ? `${b.serviceType} · ` : ""}{b.address}
                        </span>
                      </span>
                      <span style={pillStyle(b.status)}>{b.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </Modal>
    </>
  );
}
