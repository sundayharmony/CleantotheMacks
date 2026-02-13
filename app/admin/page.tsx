"use client";

import { useEffect, useMemo, useState } from "react";

type BookingStatus = "NEW" | "CONFIRMED" | "COMPLETED";

type Booking = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  sqFt: string | null;
  homeSize: string;
  notes: string | null;
  status: BookingStatus | null;
};

type BookingDraft = {
  name: string;
  email: string;
  phone: string;
  address: string;
  homeSize: string;
  sqFt: string;
  notes: string;
  status: BookingStatus;
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function normalizeBooking(raw: unknown): Booking {
  const item = (raw ?? {}) as Record<string, unknown>;
  const status =
    item.status === "CONFIRMED" || item.status === "COMPLETED" || item.status === "NEW"
      ? (item.status as BookingStatus)
      : "NEW";

  return {
    id: String(item.id ?? ""),
    createdAt: String(item.createdAt ?? ""),
    name: String(item.name ?? ""),
    email: String(item.email ?? ""),
    phone: typeof item.phone === "string" ? item.phone : null,
    address: String(item.address ?? ""),
    sqFt: typeof item.sqFt === "string" ? item.sqFt : typeof item.sqft === "string" ? item.sqft : null,
    homeSize: String(item.homeSize ?? ""),
    notes: typeof item.notes === "string" ? item.notes : null,
    status,
  };
}

function toDraft(b: Booking): BookingDraft {
  return {
    name: b.name,
    email: b.email,
    phone: b.phone ?? "",
    address: b.address,
    homeSize: b.homeSize,
    sqFt: b.sqFt ?? "",
    notes: b.notes ?? "",
    status: (b.status ?? "NEW") as BookingStatus,
  };
}

function statusBadgeStyle(status: BookingStatus) {
  switch (status) {
    case "NEW":
      return {
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
        background: "rgba(255,255,255,0.06)",
      };
    case "CONFIRMED":
      return {
        border: "1px solid rgba(88,166,255,0.5)",
        color: "var(--color-secondary)",
        background: "rgba(88,166,255,0.12)",
      };
    case "COMPLETED":
      return {
        border: "1px solid rgba(34,197,94,0.4)",
        color: "#86efac",
        background: "rgba(34,197,94,0.12)",
      };
  }
}

export default function AdminPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [filter, setFilter] = useState<"ALL" | BookingStatus>("ALL");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      // Your existing GET is likely already at /api/book
      const res = await fetch("/api/book", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load bookings (${res.status})`);
      const data = await res.json();

      // Support both shapes:
      // 1) { bookings: [...] }
      // 2) [...]
      const rawList = Array.isArray(data) ? data : (data.bookings ?? []);
      const list = rawList.map(normalizeBooking);
      setRows(list);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        const status = (r.status ?? "NEW") as BookingStatus;
        if (filter !== "ALL" && status !== filter) return false;
        if (!query) return true;

        const hay = [
          r.name,
          r.email,
          r.phone ?? "",
          r.address,
          r.homeSize,
          r.sqFt ?? "",
          r.notes ?? "",
          status,
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(query);
      })
      // newest first
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rows, filter, q]);

  const selectedBooking = useMemo(
    () => (selectedId ? rows.find((r) => r.id === selectedId) ?? null : null),
    [rows, selectedId]
  );

  function openBooking(b: Booking) {
    setSelectedId(b.id);
    setDraft(toDraft(b));
  }

  function closeModal() {
    if (saving || deleting) return;
    setSelectedId(null);
    setDraft(null);
  }

  function updateLocalRow(updated: Booking) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedId === updated.id) {
      setDraft(toDraft(updated));
    }
  }

  async function updateStatus(id: string, next: BookingStatus) {
    if (!id) {
      alert("Missing booking id. Please refresh.");
      return;
    }

    // optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: next } : r))
    );

    try {
      const res = await fetch(`/api/book/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const data = (await res.json()) as { booking?: unknown };
      if (data.booking) {
        updateLocalRow(normalizeBooking(data.booking));
      }
    } catch (e: unknown) {
      // rollback on failure by reloading from server (simplest + safest)
      await load();
      const message =
        e instanceof Error ? e.message : "Failed to update status";
      alert(message);
    }
  }

  async function saveBooking() {
    if (!selectedBooking || !draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/book/${selectedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBooking.id,
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          address: draft.address,
          homeSize: draft.homeSize,
          sqft: draft.sqFt,
          notes: draft.notes,
          status: draft.status,
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const data = (await res.json()) as { booking?: unknown };
      if (data.booking) {
        updateLocalRow(normalizeBooking(data.booking));
      } else {
        await load();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save booking";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBooking() {
    if (!selectedBooking) return;
    const ok = window.confirm(`Delete booking for ${selectedBooking.name}?`);
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/book/${selectedBooking.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setRows((prev) => prev.filter((r) => r.id !== selectedBooking.id));
      setSelectedId(null);
      setDraft(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete booking";
      alert(message);
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    // You already have /api/admin/login route; if you also made a logout, use it.
    // If not, this just clears cookie server-side if you have /api/admin/logout.
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) window.location.href = "/admin/login";
      else window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  }

  return (
    <section className="section">
      <div className="container container-wide">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 36, margin: 0 }}>Admin Dashboard</h1>
          <p style={{ opacity: 0.75, marginTop: 6 }}>Bookings</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={load}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>

          <button
            onClick={logout}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone, address..."
          style={{
            width: 320,
            maxWidth: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            outline: "none",
          }}
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "ALL" | BookingStatus)
          }
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            outline: "none",
          }}
        >
          <option value="ALL">All statuses</option>
          <option value="NEW">NEW</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>

        <div style={{ opacity: 0.75 }}>
          Showing <b>{filtered.length}</b> of <b>{rows.length}</b>
        </div>
      </div>

      {loading ? (
        <p style={{ marginTop: 18, opacity: 0.75 }}>Loading…</p>
      ) : err ? (
        <p style={{ marginTop: 18, color: "tomato" }}>{err}</p>
      ) : filtered.length === 0 ? (
        <p style={{ marginTop: 18, opacity: 0.75 }}>No bookings found.</p>
      ) : (
        <div className="admin-table-wrap" style={{ marginTop: 18 }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <colgroup>
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.85 }}>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Date</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Name</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Email</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Phone</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Address</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222", whiteSpace: "nowrap" }}>Sq Ft</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Bedrooms</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222", whiteSpace: "nowrap" }}>Status</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Notes</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((b) => {
                const status = (b.status ?? "NEW") as BookingStatus;

                const mailto = `mailto:${encodeURIComponent(b.email)}`;
                const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;

                return (
                  <tr
                    key={b.id}
                    style={{ borderBottom: "1px solid #151515", cursor: "pointer" }}
                    onClick={() => openBooking(b)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openBooking(b);
                      }
                    }}
                  >
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{formatDate(b.createdAt)}</td>
                    <td style={{ padding: "10px 8px" }}>{b.name}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <a
                        href={mailto}
                        style={{ color: "var(--color-secondary)", textDecoration: "underline" }}
                      >
                        {b.email}
                      </a>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      {b.phone ? (
                        <span style={{ color: "var(--color-secondary)" }}>{b.phone}</span>
                      ) : (
                        <span style={{ opacity: 0.6 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{b.address}</td>
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      {b.sqFt ?? <span style={{ opacity: 0.6 }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{b.homeSize}</td>

                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "4px 8px",
                            borderRadius: 999,
                            ...statusBadgeStyle(status),
                          }}
                        >
                          {status}
                        </span>

                        <select
                          value={status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 10,
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface)",
                            color: "var(--color-text)",
                            outline: "none",
                            minWidth: 132,
                          }}
                          aria-label="Change status"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
                    </td>

                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ opacity: b.notes ? 1 : 0.6 }}>
                        {b.notes ? b.notes : "—"}
                      </span>
                    </td>

                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      <a
                        href={maps}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--color-border)",
                          textDecoration: "none",
                          color: "var(--color-text)",
                          marginRight: 8,
                        }}
                      >
                        Map
                      </a>

                      <a
                        href={mailto}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--color-border)",
                          textDecoration: "none",
                          color: "var(--color-text)",
                        }}
                      >
                        Email
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedBooking && draft ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.72)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(920px, 96vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 26 }}>Booking Details</h2>
                <p style={{ marginTop: 6, opacity: 0.75 }}>
                  Created: {formatDate(selectedBooking.createdAt)}
                </p>
              </div>
              <button className="btn btn-outline" onClick={closeModal} disabled={saving || deleting}>
                Close
              </button>
            </div>

            <div className="grid grid-2">
              <label>
                Name
                <input
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                />
              </label>
              <label>
                Email
                <input
                  className="input"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                />
              </label>
              <label>
                Phone
                <input
                  className="input"
                  value={draft.phone}
                  onChange={(e) => setDraft((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                />
              </label>
              <label>
                Bedrooms
                <input
                  className="input"
                  value={draft.homeSize}
                  onChange={(e) => setDraft((prev) => (prev ? { ...prev, homeSize: e.target.value } : prev))}
                />
              </label>
              <label>
                Sq Ft
                <input
                  className="input"
                  value={draft.sqFt}
                  onChange={(e) => setDraft((prev) => (prev ? { ...prev, sqFt: e.target.value } : prev))}
                />
              </label>
              <label>
                Status
                <select
                  className="input"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((prev) => (prev ? { ...prev, status: e.target.value as BookingStatus } : prev))
                  }
                >
                  <option value="NEW">NEW</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </label>
            </div>

            <label>
              Address
              <input
                className="input"
                value={draft.address}
                onChange={(e) => setDraft((prev) => (prev ? { ...prev, address: e.target.value } : prev))}
              />
            </label>

            <label>
              Notes
              <textarea
                className="input"
                rows={4}
                value={draft.notes}
                onChange={(e) => setDraft((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <button
                className="btn btn-outline"
                onClick={deleteBooking}
                disabled={saving || deleting}
                style={{ borderColor: "rgba(239,68,68,0.5)", color: "#fca5a5" }}
              >
                {deleting ? "Deleting..." : "Delete Booking"}
              </button>
              <button className="btn btn-primary" onClick={saveBooking} disabled={saving || deleting}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </section>
  );
}
