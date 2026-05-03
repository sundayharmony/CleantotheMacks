"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = { startAt: string; endAt: string; available: boolean };
type Day = { date: string; dayOfWeek: number; slots: Slot[] };

const SERVICE_OPTIONS = [
  { value: "standard", label: "Standard Cleaning" },
  { value: "deep_clean", label: "Deep Clean" },
  { value: "move_in", label: "Move-In / Move-Out" },
  { value: "recurring", label: "Recurring Cleaning" },
  { value: "painting", label: "Interior Painting" },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function BookPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [days, setDays] = useState<Day[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [serviceType, setServiceType] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingSlots(true);
      try {
        const res = await fetch("/api/availability", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load availability");
        const data = (await res.json()) as { days: Day[] };
        if (cancelled) return;
        setDays(data.days);
        const firstAvailable = data.days.find((d) => d.slots.some((s) => s.available));
        if (firstAvailable) setSelectedDate(firstAvailable.date);
      } catch {
        if (!cancelled) setDays([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableDays = useMemo(
    () => days.filter((d) => d.slots.some((s) => s.available)),
    [days],
  );

  const selectedDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  );

  const availableTimeSlots = useMemo(
    () => selectedDay?.slots.filter((s) => s.available) ?? [],
    [selectedDay],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!serviceType) {
      setError("Please choose a service type.");
      return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }

    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const slotMinutes = Math.round(
      (new Date(selectedSlot.endAt).getTime() - new Date(selectedSlot.startAt).getTime()) / 60000,
    );

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      homeSize: formData.get("homeSize"),
      sqft: formData.get("sqft"),
      notes: formData.get("notes"),
      serviceType,
      scheduledDate: selectedSlot.startAt,
      slotMinutes,
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong. Please try again.");
        if (res.status === 409) {
          const refreshed = await fetch("/api/availability", { cache: "no-store" });
          if (refreshed.ok) {
            const d = (await refreshed.json()) as { days: Day[] };
            setDays(d.days);
            setSelectedSlot(null);
          }
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setSelectedSlot(null);
      setSelectedDate(null);
      form.reset();
      setServiceType("");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="hero" style={{ alignItems: "start" }}>
          <div className="stack">
            <span className="hero-badge">Booking</span>
            <h1 style={{ fontSize: 44, marginBottom: 10 }}>Book an Appointment</h1>
            <p className="section-subtitle">
              Pick a service, choose a time that works, and we&apos;ll confirm by email.
            </p>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>What happens next</h3>
              <ol style={{ display: "grid", gap: 10, color: "var(--color-muted)" }}>
                <li>You receive an instant request-received email.</li>
                <li>We review your request and send a confirmation email once it&apos;s approved.</li>
                <li>We arrive on time and ready to take care of your space.</li>
              </ol>
            </div>
          </div>

          <div>
            {success && (
              <p style={{ color: "limegreen", marginBottom: 12 }}>
                Request submitted. Check your email for the receipt — we&apos;ll send a separate confirmation once we approve it.
              </p>
            )}

            {error && (
              <p style={{ color: "tomato", marginBottom: 12 }}>{error}</p>
            )}

            <form
              onSubmit={onSubmit}
              className="card"
              style={{ display: "grid", gap: 16 }}
            >
              <label>
                Service Type *
                <select
                  className="input"
                  value={serviceType}
                  onChange={(e) => {
                    setServiceType(e.target.value);
                    setSuccess(false);
                  }}
                  required
                >
                  <option value="">Select a service...</option>
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-2">
                <label>
                  Date *
                  <select
                    className="input"
                    value={selectedDate ?? ""}
                    onChange={(e) => {
                      setSelectedDate(e.target.value || null);
                      setSelectedSlot(null);
                      setSuccess(false);
                    }}
                    disabled={loadingSlots || availableDays.length === 0}
                    required
                  >
                    <option value="" disabled>
                      {loadingSlots
                        ? "Loading..."
                        : availableDays.length === 0
                          ? "No availability"
                          : "Choose a date..."}
                    </option>
                    {availableDays.map((d) => (
                      <option key={d.date} value={d.date}>
                        {formatDateLabel(d.date)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Time *
                  <select
                    className="input"
                    value={selectedSlot?.startAt ?? ""}
                    onChange={(e) => {
                      const found = selectedDay?.slots.find((s) => s.startAt === e.target.value) ?? null;
                      setSelectedSlot(found);
                      setSuccess(false);
                    }}
                    disabled={!selectedDay || availableTimeSlots.length === 0}
                    required
                  >
                    <option value="" disabled>
                      {!selectedDay
                        ? "Pick a date first"
                        : availableTimeSlots.length === 0
                          ? "No open times"
                          : "Choose a time..."}
                    </option>
                    {availableTimeSlots.map((slot) => {
                      const minutes = Math.round(
                        (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60000,
                      );
                      return (
                        <option key={slot.startAt} value={slot.startAt}>
                          {formatTime(slot.startAt)} - {formatTime(slot.endAt)} ({minutes} min)
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              {loadingSlots && (
                <small style={{ color: "var(--color-muted)" }}>Loading availability...</small>
              )}
              {!loadingSlots && availableDays.length === 0 && (
                <small style={{ color: "var(--color-muted)" }}>
                  No availability in the next 30 days. Please check back soon.
                </small>
              )}
              {!loadingSlots && selectedDay && availableTimeSlots.length === 0 && (
                <small style={{ color: "var(--color-muted)" }}>
                  No open times on this date. Try another date.
                </small>
              )}

              <div className="grid grid-2">
                <label>
                  Name *
                  <input className="input" name="name" required placeholder="Your name" />
                </label>

                <label>
                  Email *
                  <input
                    className="input"
                    type="email"
                    name="email"
                    required
                    placeholder="you@email.com"
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label>
                  Phone *
                  <input
                    className="input"
                    name="phone"
                    required
                    placeholder="555-123-4567"
                  />
                </label>

                <label>
                  Address *
                  <input
                    className="input"
                    name="address"
                    required
                    placeholder="Street address"
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label>
                  Bedrooms *
                  <select className="input" name="homeSize" required>
                    <option value="">Select one...</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </label>

                <label>
                  Square Feet *
                  <input
                    className="input"
                    name="sqft"
                    required
                    placeholder="e.g. 1800"
                  />
                </label>
              </div>

              <label>
                Notes (optional)
                <textarea
                  className="input"
                  name="notes"
                  placeholder="Pets, special areas, timing, etc."
                />
              </label>

              <button
                type="submit"
                disabled={loading || !selectedSlot || !serviceType}
                className="btn btn-primary"
                style={{ width: "fit-content" }}
              >
                {loading ? "Submitting..." : "Book Appointment"}
              </button>
              <small>* Required fields</small>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
