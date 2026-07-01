"use client";

import { useEffect, useMemo, useState } from "react";
import PageHero from "../_components/PageHero";
import Alert from "../_components/Alert";
import BookingSummary from "../_components/BookingSummary";

type Slot = { startAt: string; endAt: string; available: boolean };
type Day = { date: string; dayOfWeek: number; slots: Slot[] };

const SERVICE_OPTIONS = [
  { value: "standard", label: "Standard Cleaning", desc: "Routine refresh of the whole home." },
  { value: "deep_clean", label: "Deep Clean", desc: "Detailed top-to-bottom reset." },
  { value: "move_in", label: "Move-In / Move-Out", desc: "Empty-home full refresh." },
  { value: "recurring", label: "Recurring Cleaning", desc: "Weekly, bi-weekly, or monthly visits." },
  { value: "painting", label: "Interior Painting", desc: "Walls, trim, and touch-ups." },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function parseISODateLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function monthKey(d: Date): number {
  return d.getFullYear() * 12 + d.getMonth();
}

function formatDateLabel(date: string): string {
  return parseISODateLocal(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function BookMonthCalendar({
  viewMonth,
  onViewMonthChange,
  availableSet,
  selectedDate,
  onSelectDate,
  minMonthKey,
  maxMonthKey,
}: {
  viewMonth: Date;
  onViewMonthChange: (d: Date) => void;
  availableSet: Set<string>;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  minMonthKey: number;
  maxMonthKey: number;
}) {
  const mk = monthKey(viewMonth);
  const canPrev = mk > minMonthKey;
  const canNext = mk < maxMonthKey;

  const y = viewMonth.getFullYear();
  const m = viewMonth.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const pad = (firstDow + 6) % 7;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const todayISO = toISODateLocal(new Date());

  return (
    <div className="book-cal">
      <div className="book-cal-nav">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!canPrev}
          onClick={() => onViewMonthChange(new Date(y, m - 1, 1))}
          aria-label="Previous month"
        >
          ←
        </button>
        <strong>{viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!canNext}
          onClick={() => onViewMonthChange(new Date(y, m + 1, 1))}
          aria-label="Next month"
        >
          →
        </button>
      </div>
      <div className="book-cal-dows" aria-hidden="true">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="book-cal-grid">
        {Array.from({ length: pad }, (_, i) => (
          <div key={`pad-${i}`} className="book-cal-empty" />
        ))}
        {Array.from({ length: lastDay }, (_, i) => i + 1).map((day) => {
          const iso = toISODateLocal(new Date(y, m, day));
          const available = availableSet.has(iso);
          const selected = selectedDate === iso;
          const today = iso === todayISO;
          return (
            <button
              key={iso}
              type="button"
              disabled={!available}
              className={`book-cal-day${available ? " available" : ""}${selected ? " selected" : ""}${today ? " today" : ""}`}
              onClick={() => onSelectDate(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function slotMinutes(slot: Slot) {
  return Math.round(
    (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60000,
  );
}

export default function BookPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
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

  const sortedAvailableDays = useMemo(
    () => [...availableDays].sort((a, b) => a.date.localeCompare(b.date)),
    [availableDays],
  );
  const availableSet = useMemo(
    () => new Set(sortedAvailableDays.map((d) => d.date)),
    [sortedAvailableDays],
  );
  const monthBounds = useMemo(() => {
    if (!sortedAvailableDays.length) return { min: 0, max: 0 };
    const a = parseISODateLocal(sortedAvailableDays[0].date);
    const b = parseISODateLocal(sortedAvailableDays[sortedAvailableDays.length - 1].date);
    return { min: monthKey(a), max: monthKey(b) };
  }, [sortedAvailableDays]);

  const [viewMonth, setViewMonth] = useState(() => new Date());

  useEffect(() => {
    if (!sortedAvailableDays.length) return;
    const first = parseISODateLocal(sortedAvailableDays[0].date);
    setViewMonth(new Date(first.getFullYear(), first.getMonth(), 1));
  }, [sortedAvailableDays]);

  useEffect(() => {
    if (!selectedDate) return;
    const d = parseISODateLocal(selectedDate);
    setViewMonth((prev) => {
      if (prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth()) return prev;
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  }, [selectedDate]);

  const selectedServiceLabel = SERVICE_OPTIONS.find((s) => s.value === serviceType)?.label;
  const selectedDateLabel = selectedDate ? formatDateLabel(selectedDate) : undefined;
  const selectedTimeLabel = selectedSlot
    ? `${formatTime(selectedSlot.startAt)} – ${formatTime(selectedSlot.endAt)}`
    : undefined;
  const selectedDuration = selectedSlot ? slotMinutes(selectedSlot) : undefined;

  const stepStatus: ("active" | "done" | "pending")[] = (() => {
    const a: ("active" | "done" | "pending")[] = ["pending", "pending", "pending"];
    if (serviceType) a[0] = "done";
    else a[0] = "active";
    if (selectedSlot) a[1] = "done";
    else if (a[0] === "done") a[1] = "active";
    if (a[1] === "done") a[2] = "active";
    return a;
  })();

  const ready = !!serviceType && !!selectedSlot;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!serviceType) {
      setError("Please choose a service type.");
      document.getElementById("step-service")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot.");
      document.getElementById("step-schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

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
      slotMinutes: slotMinutes(selectedSlot),
    };

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
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

      setSuccess({ id: data?.id ?? "" });
      setSelectedSlot(null);
      setSelectedDate(null);
      form.reset();
      setServiceType("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section className="section">
        <div className="container container-narrow">
          <div className="card card-elevated card-padded text-center">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--color-success-soft)",
                color: "var(--color-success)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
              aria-hidden="true"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5L20 7" />
              </svg>
            </div>
            <h1 style={{ fontSize: 32, marginBottom: 12 }}>Request received!</h1>
            <p className="text-muted" style={{ fontSize: 16, marginBottom: 16 }}>
              Thanks for booking with Clean to the Macks. We&apos;ve sent a receipt to your email
              and will follow up with a confirmation once we&apos;ve reviewed your request.
            </p>
            {success.id ? (
              <p style={{ fontSize: 14, color: "var(--color-muted)", marginBottom: 24 }}>
                Reference: <strong style={{ color: "var(--color-text)" }}>{success.id}</strong>
              </p>
            ) : null}
            <div className="row" style={{ justifyContent: "center", gap: 12 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSuccess(null)}
              >
                Book another
              </button>
              <a className="btn btn-outline" href="/">
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHero
        compact
        eyebrow="Request"
        title="Request a cleaning"
        subtitle="Pick a service and your preferred time — we'll confirm the final appointment after reviewing your request."
      />

      <section className="section section-tight" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="hero-shell">
            <form
              onSubmit={onSubmit}
              className="card card-padded"
              style={{ display: "flex", flexDirection: "column", gap: 28 }}
            >
              <div className="steps" aria-hidden="true">
                <span className={`step ${stepStatus[0]}`}>
                  <span className="step-num">1</span> Service
                </span>
                <span className="step-divider" />
                <span className={`step ${stepStatus[1]}`}>
                  <span className="step-num">2</span> Preferred time
                </span>
                <span className="step-divider" />
                <span className={`step ${stepStatus[2]}`}>
                  <span className="step-num">3</span> Details
                </span>
              </div>

              {error ? <Alert variant="error" live>{error}</Alert> : null}

              {/* Step 1 */}
              <fieldset id="step-service" style={{ border: "none", padding: 0, margin: 0 }}>
                <legend
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                    padding: 0,
                  }}
                >
                  1. Choose a service
                </legend>
                <p className="helper-text" style={{ marginBottom: 14 }}>
                  Pick the option that best fits what you need.
                </p>
                <div className="chip-row">
                  {SERVICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`chip chip-stack${serviceType === opt.value ? " selected" : ""}`}
                      style={{ minWidth: 180 }}
                      onClick={() => setServiceType(opt.value)}
                      aria-pressed={serviceType === opt.value}
                    >
                      <span className="chip-top">{opt.desc}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Step 2 */}
              <fieldset id="step-schedule" style={{ border: "none", padding: 0, margin: 0 }}>
                <legend
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                    padding: 0,
                  }}
                >
                  2. Preferred date and time
                </legend>
                <p className="helper-text" style={{ marginBottom: 14 }}>
                  Pick a time that works for you — this is your preference, not a confirmed appointment.
                  We&apos;ll follow up to finalize the schedule.
                </p>

                {loadingSlots ? (
                  <p className="text-muted">Loading availability…</p>
                ) : sortedAvailableDays.length === 0 ? (
                  <Alert variant="warning">
                    No availability in the next 30 days. Please check back soon or reach out
                    and we&apos;ll see what we can do.
                  </Alert>
                ) : (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <span className="helper-text" style={{ display: "block", marginBottom: 10 }}>
                        Select a date
                      </span>
                      <BookMonthCalendar
                        viewMonth={viewMonth}
                        onViewMonthChange={setViewMonth}
                        availableSet={availableSet}
                        selectedDate={selectedDate}
                        onSelectDate={(iso) => {
                          setSelectedDate(iso);
                          setSelectedSlot(null);
                        }}
                        minMonthKey={monthBounds.min}
                        maxMonthKey={monthBounds.max}
                      />
                    </div>

                    <label>
                      Time
                      {selectedDate ? (
                        <span className="helper-text" style={{ display: "block", fontWeight: 400, marginTop: 4 }}>
                          {formatDateLabel(selectedDate)}
                        </span>
                      ) : null}
                      <select
                        className="input"
                        style={{ marginTop: 8 }}
                        aria-label="Pick a time"
                        value={selectedSlot?.startAt ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) {
                            setSelectedSlot(null);
                            return;
                          }
                          const slot = availableTimeSlots.find((s) => s.startAt === v);
                          setSelectedSlot(slot ?? null);
                        }}
                        disabled={!selectedDay || availableTimeSlots.length === 0}
                      >
                        <option value="">
                          {!selectedDay
                            ? "Pick a date on the calendar first…"
                            : availableTimeSlots.length === 0
                              ? "No open times this day"
                              : "Select a time…"}
                        </option>
                        {availableTimeSlots.map((slot) => (
                          <option key={slot.startAt} value={slot.startAt}>
                            {formatTime(slot.startAt)} – {formatTime(slot.endAt)} ({slotMinutes(slot)} min)
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </fieldset>

              {/* Step 3 */}
              <fieldset id="step-details" style={{ border: "none", padding: 0, margin: 0 }}>
                <legend
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                    padding: 0,
                  }}
                >
                  3. Your details
                </legend>
                <p className="helper-text" style={{ marginBottom: 14 }}>
                  We&apos;ll use this to confirm and prep for your visit.
                </p>

                <div className="field-grid">
                  <div className="grid grid-2">
                    <label>
                      Name
                      <input
                        className="input"
                        name="name"
                        autoComplete="name"
                        required
                        placeholder="Your full name"
                      />
                    </label>
                    <label>
                      Email
                      <input
                        className="input"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        placeholder="you@email.com"
                      />
                    </label>
                  </div>

                  <div className="grid grid-2">
                    <label>
                      Phone
                      <input
                        className="input"
                        type="tel"
                        inputMode="tel"
                        name="phone"
                        autoComplete="tel"
                        required
                        placeholder="555-123-4567"
                      />
                    </label>
                    <label>
                      Address
                      <input
                        className="input"
                        name="address"
                        autoComplete="street-address"
                        required
                        placeholder="Street address"
                      />
                    </label>
                  </div>

                  <div className="grid grid-2">
                    <label>
                      Bedrooms
                      <select className="input" name="homeSize" required defaultValue="">
                        <option value="" disabled>
                          Select one…
                        </option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5+">5+</option>
                      </select>
                    </label>
                    <label>
                      Square Feet
                      <input
                        className="input"
                        type="number"
                        inputMode="numeric"
                        min={1}
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
                      placeholder="Pets, special areas, timing, parking, etc."
                    />
                  </label>
                </div>
              </fieldset>

              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: 18,
                }}
              >
                <small>* All fields above are required unless noted.</small>
                <button
                  type="submit"
                  disabled={loading || !ready}
                  className="btn btn-primary btn-lg"
                >
                  {loading ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>

            <div>
              <BookingSummary
                serviceLabel={selectedServiceLabel}
                dateLabel={selectedDateLabel}
                timeLabel={selectedTimeLabel}
                durationMin={selectedDuration}
                ready={ready}
                footer={
                  <div className="stack stack-sm">
                    <p className="helper-text">
                      You&apos;ll receive a request-received email instantly. We&apos;ll send a
                      confirmation once we approve it.
                    </p>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
