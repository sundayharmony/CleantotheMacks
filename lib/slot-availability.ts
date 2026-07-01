import {
  safeAvailabilityConfigForDay,
  safeBlockedSlotsForDay,
  safeBookingsForDay,
  type BusyBooking,
} from "@/lib/prisma-scheduling-compat";
import {
  AvailabilityRule,
  DEFAULT_AVAILABILITY,
  generateSlotsForDate,
  overlapsAny,
  SlotRange,
} from "@/lib/scheduling";

function bookingsToBusyRanges(bookings: BusyBooking[]): SlotRange[] {
  const busy: SlotRange[] = [];
  for (const b of bookings) {
    if (!b.scheduledDate) continue;
    const minutes = b.slotMinutes ?? 60;
    busy.push({
      startAt: b.scheduledDate,
      endAt: new Date(b.scheduledDate.getTime() + minutes * 60 * 1000),
    });
  }
  return busy;
}

export type IsSlotFreeOptions = {
  excludeBookingId?: string;
};

/**
 * Returns true if the slot is within business hours and does not overlap
 * a confirmed/completed booking or a blocked range.
 * Pending (NEW) requests do not block slots.
 */
export async function isSlotFree(
  scheduledDate: Date,
  slotMinutes: number,
  options: IsSlotFreeOptions = {},
): Promise<boolean> {
  const dayStart = new Date(
    scheduledDate.getFullYear(),
    scheduledDate.getMonth(),
    scheduledDate.getDate(),
  );
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [configRows, bookings, blocks] = await Promise.all([
    safeAvailabilityConfigForDay(scheduledDate.getDay()),
    safeBookingsForDay(dayStart, dayEnd, options.excludeBookingId),
    safeBlockedSlotsForDay(dayStart, dayEnd),
  ]);

  const rule: AvailabilityRule =
    configRows[0] ?? DEFAULT_AVAILABILITY[scheduledDate.getDay()];

  if (!rule.enabled) return false;

  const slots = generateSlotsForDate(scheduledDate, rule);
  const matched = slots.find(
    (s) =>
      s.startAt.getTime() === scheduledDate.getTime() &&
      s.endAt.getTime() - s.startAt.getTime() === slotMinutes * 60 * 1000,
  );
  if (!matched) return false;

  const busy = bookingsToBusyRanges(bookings);
  for (const block of blocks) {
    busy.push({ startAt: block.startAt, endAt: block.endAt });
  }

  return !overlapsAny(matched, busy);
}
