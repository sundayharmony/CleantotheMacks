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

function bookingPillClass(raw: string): string {
  const s = raw.toLowerCase();
  if (s === "cancelled" || s === "canceled") return "pill-danger";
  if (s === "completed") return "pill-success";
  if (s === "assigned" || s === "in_progress") return "pill-info";
  if (s === "confirmed" || s === "pending") return "pill-warning";
  return "pill-neutral";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
      <section className="section" style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
        <p className="text-muted">Loading your dashboard…</p>
      </section>
    );
  }

  if (!client) return null;

  const upcoming = bookings.filter(
    (b) =>
      b.status === "pending" ||
      b.status === "confirmed" ||
      (b.cleaningJob && b.cleaningJob.status === "assigned"),
  );
  const past = bookings.filter(
    (b) => b.cleaningJob?.status === "completed" || b.status === "cancelled",
  );

  return (
    <>
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div
            className="row"
            style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}
          >
            <div>
              <span className="hero-eyebrow">Client portal</span>
              <h1 className="section-title" style={{ marginTop: 10, marginBottom: 4 }}>
                Welcome back, {client.name?.split(" ")[0] || "there"}
              </h1>
              <p className="text-muted">{client.email}</p>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <Link href="/book" className="btn btn-primary">
                Book a Cleaning
              </Link>
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
        </div>
      </section>

      <section className="section section-tight" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div style={{ padding: "4px 0" }}>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Address
              </span>
              <p style={{ marginTop: 6, fontWeight: 500 }}>{client.address || "Not set"}</p>
            </div>
            <div style={{ padding: "4px 0" }}>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Phone
              </span>
              <p style={{ marginTop: 6, fontWeight: 500 }}>{client.phone || "Not set"}</p>
            </div>
            <div style={{ padding: "4px 0" }}>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Preferred day
              </span>
              <p style={{ marginTop: 6, fontWeight: 500 }}>{client.preferredDay || "Any"}</p>
            </div>
            <div style={{ padding: "4px 0" }}>
              <span className="helper-text" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Total bookings
              </span>
              <p style={{ marginTop: 6, fontWeight: 800, fontSize: 22 }}>{bookings.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <h2 className="section-title" style={{ fontSize: 22, marginBottom: 16 }}>
            Upcoming bookings
          </h2>
          {upcoming.length === 0 ? (
            <div className="card text-center" style={{ padding: "40px 24px" }}>
              <p className="text-muted" style={{ marginBottom: 16 }}>
                No upcoming bookings yet.
              </p>
              <Link href="/book" className="btn btn-primary">
                Schedule a Cleaning
              </Link>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {upcoming.map((b) => {
                const label = b.cleaningJob?.status || b.status;
                return (
                  <div
                    key={b.id}
                    className="card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong>{formatDate(b.date)}</strong>
                      <span className="text-muted" style={{ marginLeft: 8 }}>
                        {b.time}
                      </span>
                      <div className="helper-text" style={{ marginTop: 6 }}>
                        {b.bedrooms} bed / {b.bathrooms} bath · {b.frequency}
                        {b.extras?.length > 0 ? ` + ${b.extras.join(", ")}` : ""}
                      </div>
                    </div>
                    <span className={`pill ${bookingPillClass(label)}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="section section-tight" style={{ paddingTop: 0 }}>
          <div className="container full-bleed-auto">
            <h2 className="section-title" style={{ fontSize: 22, marginBottom: 16 }}>
              Past cleanings
            </h2>
            <div className="stack" style={{ gap: 12 }}>
              {past.map((b) => {
                const label = b.cleaningJob?.status || b.status;
                return (
                  <div
                    key={b.id}
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
                      <strong>{formatDate(b.date)}</strong>
                      <span className="text-muted" style={{ marginLeft: 8 }}>
                        {b.time}
                      </span>
                      <div className="helper-text" style={{ marginTop: 6 }}>
                        {b.bedrooms} bed / {b.bathrooms} bath · {b.frequency}
                      </div>
                    </div>
                    <span className={`pill ${bookingPillClass(label)}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
