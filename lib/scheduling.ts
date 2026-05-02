/**
 * Scheduling helpers for availability + slot generation.
 *
 * Slot times are stored in UTC in the database, but availability config
 * uses local clock time strings (HH:mm) since that's how a business
 * owner thinks of working hours.
 */

export type AvailabilityRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  enabled: boolean;
};

export type SlotRange = {
  startAt: Date;
  endAt: Date;
};

export const DEFAULT_AVAILABILITY: AvailabilityRule[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: false },
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", slotMinutes: 60, enabled: false },
];

function parseTimeOfDay(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/** Build a Date for a given calendar day in local time at HH:mm. */
function buildLocalDateTime(year: number, monthIdx: number, day: number, hours: number, minutes: number): Date {
  return new Date(year, monthIdx, day, hours, minutes, 0, 0);
}

/**
 * Generate raw slot ranges for a single day based on a rule.
 * Returns an empty array if the rule is disabled or invalid.
 */
export function generateSlotsForDate(date: Date, rule: AvailabilityRule): SlotRange[] {
  if (!rule.enabled) return [];

  const start = parseTimeOfDay(rule.startTime);
  const end = parseTimeOfDay(rule.endTime);
  if (!start || !end) return [];

  const slots: SlotRange[] = [];
  const slotMs = rule.slotMinutes * 60 * 1000;

  let cursor = buildLocalDateTime(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    start.hours,
    start.minutes,
  );
  const dayEnd = buildLocalDateTime(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    end.hours,
    end.minutes,
  );

  while (cursor.getTime() + slotMs <= dayEnd.getTime()) {
    const slotEnd = new Date(cursor.getTime() + slotMs);
    slots.push({ startAt: new Date(cursor), endAt: slotEnd });
    cursor = slotEnd;
  }

  return slots;
}

/** Returns true if the candidate range overlaps any existing busy range. */
export function overlapsAny(
  candidate: SlotRange,
  busy: SlotRange[],
): boolean {
  return busy.some((b) => candidate.startAt < b.endAt && b.startAt < candidate.endAt);
}

/** Format a Date range as HH:mm-HH:mm for display. */
export function formatSlotLabel(slot: SlotRange): string {
  const fmt = (d: Date) => d.toTimeString().slice(0, 5);
  return `${fmt(slot.startAt)} - ${fmt(slot.endAt)}`;
}

/** Iterate dates inclusive between from and to. */
export function eachDateInclusive(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (cursor.getTime() <= end.getTime()) {
    out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
