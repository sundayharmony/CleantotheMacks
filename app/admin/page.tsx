"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

/* ─── Shared Types ─── */

type BookingStatus = "NEW" | "CONFIRMED" | "COMPLETED";
type JobStatus = "assigned" | "in_progress" | "completed" | "cancelled";
type Tab = "dashboard" | "bookings" | "clients" | "cleaners" | "jobs" | "testimonials";

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
  cleaningJob?: { id: string; cleanerId: string; status: string } | null;
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

/* ─── Helpers ─── */

function fmt(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [bRes, cRes, clRes, jRes, tRes] = await Promise.all([
        fetch("/api/book", { cache: "no-store" }),
        fetch("/api/client", { cache: "no-store" }),
        fetch("/api/cleaner", { cache: "no-store" }),
        fetch("/api/job", { cache: "no-store" }),
        fetch("/api/testimonial?all=true", { cache: "no-store" }),
      ]);
      if (!bRes.ok || !cRes.ok || !clRes.ok || !jRes.ok) throw new Error("Failed to load data");
      const [bData, cData, clData, jData, tData] = await Promise.all([bRes.json(), cRes.json(), clRes.json(), jRes.json(), tRes.ok ? tRes.json() : { testimonials: [] }]);
      setBookings(Array.isArray(bData) ? bData : bData.bookings ?? []);
      setClients(cData.clients ?? []);
      setCleaners(clData.cleaners ?? []);
      setJobs(jData.jobs ?? []);
      setTestimonials(tData.testimonials ?? []);
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
          {(["dashboard", "bookings", "clients", "cleaners", "jobs", "testimonials"] as Tab[]).map((t) => (
            <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t === "dashboard" ? "Dashboard" : t === "bookings" ? "Bookings" : t === "clients" ? "Clients" : t === "cleaners" ? "Cleaners" : t === "jobs" ? "Jobs" : "Testimonials"}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ opacity: 0.75 }}>Loading…</p>
        ) : err ? (
          <p style={{ color: "tomato" }}>{err}</p>
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab bookings={bookings} clients={clients} jobs={jobs} testimonials={testimonials} setTab={setTab} />}
            {tab === "bookings" && <BookingsTab bookings={bookings} setBookings={setBookings} cleaners={cleaners} clients={clients} reload={loadAll} />}
            {tab === "clients" && <ClientsTab clients={clients} setClients={setClients} reload={loadAll} />}
            {tab === "cleaners" && <CleanersTab cleaners={cleaners} setCleaners={setCleaners} reload={loadAll} />}
            {tab === "jobs" && <JobsTab jobs={jobs} setJobs={setJobs} bookings={bookings} cleaners={cleaners} reload={loadAll} />}
            {tab === "testimonials" && <TestimonialsTab testimonials={testimonials} setTestimonials={setTestimonials} reload={loadAll} />}
          </>
        )}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   BOOKINGS TAB
   ════════════════════════════════════════════════════════════════ */

function BookingsTab({ bookings, setBookings, cleaners, clients, reload }: {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  cleaners: Cleaner[];
  clients: Client[];
  reload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return bookings
      .filter((r) => {
        if (filter !== "ALL" && r.status !== filter) return false;
        if (!query) return true;
        return [r.name, r.email, r.phone ?? "", r.address, r.homeSize, r.sqft ?? "", r.notes ?? "", r.status]
          .join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, filter, q]);

  const selected = selectedId ? bookings.find((b) => b.id === selectedId) ?? null : null;

  // Editable draft for modal
  const [draft, setDraft] = useState<Record<string, string>>({});
  function openBooking(b: Booking) {
    setSelectedId(b.id);
    setDraft({
      name: b.name, email: b.email, phone: b.phone ?? "", address: b.address,
      homeSize: b.homeSize, sqft: b.sqft ?? "", notes: b.notes ?? "",
      status: b.status, clientId: b.clientId ?? "", serviceType: b.serviceType ?? "",
    });
  }
  function close() { if (!saving) { setSelectedId(null); } }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/book/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, sqft: draft.sqft, clientId: draft.clientId || null }),
      });
      if (!res.ok) throw new Error("Save failed");
      await reload();
      setSelectedId(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  async function deleteBooking() {
    if (!selected || !window.confirm(`Delete booking for ${selected.name}?`)) return;
    try {
      await fetch(`/api/book/${selected.id}`, { method: "DELETE" });
      setBookings((prev) => prev.filter((r) => r.id !== selected.id));
      setSelectedId(null);
    } catch { alert("Delete failed"); }
  }

  async function assignCleaner(bookingId: string, cleanerId: string) {
    try {
      const res = await fetch("/api/job", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, cleanerId }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error || "Assign failed"); }
      await reload();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Assign failed"); }
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
        </select>
        <span style={{ opacity: 0.75, fontSize: 14 }}>Showing <b>{filtered.length}</b> of <b>{bookings.length}</b></span>
      </div>

      {filtered.length === 0 ? <p style={{ opacity: 0.75 }}>No bookings found.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th><th>Name</th><th>Email</th><th>Phone</th>
                <th>Address</th><th>Bedrooms</th><th>Status</th><th>Cleaner</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const assignedCleaner = b.cleaningJob ? cleaners.find((c) => c.id === b.cleaningJob?.cleanerId)?.name : null;
                return (
                  <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => openBooking(b)}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(b.createdAt)}</td>
                    <td>{b.name}</td>
                    <td><span style={{ color: "var(--color-secondary)" }}>{b.email}</span></td>
                    <td>{b.phone || <span style={{ opacity: 0.5 }}>—</span>}</td>
                    <td>{b.address}</td>
                    <td>{b.homeSize}</td>
                    <td><span style={pillStyle(b.status)}>{b.status}</span></td>
                    <td>{assignedCleaner || <span style={{ opacity: 0.5 }}>Unassigned</span>}</td>
                    <td>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                        onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer"
                        style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--color-border)", color: "var(--color-text)", textDecoration: "none", fontSize: 13 }}>
                        Map
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={close}>
        {selected && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24 }}>Booking Details</h2>
                <p style={{ marginTop: 4, opacity: 0.75, fontSize: 14 }}>Created: {fmt(selected.createdAt)}</p>
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
                <select className="input" value={draft.status ?? "NEW"} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  <option value="NEW">NEW</option><option value="CONFIRMED">CONFIRMED</option><option value="COMPLETED">COMPLETED</option>
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
                </select>
              </label>
            </div>
            <label>Address<input className="input" value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
            <label>Notes<textarea className="input" rows={3} value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>

            {/* Assign cleaner */}
            {!selected.cleaningJob && (
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
                <label>Assign Cleaner
                  <select className="input" defaultValue="" onChange={(e) => { if (e.target.value) assignCleaner(selected.id, e.target.value); }}>
                    <option value="" disabled>Select a cleaner…</option>
                    {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.paymentType === "hourly" ? `$${c.hourlyRate}/hr` : "Per job"}</option>)}
                  </select>
                </label>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn-outline" onClick={deleteBooking} disabled={saving} style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}>Delete Booking</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </>
        )}
      </Modal>
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
   DASHBOARD TAB
   ════════════════════════════════════════════════════════════════ */

function DashboardTab({ bookings, clients, jobs, testimonials, setTab }: {
  bookings: Booking[];
  clients: Client[];
  jobs: Job[];
  testimonials: Testimonial[];
  setTab: (t: Tab) => void;
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

  return (
    <>
      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setTab("bookings")} style={{ padding: "10px 18px", fontSize: 14 }}>View Bookings</button>
        <button className="btn btn-outline" onClick={() => setTab("clients")} style={{ padding: "10px 18px", fontSize: 14 }}>Manage Clients</button>
        <button className="btn btn-outline" onClick={() => setTab("testimonials")} style={{ padding: "10px 18px", fontSize: 14 }}>Manage Testimonials</button>
      </div>

      {/* Stats Grid */}
      <div className="stat-row" style={{ marginBottom: 24 }}>
        <div className="stat-card"><strong>{bookingsThisMonth}</strong><small>Bookings This Month</small></div>
        <div className="stat-card"><strong>{newBookings}</strong><small>New / Pending</small></div>
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
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 14 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{b.name}</span>
                <span style={{ color: "var(--color-muted)" }}>{b.address}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: "var(--color-muted)", fontSize: 13 }}>{fmtDate(b.createdAt)}</span>
                <span style={pillStyle(b.status)}>{b.status}</span>
              </div>
            </div>
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
