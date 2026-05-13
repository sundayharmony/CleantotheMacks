"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { generateSlotsForDate, formatSlotLabel, DEFAULT_AVAILABILITY } from "@/lib/scheduling";

/* ─── Shared Types ─── */

type BookingStatus = "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELED";
type JobStatus = "assigned" | "in_progress" | "completed" | "cancelled";
type Tab = "dashboard" | "bookings" | "schedule" | "clients" | "cleaners" | "jobs" | "testimonials" | "gallery" | "videoReleases";

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of today, upcoming work, and activity",
  },
  bookings: {
    title: "Bookings",
    subtitle: "Search, filter, and manage customer requests",
  },
  schedule: {
    title: "Schedule",
    subtitle: "Calendar, agenda, availability, and blocked time",
  },
  clients: { title: "Clients", subtitle: "Customer profiles and visit history" },
  cleaners: { title: "Cleaners", subtitle: "Team members and pay settings" },
  jobs: { title: "Jobs", subtitle: "Assignments, time tracking, and pay" },
  testimonials: { title: "Testimonials", subtitle: "Reviews shown on the website" },
  gallery: { title: "Gallery", subtitle: "Before & after photo pairs" },
  videoReleases: {
    title: "Video Releases",
    subtitle: "Electronic signature requests",
  },
};

function NavIcon({ tab }: { tab: Tab }) {
  const cls = "icon";
  switch (tab) {
    case "dashboard":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V9M10 19V5M16 19v-6M22 19V12" strokeLinecap="round" />
        </svg>
      );
    case "bookings":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 11h18" strokeLinecap="round" />
        </svg>
      );
    case "schedule":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
      );
    case "clients":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      );
    case "cleaners":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      );
    case "jobs":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M10 12h8M10 16h8" strokeLinecap="round" />
        </svg>
      );
    case "testimonials":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinecap="round" />
        </svg>
      );
    case "gallery":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "videoReleases":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

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
  signatureImageDataUrl: string | null;
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

function useNarrowLayout(maxWidth = 900) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const fn = () => setNarrow(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [maxWidth]);
  return narrow;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function avatarHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 360;
  return h;
}

function pillClassForStatus(status: string): string {
  switch (status) {
    case "NEW":
    case "assigned":
      return "pill-new";
    case "CONFIRMED":
    case "PENDING":
      return "pill-confirmed";
    case "COMPLETED":
    case "completed":
    case "SIGNED":
      return "pill-completed";
    case "CANCELED":
    case "cancelled":
      return "pill-canceled";
    case "EXPIRED":
      return "pill-warning";
    case "in_progress":
      return "pill-active";
    default:
      return "pill-neutral";
  }
}

function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`pill ${pillClassForStatus(status)}${className ? ` ${className}` : ""}`}>
      {label ?? status}
    </span>
  );
}

function KpiCard({
  label,
  value,
  foot,
  tone,
  onClick,
  isStatic,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  foot?: React.ReactNode;
  tone?: "primary" | "warning" | "success" | "info";
  onClick?: () => void;
  isStatic?: boolean;
}) {
  const toneClass = tone ? ` kpi-tone-${tone}` : "";
  const cls = `kpi-card${isStatic ? " static" : ""}${toneClass}`;
  const inner = (
    <>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {foot ? <span className="kpi-foot">{foot}</span> : null}
    </>
  );
  if (onClick && !isStatic) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function RowAction({
  children,
  href,
  onClick,
  variant = "default",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: "default" | "primary" | "success" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const v =
    variant === "primary"
      ? "row-action-primary"
      : variant === "success"
        ? "row-action-success"
        : variant === "danger"
          ? "row-action-danger"
          : "";
  const cls = `row-action ${v}`.trim();
  if (href) {
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer" onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
      {action}
    </div>
  );
}

function Toolbar({
  children,
  loose,
  className,
}: {
  children: React.ReactNode;
  loose?: boolean;
  className?: string;
}) {
  const cls = ["toolbar", loose ? "toolbar-loose" : "", className ?? ""].filter(Boolean).join(" ");
  return <div className={cls}>{children}</div>;
}

function SplitPane({ children }: { children: React.ReactNode }) {
  return <div className="split-pane">{children}</div>;
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  const bg = `hsl(${avatarHue(name)} 48% 44%)`;
  return (
    <div className={small ? "avatar avatar-sm" : "avatar"} style={{ background: bg }}>
      {initialsFromName(name)}
    </div>
  );
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ─── Modal Overlay ─── */

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */

const ADMIN_TAB_ORDER: Tab[] = [
  "dashboard",
  "bookings",
  "schedule",
  "clients",
  "cleaners",
  "jobs",
  "testimonials",
  "gallery",
  "videoReleases",
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const pendingNewCount = useMemo(
    () => bookings.filter((b) => b.status === "NEW").length,
    [bookings],
  );

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

  const tc = TAB_META[tab];

  return (
    <>
      <div className="admin-mobile-bar">
        <button
          type="button"
          className="admin-hamburger"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{tc.title}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={loadAll}>
          Refresh
        </button>
      </div>

      {sidebarOpen ? (
        <div
          className="admin-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="admin-layout">
        <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="admin-brand">
            <div className="admin-brand-mark">CT</div>
            <div>
              <div className="admin-brand-name">Clean to the Macks</div>
              <div className="admin-brand-sub">Admin</div>
            </div>
          </div>
          <nav className="admin-nav" aria-label="Primary">
            {ADMIN_TAB_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                className={`admin-nav-item${tab === t ? " active" : ""}`}
                onClick={() => {
                  setTab(t);
                  setSidebarOpen(false);
                }}
              >
                <NavIcon tab={t} />
                {TAB_META[t].title}
                {t === "bookings" && pendingNewCount > 0 ? (
                  <span className="badge">{pendingNewCount}</span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <button
              type="button"
              className="btn btn-outline btn-block btn-sm"
              onClick={() => {
                loadAll();
                setSidebarOpen(false);
              }}
            >
              Refresh data
            </button>
            <button type="button" className="btn btn-outline btn-block btn-sm" onClick={logout}>
              Log out
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <SectionHeader
            title={tc.title}
            subtitle={tc.subtitle}
            actions={
              <div className="row">
                <button type="button" className="btn btn-outline btn-sm" onClick={loadAll}>
                  Refresh
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={logout}>
                  Log out
                </button>
              </div>
            }
          />

          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : err ? (
            <div className="alert alert-danger">{err}</div>
          ) : (
            <>
              {tab === "dashboard" && (
                <DashboardTab
                  bookings={bookings}
                  clients={clients}
                  jobs={jobs}
                  testimonials={testimonials}
                  videoReleases={videoReleases}
                  setTab={setTab}
                  jumpToBookingsFiltered={jumpToBookingsFiltered}
                  onOpenBooking={setOpenBookingId}
                />
              )}
              {tab === "bookings" && (
                <BookingsTab
                  bookings={bookings}
                  cleaners={cleaners}
                  onOpenBooking={setOpenBookingId}
                  initialFilter={bookingsInitialFilter}
                  clearInitialFilter={() => setBookingsInitialFilter("ALL")}
                />
              )}
              {tab === "schedule" && (
                <ScheduleTab
                  bookings={bookings}
                  cleaners={cleaners}
                  reload={loadAll}
                  setTab={setTab}
                  onOpenBooking={setOpenBookingId}
                />
              )}
              {tab === "clients" && (
                <ClientsTab clients={clients} setClients={setClients} reload={loadAll} />
              )}
              {tab === "cleaners" && (
                <CleanersTab cleaners={cleaners} setCleaners={setCleaners} reload={loadAll} />
              )}
              {tab === "jobs" && (
                <JobsTab
                  jobs={jobs}
                  setJobs={setJobs}
                  bookings={bookings}
                  cleaners={cleaners}
                  reload={loadAll}
                />
              )}
              {tab === "testimonials" && (
                <TestimonialsTab
                  testimonials={testimonials}
                  setTestimonials={setTestimonials}
                  reload={loadAll}
                />
              )}
              {tab === "gallery" && (
                <GalleryTab gallery={gallery} setGallery={setGallery} reload={loadAll} />
              )}
              {tab === "videoReleases" && (
                <VideoReleasesTab
                  videoReleases={videoReleases}
                  bookings={bookings}
                  reload={loadAll}
                />
              )}
            </>
          )}
        </main>
      </div>

      <BookingDetailModal
        booking={openBooking}
        clients={clients}
        cleaners={cleaners}
        onClose={() => setOpenBookingId(null)}
        onSaved={loadAll}
        onDeleted={(id) => setBookings((prev) => prev.filter((r) => r.id !== id))}
      />
    </>
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
          <div className="modal-head">
            <div>
              <h2>Booking Details</h2>
              <p className="subtitle">Created: {fmt(booking.createdAt)}</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
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
            <small style={{ display: "block", marginTop: 6 }}>
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
            <div style={{ borderTop: "1px solid var(--admin-border)", paddingTop: 14 }}>
              <label>Assign Cleaner
                <select className="input" defaultValue="" onChange={(e) => { if (e.target.value) assignCleaner(booking.id, e.target.value); }}>
                  <option value="" disabled>Select a cleaner…</option>
                  {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.paymentType === "hourly" ? `$${c.hourlyRate}/hr` : "Per job"}</option>)}
                </select>
              </label>
            </div>
          )}

          <div className="modal-foot">
            <button type="button" className="btn btn-danger-outline" onClick={deleteBooking} disabled={saving}>Delete Booking</button>
            <div className="modal-foot-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => sendVideoRelease(booking)}
                disabled={sendingRelease}
              >
                {sendingRelease ? "Sending..." : "Send Video Release"}
              </button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
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

  const statusCounts = useMemo(() => {
    const m: Record<BookingStatus, number> = {
      NEW: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELED: 0,
    };
    for (const b of bookings) {
      if (b.status in m) m[b.status as BookingStatus]++;
    }
    return m;
  }, [bookings]);

  const [denseTable, setDenseTable] = useState(false);

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

  const chipOpts: { key: "ALL" | BookingStatus; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "NEW", label: "NEW" },
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELED", label: "Canceled" },
  ];

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <label style={{ margin: 0, maxWidth: 320, flex: "1 1 220px" }}>
          <span className="text-muted" style={{ fontSize: 11 }}>
            Search
          </span>
          <input
            className="input input-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search bookings…"
          />
        </label>
        <span className="toolbar-spacer" />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setDenseTable((v) => !v)}
          aria-pressed={denseTable}
        >
          {denseTable ? "Comfortable rows" : "Compact rows"}
        </button>
        <span className="meta">
          Showing <strong>{filtered.length}</strong> of <strong>{bookings.length}</strong>
        </span>
      </div>

      <div className="chip-row" style={{ marginBottom: 14 }}>
        {chipOpts.map(({ key: k, label }) => (
          <button
            key={k}
            type="button"
            className={`chip${filter === k ? " active" : ""}`}
            onClick={() => setFilter(k)}
          >
            {label}
            <span className="chip-count">
              {k === "ALL" ? bookings.length : statusCounts[k as BookingStatus]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No bookings match" hint="Try changing filters or search." />
      ) : (
        <div className="admin-table-wrap">
          <table
            className={`admin-table table-sticky-head${denseTable ? " table-compact" : ""}`}
          >
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Scheduled</th>
                <th>Client</th>
                <th>Address</th>
                <th>BR</th>
                <th>Status</th>
                <th>Cleaner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const assignedCleaner = b.cleaningJob
                  ? cleaners.find((c) => c.id === b.cleaningJob?.cleanerId)?.name
                  : null;
                return (
                  <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => onOpenBooking(b.id)}>
                    <td className="nowrap">{fmtDate(b.createdAt)}</td>
                    <td className="nowrap" style={{ fontSize: 13 }}>
                      {b.scheduledDate ? (
                        fmt(b.scheduledDate)
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td>
                      <div className="name-cell">
                        <strong>{b.name}</strong>
                        <div className="secondary">
                          <span>{b.email}</span>
                          {b.phone ? <span>{b.phone}</span> : null}
                        </div>
                      </div>
                    </td>
                    <td>{b.address}</td>
                    <td>{b.homeSize}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      {assignedCleaner || <span className="text-subtle">Unassigned</span>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row" style={{ gap: 6 }}>
                        <RowAction
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Map
                        </RowAction>
                        <RowAction
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendVideoRelease(b);
                          }}
                          disabled={sendingRelease}
                        >
                          {sendingRelease ? "Sending..." : "Send Release"}
                        </RowAction>
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
  const narrow = useNarrowLayout();
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

  const detailOpen = creating || !!selected;
  const showModal = narrow && detailOpen;
  const showPane = !narrow && detailOpen;

  const formBody = (
    <>
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

      {selected && selected.bookings.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Visit History ({selected.bookings.length})</h3>
          <div className="stack" style={{ maxHeight: 200, overflowY: "auto" }}>
            {selected.bookings.map((b) => (
              <div key={b.id} className="row" style={{ justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--admin-border)" }}>
                <span>{fmtDate(b.createdAt)}</span>
                <StatusBadge status={b.status} />
                <span>{b.serviceType || "—"}</span>
                <span>{money(b.cleaningJob?.totalPay)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && selected.satisfactionNotes.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Satisfaction Notes</h3>
          <div className="stack">
            {selected.satisfactionNotes.map((n) => (
              <div key={n.id} style={{ padding: "8px 12px", background: "var(--admin-surface-2)", borderRadius: 8, fontSize: 13 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span>{fmtDate(n.createdAt)}</span>
                  {n.rating ? <span>{`${"★".repeat(n.rating)}${"☆".repeat(5 - n.rating)}`}</span> : null}
                  {n.followUpRequired ? <span style={{ color: "var(--admin-warning)" }}>Follow-up needed</span> : null}
                </div>
                {n.notes ? <p style={{ marginTop: 4 }}>{n.notes}</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pane-detail-actions">
        {!creating ? (
          <button type="button" className="btn btn-danger btn-sm" onClick={deleteClient} disabled={saving}>
            Delete Client
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : creating ? "Create Client" : "Save Changes"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Toolbar loose>
        <label className="toolbar-field">
          <span className="text-muted" style={{ fontSize: 11 }}>Search</span>
          <input className="input input-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" />
        </label>
        <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>+ Add Client</button>
        <span className="toolbar-spacer" />
        <span className="meta">{filtered.length} clients</span>
      </Toolbar>

      <SplitPane>
        <div className="pane-list">
          <div className="pane-list-head">
            <strong style={{ fontSize: 13 }}>Directory</strong>
            <span className="text-muted" style={{ fontSize: 12 }}>{filtered.length} shown</span>
          </div>
          <div className="pane-list-body">
            {filtered.length === 0 ? (
              <div style={{ padding: 16 }}>
                <EmptyState title="No clients found" hint="Try a different search or add a client." />
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`pane-row${selectedId === c.id && !creating ? " selected" : ""}`}
                  onClick={() => openClient(c)}
                >
                  <Avatar name={c.name} small />
                  <div className="pane-row-body">
                    <div className="pane-row-name">{c.name}</div>
                    <div className="pane-row-secondary">{c.email}</div>
                  </div>
                  <div className="pane-row-meta">{money(lifetimeSpend(c))}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {showPane ? (
          <div className="pane-detail modal-on-mobile">
            <div className="pane-detail-head">
              <div>
                <h2>{creating ? "New Client" : "Client Details"}</h2>
                {!creating && selected ? <p className="subtitle">{selected.email}</p> : null}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
            </div>
            {formBody}
          </div>
        ) : !narrow ? (
          <div className="pane-detail modal-on-mobile" style={{ alignItems: "center", justifyContent: "center" }}>
            <EmptyState title="Select a client" hint="Choose someone from the list or create a new client." />
          </div>
        ) : null}
      </SplitPane>

      <Modal open={showModal} onClose={close}>
        <div className="modal-head">
          <div>
            <h2>{creating ? "New Client" : "Client Details"}</h2>
            {!creating && selected ? <p className="subtitle">{selected.email}</p> : null}
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
        </div>
        {formBody}
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
  const narrow = useNarrowLayout();
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

  const detailOpen = creating || !!selected;
  const showModal = narrow && detailOpen;
  const showPane = !narrow && detailOpen;

  const formBody = (
    <>
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

      {selected && selected.cleaningJobs.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Job History ({selected.cleaningJobs.length})</h3>
          <div className="stack" style={{ maxHeight: 200, overflowY: "auto" }}>
            {selected.cleaningJobs.map((j) => (
              <div key={j.id} className="row" style={{ justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--admin-border)" }}>
                <span>{fmtDate(j.createdAt)}</span>
                <StatusBadge status={j.status} />
                <span>{money(j.totalPay)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pane-detail-actions">
        {!creating ? (
          <button type="button" className="btn btn-danger btn-sm" onClick={deleteCleaner} disabled={saving}>Delete Cleaner</button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : creating ? "Create Cleaner" : "Save Changes"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <Toolbar loose>
        <label className="toolbar-field">
          <span className="text-muted" style={{ fontSize: 11 }}>Search</span>
          <input className="input input-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cleaners…" />
        </label>
        <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>+ Add Cleaner</button>
        <span className="toolbar-spacer" />
        <span className="meta">{filtered.length} cleaners</span>
      </Toolbar>

      <SplitPane>
        <div className="pane-list">
          <div className="pane-list-head">
            <strong style={{ fontSize: 13 }}>Team</strong>
            <span className="text-muted" style={{ fontSize: 12 }}>{filtered.length} shown</span>
          </div>
          <div className="pane-list-body">
            {filtered.length === 0 ? (
              <div style={{ padding: 16 }}>
                <EmptyState title="No cleaners" hint="Add your first team member." />
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`pane-row${selectedId === c.id && !creating ? " selected" : ""}`}
                  onClick={() => openCleaner(c)}
                >
                  <Avatar name={c.name} small />
                  <div className="pane-row-body">
                    <div className="pane-row-name">{c.name}</div>
                    <div className="pane-row-secondary">{c.paymentType === "hourly" ? `Hourly · $${c.hourlyRate}/hr` : "Per job"}</div>
                  </div>
                  <div className="pane-row-meta">{activeJobs(c)} active</div>
                </button>
              ))
            )}
          </div>
        </div>

        {showPane ? (
          <div className="pane-detail modal-on-mobile">
            <div className="pane-detail-head">
              <div>
                <h2>{creating ? "New Cleaner" : "Cleaner Details"}</h2>
                {!creating && selected ? <p className="subtitle">{selected.email}</p> : null}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
            </div>
            {formBody}
          </div>
        ) : !narrow ? (
          <div className="pane-detail modal-on-mobile" style={{ alignItems: "center", justifyContent: "center" }}>
            <EmptyState title="Select a cleaner" hint="Pick someone from the list or add a new cleaner." />
          </div>
        ) : null}
      </SplitPane>

      <Modal open={showModal} onClose={close}>
        <div className="modal-head">
          <div>
            <h2>{creating ? "New Cleaner" : "Cleaner Details"}</h2>
            {!creating && selected ? <p className="subtitle">{selected.email}</p> : null}
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
        </div>
        {formBody}
      </Modal>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   JOBS TAB
   ════════════════════════════════════════════════════════════════ */

function JobProgressStrip({
  status,
  saving,
  onGo,
}: {
  status: string;
  saving: boolean;
  onGo: (s: JobStatus) => void;
}) {
  const order: JobStatus[] = ["assigned", "in_progress", "completed"];
  if (status === "cancelled") {
    return <div className="alert alert-danger">This job is cancelled.</div>;
  }
  const idx = order.indexOf(status as JobStatus);
  return (
    <div className="status-strip" role="group" aria-label="Job progress">
      {order.map((s, i) => (
        <button
          key={s}
          type="button"
          disabled={saving}
          className={
            status === s ? "current" : idx >= 0 && i < idx ? "done" : ""
          }
          onClick={() => onGo(s)}
        >
          {s.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}

function JobsTab({ jobs, setJobs, bookings, cleaners, reload }: {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  bookings: Booking[];
  cleaners: Cleaner[];
  reload: () => Promise<void>;
}) {
  const narrow = useNarrowLayout();
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

  async function goJobStatus(next: JobStatus) {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/job/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanerId: draft.cleanerId,
          status: next,
          flatRateAmount: draft.flatRateAmount ? parseFloat(draft.flatRateAmount) : null,
          completionNotes: draft.completionNotes,
          totalPay: draft.totalPay ? parseFloat(draft.totalPay) : null,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      setDraft((d) => ({ ...d, status: next }));
      await reload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const totalPay = jobs.filter((j) => j.status === "completed").reduce((s, j) => s + (j.totalPay ?? 0), 0);
  const activeCount = jobs.filter((j) => j.status === "assigned" || j.status === "in_progress").length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;

  const detailOpen = creating || !!selected;
  const showModal = narrow && detailOpen;
  const showPane = !narrow && detailOpen;

  const createForm = (
    <>
      <div className="grid grid-2">
        <label>
          Booking *
          <select className="input" value={draft.bookingId ?? ""} onChange={(e) => setDraft({ ...draft, bookingId: e.target.value })}>
            <option value="" disabled>Select booking…</option>
            {unassignedBookings.map((b) => (
              <option key={b.id} value={b.id}>{b.name} — {b.address}</option>
            ))}
          </select>
        </label>
        <label>
          Cleaner *
          <select className="input" value={draft.cleanerId ?? ""} onChange={(e) => setDraft({ ...draft, cleanerId: e.target.value })}>
            <option value="" disabled>Select cleaner…</option>
            {cleaners.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.paymentType === "hourly" ? `$${c.hourlyRate}/hr` : "Per job"}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Flat Rate Amount (for per-job pay)
        <input
          className="input"
          type="number"
          step="0.01"
          min="0"
          value={draft.flatRateAmount ?? ""}
          onChange={(e) => setDraft({ ...draft, flatRateAmount: e.target.value })}
          placeholder="Leave empty for hourly"
        />
      </label>
      <div className="modal-foot">
        <button type="button" className="btn btn-outline" onClick={close}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Assigning…" : "Assign Job"}
        </button>
      </div>
    </>
  );

  const editForm = selected ? (
    <>
      <JobProgressStrip status={selected.status} saving={saving} onGo={goJobStatus} />
      <div className="info-block">
        <h3>Booking</h3>
        <div className="info-grid">
          <span><b>Client:</b> {selected.booking.name}</span>
          <span><b>Address:</b> {selected.booking.address}</span>
          <span><b>Size:</b> {selected.booking.homeSize} BR / {selected.booking.sqft ?? "—"} sqft</span>
          <span><b>Scheduled:</b> {fmtDate(selected.booking.scheduledDate)}</span>
        </div>
      </div>

      <label>
        Cleaner
        <select className="input" value={draft.cleanerId ?? ""} onChange={(e) => setDraft({ ...draft, cleanerId: e.target.value })}>
          {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <div className="info-block">
        <h3>Time &amp; Pay</h3>
        <div className="info-grid">
          <span><b>Clock In:</b> {fmt(selected.clockInTime)}</span>
          <span><b>Clock Out:</b> {fmt(selected.clockOutTime)}</span>
          <span><b>Hours:</b> {hoursWorked(selected) != null ? `${hoursWorked(selected)}h` : "—"}</span>
          <span><b>Pay Type:</b> {selected.cleaner.paymentType === "hourly" ? `Hourly ($${selected.cleaner.hourlyRate}/hr)` : "Per Job"}</span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          {!selected.clockInTime && selected.status === "assigned" && (
            <button type="button" className="btn btn-primary btn-sm" onClick={clockIn} disabled={saving}>Clock In</button>
          )}
          {selected.clockInTime && !selected.clockOutTime && (
            <button type="button" className="btn btn-primary btn-sm" onClick={clockOut} disabled={saving}>Clock Out</button>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <label>
          Flat Rate Amount ($)
          <input className="input" type="number" step="0.01" min="0" value={draft.flatRateAmount ?? ""} onChange={(e) => setDraft({ ...draft, flatRateAmount: e.target.value })} />
        </label>
        <label>
          Total Pay ($) (override)
          <input className="input" type="number" step="0.01" min="0" value={draft.totalPay ?? ""} onChange={(e) => setDraft({ ...draft, totalPay: e.target.value })} />
        </label>
      </div>

      <label>
        Completion Notes
        <textarea className="input" rows={2} value={draft.completionNotes ?? ""} onChange={(e) => setDraft({ ...draft, completionNotes: e.target.value })} />
      </label>

      <div className="row">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={saving || selected.status === "cancelled"}
          onClick={() => {
            if (window.confirm("Mark this job as cancelled?")) goJobStatus("cancelled");
          }}
        >
          Mark cancelled
        </button>
      </div>

      <div className="pane-detail-actions">
        <button type="button" className="btn btn-danger btn-sm" onClick={deleteJob} disabled={saving}>Delete Job</button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
      </div>
    </>
  ) : null;

  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard label="Active jobs" value={activeCount} isStatic tone="primary" />
        <KpiCard label="Completed" value={completedCount} isStatic tone="success" />
        <KpiCard label="Total paid" value={money(totalPay)} isStatic tone="info" />
        <KpiCard label="Unassigned bookings" value={unassignedBookings.length} isStatic tone="warning" />
      </div>

      <Toolbar loose>
        <label className="toolbar-field" style={{ maxWidth: 280, flex: "1 1 200px" }}>
          <span className="text-muted" style={{ fontSize: 11 }}>Search</span>
          <input className="input input-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs…" />
        </label>
        <select className="input" style={{ maxWidth: 160 }} value={filter} onChange={(e) => setFilter(e.target.value as "ALL" | JobStatus)}>
          <option value="ALL">All statuses</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>+ Assign Job</button>
        <span className="toolbar-spacer" />
        <span className="meta">{filtered.length} jobs</span>
      </Toolbar>

      <SplitPane>
        <div className="pane-list">
          <div className="pane-list-head">
            <strong style={{ fontSize: 13 }}>Assignments</strong>
            <span className="text-muted" style={{ fontSize: 12 }}>{filtered.length} shown</span>
          </div>
          <div className="pane-list-body">
            {filtered.length === 0 ? (
              <div style={{ padding: 16 }}>
                <EmptyState title="No jobs match" hint="Change filters or assign a cleaner to a booking." />
              </div>
            ) : (
              filtered.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  className={`pane-row${selectedId === j.id && !creating ? " selected" : ""}`}
                  onClick={() => openJob(j)}
                >
                  <Avatar name={j.booking.name} small />
                  <div className="pane-row-body">
                    <div className="pane-row-name">{j.booking.name}</div>
                    <div className="pane-row-secondary">{j.cleaner.name} · {fmtDate(j.booking.scheduledDate)}</div>
                  </div>
                  <StatusBadge status={j.status} />
                </button>
              ))
            )}
          </div>
        </div>

        {showPane && creating ? (
          <div className="pane-detail modal-on-mobile">
            <div className="pane-detail-head">
              <h2>New assignment</h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
            </div>
            {createForm}
          </div>
        ) : showPane && selected ? (
          <div className="pane-detail modal-on-mobile">
            <div className="pane-detail-head">
              <div>
                <h2>Job Details</h2>
                <p className="subtitle">Created {fmt(selected.createdAt)}</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
            </div>
            {editForm}
          </div>
        ) : !narrow ? (
          <div className="pane-detail modal-on-mobile" style={{ alignItems: "center", justifyContent: "center" }}>
            <EmptyState title="Select a job" hint="Pick an assignment or create one from an unassigned booking." />
          </div>
        ) : null}
      </SplitPane>

      <Modal open={showModal && creating} onClose={close}>
        <div className="modal-head">
          <h2>New assignment</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
        </div>
        {createForm}
      </Modal>

      <Modal open={showModal && !!selected && !creating} onClose={close}>
        <div className="modal-head">
          <div>
            <h2>Job Details</h2>
            <p className="subtitle">Created {selected ? fmt(selected.createdAt) : ""}</p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
        </div>
        {editForm}
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
      <Toolbar loose>
        <label className="toolbar-field">
          <span className="text-muted" style={{ fontSize: 11 }}>Search</span>
          <input
            className="input input-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search releases..."
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ Send New Release"}
        </button>
        <span className="toolbar-spacer" />
        <span className="meta">{filtered.length} releases</span>
      </Toolbar>

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
        <EmptyState title="No video releases" hint="Send a release form to collect electronic signatures." />
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
                    <td><span className="text-primary-accent">{r.clientEmail}</span></td>
                    <td>{r.propertyAddress || <span className="text-subtle">—</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(r.tokenExpiresAt)}</td>
                    <td>
                      <StatusBadge
                        status={
                          state === "PENDING"
                            ? "CONFIRMED"
                            : state === "SIGNED"
                              ? "completed"
                              : "cancelled"
                        }
                        label={state}
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row" style={{ gap: 8 }}>
                        <RowAction onClick={() => setSelectedId(r.id)}>View</RowAction>
                        <RowAction
                          variant="primary"
                          disabled={sending || state === "SIGNED"}
                          onClick={() => resendRelease(r.id)}
                        >
                          {sending ? "Sending..." : "Resend"}
                        </RowAction>
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
            <div className="modal-head">
              <div>
                <h2>Release Details</h2>
                <p className="subtitle">Created: {fmt(selected.createdAt)}</p>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedId(null)}>Close</button>
            </div>
            <div className="grid grid-2">
              <div><b>Client:</b> {selected.clientName}</div>
              <div><b>Email:</b> {selected.clientEmail}</div>
              <div><b>Address:</b> {selected.propertyAddress || "—"}</div>
              <div><b>Status:</b> {displayStatus(selected)}</div>
              <div><b>Signed at:</b> {fmt(selected.signedAt)}</div>
              <div><b>Signer name:</b> {selected.signerName || "—"}</div>
            </div>
            {selected.signatureImageDataUrl ? (
              <div style={{ marginTop: 16 }}>
                <b>Signature</b>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "#fff",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: 8,
                    maxWidth: 480,
                  }}
                >
                  <img
                    src={selected.signatureImageDataUrl}
                    alt="Captured signature"
                    style={{ maxWidth: "100%", maxHeight: 200, display: "block" }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <b>Signature (typed, legacy):</b> {selected.signatureText || "—"}
              </div>
            )}
            {displayStatus(selected) === "SIGNED" ? (
              <div style={{ marginTop: 16 }}>
                <a
                  className="btn btn-primary"
                  href={`/api/video-release/pdf?id=${encodeURIComponent(selected.id)}`}
                  download
                >
                  Download signed PDF
                </a>
              </div>
            ) : null}
            <div style={{ marginTop: 12 }}>
              <b>Signer IP:</b> {selected.signerIp || "—"}
            </div>
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

function DashboardTab({
  bookings,
  jobs,
  testimonials,
  videoReleases,
  setTab,
  jumpToBookingsFiltered,
  onOpenBooking,
}: {
  bookings: Booking[];
  clients: Client[];
  jobs: Job[];
  testimonials: Testimonial[];
  videoReleases: VideoRelease[];
  setTab: (t: Tab) => void;
  jumpToBookingsFiltered: (filter: "ALL" | BookingStatus) => void;
  onOpenBooking: (id: string) => void;
}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const bookingsThisMonth = bookings.filter((b) => new Date(b.createdAt) >= monthStart).length;
  const newBookings = bookings.filter((b) => b.status === "NEW").length;
  const revenueThisMonth = jobs
    .filter((j) => j.status === "completed" && new Date(j.createdAt) >= monthStart)
    .reduce((sum, j) => sum + (j.totalPay ?? 0), 0);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todayAppointments = useMemo(() => {
    return bookings
      .filter((b) => {
        if (!b.scheduledDate || b.status === "CANCELED") return false;
        const d = new Date(b.scheduledDate);
        return d >= todayStart && d < todayEnd;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime(),
      );
  }, [bookings, todayStart, todayEnd]);

  const nextSevenDays = useMemo(() => {
    const out: { date: Date; items: Booking[] }[] = [];
    for (let i = 1; i <= 7; i++) {
      const dayStart = addDays(todayStart, i);
      const dayEnd = addDays(todayStart, i + 1);
      const items = bookings
        .filter((b) => {
          if (!b.scheduledDate || b.status === "CANCELED") return false;
          const d = new Date(b.scheduledDate);
          return d >= dayStart && d < dayEnd;
        })
        .sort(
          (a, b) =>
            new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime(),
        );
      out.push({ date: dayStart, items });
    }
    return out;
  }, [bookings, todayStart]);

  const needsAttention = useMemo(() => {
    const noDateNew = bookings.filter((b) => b.status === "NEW" && !b.scheduledDate);
    const msDay = 24 * 60 * 60 * 1000;
    const soon = bookings.filter((b) => {
      if (b.status !== "CONFIRMED" || !b.scheduledDate) return false;
      const t = new Date(b.scheduledDate).getTime();
      return t > now.getTime() && t <= now.getTime() + msDay;
    });
    return { noDateNew, soon };
  }, [bookings, now]);

  type ActivityRow =
    | { kind: "booking"; at: string; booking: Booking }
    | { kind: "testimonial"; at: string; t: Testimonial }
    | { kind: "release"; at: string; r: VideoRelease };

  const activityFeed = useMemo(() => {
    const rows: ActivityRow[] = [];
    for (const b of bookings) rows.push({ kind: "booking", at: b.createdAt, booking: b });
    for (const t of testimonials) rows.push({ kind: "testimonial", at: t.createdAt, t });
    for (const r of videoReleases) rows.push({ kind: "release", at: r.createdAt, r });
    rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return rows.slice(0, 12);
  }, [bookings, testimonials, videoReleases]);

  function releaseDisplayStatus(r: VideoRelease) {
    if (r.status === "SIGNED") return "SIGNED";
    return new Date(r.tokenExpiresAt).getTime() < Date.now() ? "EXPIRED" : "PENDING";
  }

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab("bookings")}>
          View Bookings
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setTab("schedule")}>
          Schedule
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setTab("clients")}>
          Clients
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setTab("jobs")}>
          Jobs
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <KpiCard
          label="Today"
          value={todayAppointments.length}
          foot="Appointments scheduled today"
          tone="primary"
          onClick={() => setTab("schedule")}
        />
        <KpiCard
          label="Pending requests"
          value={newBookings}
          foot="New bookings to review"
          tone="warning"
          onClick={() => jumpToBookingsFiltered("NEW")}
        />
        <KpiCard
          label="This month"
          value={bookingsThisMonth}
          foot="Bookings submitted"
          tone="info"
          onClick={() => setTab("bookings")}
        />
        <KpiCard
          label="Revenue (month)"
          value={`$${revenueThisMonth.toFixed(2)}`}
          foot="From completed jobs"
          tone="success"
          onClick={() => setTab("jobs")}
        />
      </div>

      <div className="dashboard-grid">
        <div className="stack">
          <div className="card card-flush">
            <div className="card-row">
              <h3 style={{ margin: 0 }}>Today</h3>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="card-row">
                <p className="text-muted" style={{ margin: 0 }}>
                  Nothing on the calendar today.
                </p>
              </div>
            ) : (
              todayAppointments.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`agenda-row${b.status === "CANCELED" ? " canceled" : ""}`}
                  onClick={() => onOpenBooking(b.id)}
                >
                  <span className="agenda-time">
                    {new Date(b.scheduledDate!).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="agenda-row-body">
                    <span className="agenda-row-name">{b.name}</span>
                    <span className="agenda-row-sub">{b.address}</span>
                  </div>
                  <StatusBadge status={b.status} />
                </button>
              ))
            )}
          </div>

          <div className="card card-flush">
            <div className="card-row">
              <h3 style={{ margin: 0 }}>Next 7 days</h3>
            </div>
            {nextSevenDays.every((d) => d.items.length === 0) ? (
              <div className="card-row">
                <p className="text-muted" style={{ margin: 0 }}>
                  No upcoming appointments in the next week.
                </p>
              </div>
            ) : (
              nextSevenDays.flatMap((day) =>
                day.items.length === 0
                  ? []
                  : [
                      <div key={day.date.toISOString()} className="agenda-day">
                        <div>
                          <div className="agenda-day-label">
                            {day.date.toLocaleDateString([], { weekday: "short" })}
                          </div>
                          <div className="agenda-day-date">{day.date.getDate()}</div>
                        </div>
                        <div className="agenda-day-list">
                          {day.items.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              className={`agenda-row${b.status === "CANCELED" ? " canceled" : ""}`}
                              onClick={() => onOpenBooking(b.id)}
                            >
                              <span className="agenda-time">
                                {new Date(b.scheduledDate!).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                              <div className="agenda-row-body">
                                <span className="agenda-row-name">{b.name}</span>
                                <span className="agenda-row-sub">{b.serviceType || b.address}</span>
                              </div>
                              <StatusBadge status={b.status} />
                            </button>
                          ))}
                        </div>
                      </div>,
                    ],
              )
            )}
          </div>
        </div>

        <div className="card">
          <h3>Needs attention</h3>
          {needsAttention.noDateNew.length === 0 && needsAttention.soon.length === 0 ? (
            <p className="text-muted" style={{ margin: 0 }}>
              You&apos;re all caught up.
            </p>
          ) : (
            <div className="stack">
              {needsAttention.noDateNew.length > 0 && (
                <div className="alert alert-warning">
                  <span>
                    <strong>{needsAttention.noDateNew.length}</strong> new request
                    {needsAttention.noDateNew.length === 1 ? "" : "s"} need a scheduled date.
                  </span>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setTab("bookings")}>
                    Review
                  </button>
                </div>
              )}
              {needsAttention.soon.length > 0 && (
                <div className="stack">
                  <small className="text-muted">Starting within 24 hours</small>
                  {needsAttention.soon.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="agenda-row"
                      onClick={() => onOpenBooking(b.id)}
                    >
                      <span className="agenda-time">
                        {new Date(b.scheduledDate!).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="agenda-row-body">
                        <span className="agenda-row-name">{b.name}</span>
                        <span className="agenda-row-sub">{b.address}</span>
                      </div>
                      <StatusBadge status={b.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Recent activity</h3>
        {activityFeed.length === 0 ? (
          <p className="text-muted" style={{ margin: 0 }}>
            No activity yet.
          </p>
        ) : (
          <div className="stack">
            {activityFeed.map((row) => {
              if (row.kind === "booking") {
                const b = row.booking;
                return (
                  <button
                    key={row.kind + b.id}
                    type="button"
                    className="agenda-row"
                    onClick={() => onOpenBooking(b.id)}
                  >
                    <span className="agenda-time text-muted" style={{ fontWeight: 500 }}>
                      Booking
                    </span>
                    <div className="agenda-row-body">
                      <span className="agenda-row-name">{b.name}</span>
                      <span className="agenda-row-sub">{fmtDate(b.createdAt)} · {b.address}</span>
                    </div>
                    <StatusBadge status={b.status} />
                  </button>
                );
              }
              if (row.kind === "testimonial") {
                const t = row.t;
                return (
                  <button
                    key={row.kind + t.id}
                    type="button"
                    className="agenda-row"
                    onClick={() => setTab("testimonials")}
                  >
                    <span className="agenda-time text-muted" style={{ fontWeight: 500 }}>
                      Review
                    </span>
                    <div className="agenda-row-body">
                      <span className="agenda-row-name">{t.name}</span>
                      <span className="agenda-row-sub">{fmtDate(t.createdAt)}</span>
                    </div>
                    <StatusBadge
                      status={t.visible ? "CONFIRMED" : "NEW"}
                      label={t.visible ? "Visible" : "Hidden"}
                    />
                  </button>
                );
              }
              const r = row.r;
              const st = releaseDisplayStatus(r);
              return (
                <button
                  key={row.kind + r.id}
                  type="button"
                  className="agenda-row"
                  onClick={() => setTab("videoReleases")}
                >
                  <span className="agenda-time text-muted" style={{ fontWeight: 500 }}>
                    Release
                  </span>
                  <div className="agenda-row-body">
                    <span className="agenda-row-name">{r.clientName}</span>
                    <span className="agenda-row-sub">{fmtDate(r.createdAt)}</span>
                  </div>
                  <StatusBadge status={st} />
                </button>
              );
            })}
          </div>
        )}
      </div>
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
      <Toolbar loose>
        <label className="toolbar-field">
          <span className="text-muted" style={{ fontSize: 11 }}>Search</span>
          <input className="input input-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search testimonials…" />
        </label>
        <button type="button" className="btn btn-primary" onClick={startCreate}>+ Add Testimonial</button>
        {testimonials.length === 0 && (
          <button type="button" className="btn btn-secondary" onClick={seedTestimonials}>Seed Default Testimonials</button>
        )}
        <span className="toolbar-spacer" />
        <span className="meta">{visibleCount} visible / {testimonials.length} total</span>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState title="No testimonials" hint="Add reviews or seed defaults for the website." />
      ) : (
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
                  <td className="text-muted" style={{ maxWidth: 400 }}>
                    {t.quote.length > 80 ? t.quote.slice(0, 80) + "…" : t.quote}
                  </td>
                  <td>{t.rating ? "★".repeat(t.rating) + "☆".repeat(5 - t.rating) : <span className="text-subtle">—</span>}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`toggle-pill${t.visible ? " on" : " off"}`}
                      onClick={() => toggleVisibility(t)}
                    >
                      {t.visible ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <RowAction onClick={() => openTestimonial(t)}>Edit</RowAction>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected || creating} onClose={close}>
        <div className="modal-head">
          <h2>{creating ? "New Testimonial" : "Edit Testimonial"}</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
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
          <label className="inline">
            <input type="checkbox" checked={draft.visible as boolean} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
              style={{ width: 20, height: 20, accentColor: "var(--admin-primary)" }} />
            <span>Visible on website</span>
          </label>
        </div>

        <div className="modal-foot">
          {!creating && <button type="button" className="btn btn-danger-outline" onClick={deleteTestimonial} disabled={saving}>Delete Testimonial</button>}
          <div className="modal-foot-actions">
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : creating ? "Add Testimonial" : "Save Changes"}</button>
          </div>
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
      <Toolbar loose>
        <label className="toolbar-field">
          <span className="text-muted" style={{ fontSize: 11 }}>Search</span>
          <input className="input input-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gallery…" />
        </label>
        <button type="button" className="btn btn-primary" onClick={startCreate}>+ Add Before/After</button>
        <span className="toolbar-spacer" />
        <span className="meta">{visibleCount} visible / {gallery.length} total</span>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState title="No gallery items" hint="Add before and after photo pairs for the website." />
      ) : (
        <div className="gallery-grid">
          {filtered.map((g) => (
            <div
              key={g.id}
              role="button"
              tabIndex={0}
              className={`gallery-card${g.visible ? "" : " hidden-item"}`}
              onClick={() => openItem(g)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openItem(g);
                }
              }}
            >
              <div className="img-pair">
                <div>
                  <span className="img-tag">Before</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.beforeImageUrl} alt="Before" />
                </div>
                <div>
                  <span className="img-tag img-tag-after">After</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.afterImageUrl} alt="After" />
                </div>
              </div>
              <div className="gallery-body">
                <div>
                  <div className="gallery-title">{g.title}</div>
                  {g.description ? <p className="gallery-desc">{g.description}</p> : null}
                </div>
                <button
                  type="button"
                  className={`toggle-pill${g.visible ? " on" : " off"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(g);
                  }}
                >
                  {g.visible ? "Visible" : "Hidden"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected || creating} onClose={close}>
        <div className="modal-head">
          <h2>{creating ? "New Gallery Item" : "Edit Gallery Item"}</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={close}>Close</button>
        </div>

        <label>Title *<input className="input" value={(draft.title as string) ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Living Room Reset" /></label>
        <label>Description<textarea className="input" rows={2} value={(draft.description as string) ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Optional description" /></label>

        <div className="grid grid-2">
          <label>Before Image URL *<input className="input" value={(draft.beforeImageUrl as string) ?? ""} onChange={(e) => setDraft({ ...draft, beforeImageUrl: e.target.value })} placeholder="https://..." /></label>
          <label>After Image URL *<input className="input" value={(draft.afterImageUrl as string) ?? ""} onChange={(e) => setDraft({ ...draft, afterImageUrl: e.target.value })} placeholder="https://..." /></label>
        </div>

        {((draft.beforeImageUrl as string) || (draft.afterImageUrl as string)) && (
          <div className="img-pair" style={{ borderRadius: "var(--admin-radius)" }}>
            {(draft.beforeImageUrl as string) && (
              <div>
                <span className="img-tag">Before</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.beforeImageUrl as string} alt="Before preview" />
              </div>
            )}
            {(draft.afterImageUrl as string) && (
              <div>
                <span className="img-tag img-tag-after">After</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.afterImageUrl as string} alt="After preview" />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-2">
          <label>Sort Order<input className="input" type="number" min="0" value={(draft.sortOrder as string) ?? "0"} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
          <label className="inline">
            <input type="checkbox" checked={draft.visible as boolean} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} style={{ width: 20, height: 20, accentColor: "var(--admin-primary)" }} />
            <span>Visible on website</span>
          </label>
        </div>

        <div className="modal-foot">
          {!creating && <button type="button" className="btn btn-danger-outline" onClick={deleteItem} disabled={saving}>Delete Item</button>}
          <div className="modal-foot-actions">
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : creating ? "Add Item" : "Save Changes"}</button>
          </div>
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
  const [view, setView] = useState<"calendar" | "week" | "list" | "availability" | "blocked">("calendar");
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [slotPreviewDate, setSlotPreviewDate] = useState("");
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

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const previewSlots = useMemo(() => {
    if (!slotPreviewDate.trim()) return [];
    const d = new Date(`${slotPreviewDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return [];
    const dow = d.getDay();
    const rule =
      config.find((r) => r.dayOfWeek === dow) ??
      DEFAULT_AVAILABILITY.find((r) => r.dayOfWeek === dow) ?? {
        dayOfWeek: dow,
        startTime: "09:00",
        endTime: "17:00",
        slotMinutes: 60,
        enabled: false,
      };
    return generateSlotsForDate(d, rule).map((s) => formatSlotLabel(s));
  }, [slotPreviewDate, config]);

  function shiftMonth(delta: number) {
    setMonthCursor(new Date(monthStart.getFullYear(), monthStart.getMonth() + delta, 1));
  }

  function shiftWeek(delta: number) {
    setWeekStart((ws) => addDays(ws, delta * 7));
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
        <div className="alert alert-warning" style={{ marginBottom: 12 }}>
          <span>
            <strong>{pendingNoDate}</strong> pending request{pendingNoDate === 1 ? "" : "s"} need{pendingNoDate === 1 ? "s" : ""} a date — these don&apos;t appear on the calendar yet.
          </span>
          <button type="button" onClick={() => setTab("bookings")} className="btn btn-outline btn-sm">
            Open Bookings
          </button>
        </div>
      )}

      <div className="segmented" style={{ marginBottom: 16 }}>
        {(["calendar", "week", "list", "availability", "blocked"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={view === v ? "active" : ""}
            onClick={() => setView(v)}
          >
            {v === "calendar"
              ? "Calendar"
              : v === "week"
                ? "Week"
                : v === "list"
                  ? "List"
                  : v === "availability"
                    ? "Availability"
                    : "Blocked"}
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

          <div className="cal-grid">
            {DAY_LABELS.map((d) => (
              <div key={d} className="cal-head">{d}</div>
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
              const cellClass = [
                "cal-cell",
                clickable ? "clickable" : "",
                !cell.inMonth ? "out-of-month" : "",
                isToday ? "today" : "",
                dowClosed ? "closed" : "",
                hasBlock ? "has-block" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const blockTooltip = hasBlock
                ? dayBlocks.map((blk) => `Blocked: ${blk.reason || "(no reason given)"}`).join("\n")
                : undefined;
              const cellChildren = (
                <>
                  <div className="cal-cell-head">
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{cell.date.getDate()}</span>
                    {dowClosed ? <span className="cal-cell-tag">Closed</span> : null}
                  </div>
                  <div style={{ display: "grid", gap: 3 }}>
                    {dayBookings.slice(0, 3).map((b) => {
                      const isCanceled = b.status === "CANCELED";
                      const t = new Date(b.scheduledDate!).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      });
                      return (
                        <span
                          key={b.id}
                          title={`${b.name} - ${b.address}${isCanceled ? " (canceled)" : ""}`}
                          className={`cal-chip pill ${pillClassForStatus(b.status)}${isCanceled ? " canceled" : ""}`}
                        >
                          {t} {b.name}
                        </span>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <div className="cal-more">+{dayBookings.length - 3} more</div>
                    )}
                  </div>
                </>
              );
              if (!clickable) {
                return (
                  <div key={idx} className={cellClass} title={blockTooltip}>
                    {cellChildren}
                  </div>
                );
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOpenDayKey(key)}
                  className={`${cellClass} schedule-day-cell`}
                  title={blockTooltip}
                  aria-label={`Open ${cell.date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })} (${dayBookings.length} booking${dayBookings.length === 1 ? "" : "s"})`}
                >
                  {cellChildren}
                </button>
              );
            })}
          </div>

          <div className="cal-legend">
            <span>
              <span
                className="cal-legend-swatch"
                style={{
                  background:
                    "repeating-linear-gradient(135deg, rgba(15,23,42,0.06) 0 4px, rgba(15,23,42,0.12) 4px 8px)",
                }}
              />
              Closed day
            </span>
            <span>
              <span
                className="cal-legend-swatch"
                style={{ borderLeft: "3px solid var(--admin-warning)", border: "1px solid var(--admin-border)", borderLeftWidth: 3 }}
              />
              Has blocked time
            </span>
            <span>
              <span className="cal-more" style={{ textDecoration: "line-through", opacity: 0.55 }}>
                Sample
              </span>
              {" "}
              <span className="text-muted">= canceled</span>
            </span>
          </div>
        </>
      )}

      {view === "week" && (
        <>
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => shiftWeek(-1)}>
              ← Prev week
            </button>
            <strong style={{ fontSize: 15 }}>
              Week of{" "}
              {weekStart.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </strong>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => shiftWeek(1)}>
              Next week →
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
            >
              This week
            </button>
          </div>
          <div className="card card-flush">
            {weekDays.map((dayDate) => {
              const key = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
              const dayBookings = (bookingsByDay.get(key) ?? [])
                .slice()
                .sort(
                  (a, b) =>
                    new Date(a.scheduledDate!).getTime() -
                    new Date(b.scheduledDate!).getTime(),
                );
              const isToday = sameCalendarDay(dayDate, new Date());
              return (
                <div
                  key={key}
                  className={`agenda-day${isToday ? " today" : ""}`}
                  style={{ gridTemplateColumns: "minmax(88px, 1fr) 4fr" }}
                >
                  <div>
                    <div className="agenda-day-label">
                      {dayDate.toLocaleDateString([], { weekday: "short" })}
                    </div>
                    <div className="agenda-day-date">{dayDate.getDate()}</div>
                  </div>
                  <div className="agenda-day-list">
                    {dayBookings.length === 0 ? (
                      <span className="agenda-empty">No appointments</span>
                    ) : (
                      dayBookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className={`agenda-row${b.status === "CANCELED" ? " canceled" : ""}`}
                          onClick={() => onOpenBooking(b.id)}
                        >
                          <span className="agenda-time">
                            {new Date(b.scheduledDate!).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          <div className="agenda-row-body">
                            <span className="agenda-row-name">{b.name}</span>
                            <span className="agenda-row-sub">{b.serviceType || b.address}</span>
                          </div>
                          <StatusBadge status={b.status} />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === "list" && (
        <>
          {scheduledList.length === 0 ? (
            <EmptyState title="No scheduled appointments" hint="Approve bookings with dates or add a date on the booking." />
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
                        <td>{b.serviceType || <span className="text-subtle">—</span>}</td>
                        <td>{b.address}</td>
                        <td><StatusBadge status={b.status} /></td>
                        <td>{cleanerName}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="row" style={{ gap: 6 }}>
                            {b.status !== "CONFIRMED" && b.status !== "CANCELED" && (
                              <RowAction variant="primary" onClick={() => setStatus(b.id, "CONFIRMED")}>
                                Approve
                              </RowAction>
                            )}
                            {b.status !== "CANCELED" && (
                              <RowAction
                                variant="danger"
                                onClick={() => {
                                  if (window.confirm("Cancel this appointment? The customer will be emailed.")) {
                                    setStatus(b.id, "CANCELED");
                                  }
                                }}
                              >
                                Cancel
                              </RowAction>
                            )}
                            {b.status !== "COMPLETED" && b.status !== "CANCELED" && (
                              <RowAction
                                variant="success"
                                onClick={() => {
                                  if (window.confirm("Mark this appointment as complete?")) {
                                    setStatus(b.id, "COMPLETED");
                                  }
                                }}
                              >
                                Complete
                              </RowAction>
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
                              className="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => updateRule(dow, { enabled: e.target.checked })}
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
              <div className="stack">
                <button className="btn btn-primary" onClick={saveConfig} disabled={savingCfg}>
                  {savingCfg ? "Saving..." : "Save Availability"}
                </button>
                <div className="card" style={{ padding: 14 }}>
                  <label style={{ marginBottom: 8 }}>
                    Preview slots for a date (uses saved rules above after you save)
                    <input
                      type="date"
                      className="input"
                      value={slotPreviewDate}
                      onChange={(e) => setSlotPreviewDate(e.target.value)}
                    />
                  </label>
                  {slotPreviewDate ? (
                    previewSlots.length === 0 ? (
                      <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
                        No slots — day may be disabled or hours invalid.
                      </p>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                        {previewSlots.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )
                  ) : (
                    <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
                      Pick a date to see generated slot labels (local preview).
                    </p>
                  )}
                </div>
              </div>
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
            <EmptyState title="No blocked ranges" hint="Add vacations or unavailable windows above." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Start</th><th>End</th><th>Reason</th><th></th></tr>
                </thead>
                <tbody>
                  {blocked.map((b) => (
                    <tr key={b.id}>
                      <td className="nowrap">{fmt(b.startAt)}</td>
                      <td className="nowrap">{fmt(b.endAt)}</td>
                      <td>{b.reason || <span className="text-subtle">—</span>}</td>
                      <td>
                        <RowAction variant="danger" onClick={() => removeBlock(b.id)}>
                          Remove
                        </RowAction>
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
              <div className="modal-head">
                <div>
                  <h2>{titleDate}</h2>
                  <p className="subtitle">
                    {dayBookings.length} booking{dayBookings.length === 1 ? "" : "s"} scheduled
                  </p>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpenDayKey(null)}>
                  Close
                </button>
              </div>

              {dayBookings.length === 0 ? (
                <p className="text-muted">No bookings on this day.</p>
              ) : (
                <div className="stack">
                  {dayBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="agenda-row"
                      onClick={() => {
                        onOpenBooking(b.id);
                        setOpenDayKey(null);
                      }}
                    >
                      <span className="agenda-time">
                        {new Date(b.scheduledDate!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="agenda-row-body">
                        <span className="agenda-row-name">{b.name}</span>
                        <span className="agenda-row-sub">
                          {b.serviceType ? `${b.serviceType} · ` : ""}{b.address}
                        </span>
                      </span>
                      <StatusBadge status={b.status} />
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
