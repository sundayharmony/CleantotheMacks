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

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
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
      const list: Booking[] = Array.isArray(data) ? data : (data.bookings ?? []);
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
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
    } catch (e: any) {
      // rollback on failure by reloading from server (simplest + safest)
      await load();
      alert(e?.message || "Failed to update status");
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
          onChange={(e) => setFilter(e.target.value as any)}
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
        <div style={{ marginTop: 18 }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.85 }}>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Date</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Name</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Email</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Phone</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Address</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Sq Ft</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Bedrooms</th>
                <th style={{ padding: "10px 8px", borderBottom: "1px solid #222" }}>Status</th>
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
                  <tr key={b.id} style={{ borderBottom: "1px solid #151515" }}>
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
                    <td style={{ padding: "10px 8px" }}>{b.sqFt ?? <span style={{ opacity: 0.6 }}>—</span>}</td>
                    <td style={{ padding: "10px 8px" }}>{b.homeSize}</td>

                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                          onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 10,
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface)",
                            color: "var(--color-text)",
                            outline: "none",
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
      </div>
    </section>
  );
}
