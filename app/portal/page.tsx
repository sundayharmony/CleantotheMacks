"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  preferredDay: string | null;
  preferredTime: string | null;
}

interface Booking {
  id: string;
  date: string;
  time: string;
  frequency: string;
  extras: string[];
  notes: string | null;
  bedrooms: number;
  bathrooms: number;
  status: string;
  createdAt: string;
  cleaningJob: {
    status: string;
    totalPay: number | null;
    clockInTime: string | null;
    clockOutTime: string | null;
  } | null;
}

export default function PortalDashboard() {
  const router = useRouter();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        setClient(data.client);
        setBookings(data.bookings || []);
      })
      .catch(() => {
        router.push("/portal/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/portal/logout", { method: "POST" });
    router.push("/portal/login");
  }

  if (loading) {
    return (
      <section className="section" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-muted)" }}>Loading your dashboard...</p>
      </section>
    );
  }

  if (!client) return null;

  const upcoming = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed" || (b.cleaningJob && b.cleaningJob.status === "assigned")
  );
  const past = bookings.filter(
    (b) => b.cleaningJob?.status === "completed" || b.status === "cancelled"
  );

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <>
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, marginBottom: 4 }}>
                Welcome back, {client.name?.split(" ")[0] || "there"}
              </h1>
              <p style={{ color: "var(--color-muted)" }}>{client.email}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/book" className="btn btn-primary">
                Book a Cleaning
              </Link>
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
        </div>
      </section>

      {/* Profile Summary */}
      <section className="section" style={{ paddingTop: 24, paddingBottom: 0 }}>
        <div className="container">
          <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Address</span>
              <p style={{ marginTop: 4 }}>{client.address || "Not set"}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Phone</span>
              <p style={{ marginTop: 4 }}>{client.phone || "Not set"}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Preferred Day</span>
              <p style={{ marginTop: 4 }}>{client.preferredDay || "Any"}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Total Bookings</span>
              <p style={{ marginTop: 4, fontWeight: 600, fontSize: 20 }}>{bookings.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Bookings */}
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Upcoming Bookings</h2>
          {upcoming.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>
                No upcoming bookings.
              </p>
              <Link href="/book" className="btn btn-primary">
                Schedule a Cleaning
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcoming.map((b) => (
                <div key={b.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <strong>{formatDate(b.date)}</strong>
                    <span style={{ color: "var(--color-muted)", marginLeft: 8 }}>{b.time}</span>
                    <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
                      {b.bedrooms} bed / {b.bathrooms} bath &middot; {b.frequency}
                      {b.extras?.length > 0 && ` + ${b.extras.join(", ")}`}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      background:
                        b.cleaningJob?.status === "assigned"
                          ? "rgba(59,130,246,0.15)"
                          : "rgba(234,179,8,0.15)",
                      color:
                        b.cleaningJob?.status === "assigned"
                          ? "#3b82f6"
                          : "#eab308",
                    }}
                  >
                    {b.cleaningJob?.status || b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past History */}
      {past.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2 style={{ fontSize: 22, marginBottom: 16 }}>Past Cleanings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {past.map((b) => (
                <div
                  key={b.id}
                  className="card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    opacity: 0.8,
                  }}
                >
                  <div>
                    <strong>{formatDate(b.date)}</strong>
                    <span style={{ color: "var(--color-muted)", marginLeft: 8 }}>{b.time}</span>
                    <div style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 4 }}>
                      {b.bedrooms} bed / {b.bathrooms} bath &middot; {b.frequency}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      background:
                        b.status === "cancelled"
                          ? "rgba(220,38,38,0.15)"
                          : "rgba(34,197,94,0.15)",
                      color: b.status === "cancelled" ? "#dc2626" : "#22c55e",
                    }}
                  >
                    {b.cleaningJob?.status || b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
