/**
 * Production databases occasionally lag behind Prisma schema until
 * `prisma migrate deploy` runs. These helpers tolerate two specific
 * Prisma errors only:
 *   - P2021: table does not exist
 *   - P2022: column does not exist
 * Anything else is rethrown so real bugs aren't silently hidden.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function isMissingSchemaError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P2021" || err.code === "P2022")
  );
}

export type BusyBooking = {
  scheduledDate: Date | null;
  slotMinutes: number | null;
};

/** Statuses that occupy the calendar (pending NEW requests do not). */
export const CALENDAR_BUSY_STATUSES = ["CONFIRMED", "COMPLETED"] as const;

async function findBookingsWithSlot(where: Prisma.BookingWhereInput): Promise<BusyBooking[]> {
  try {
    const rows = await prisma.booking.findMany({
      where,
      select: { scheduledDate: true, slotMinutes: true },
    });
    return rows;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2022"
    ) {
      /* slotMinutes column not yet migrated — re-query without it */
      const rows = await prisma.booking.findMany({
        where,
        select: { scheduledDate: true },
      });
      return rows.map((r) => ({ scheduledDate: r.scheduledDate, slotMinutes: null }));
    }
    throw err;
  }
}

export async function safeAvailabilityConfigRows() {
  try {
    return await prisma.availabilityConfig.findMany();
  } catch (err) {
    if (isMissingSchemaError(err)) {
      console.warn(
        "[db] AvailabilityConfig unavailable — using defaults. Run `npx prisma migrate deploy`.",
      );
      return [];
    }
    throw err;
  }
}

/** Blocks overlapping [from, rangeEnd] (matches public availability route bounds). */
export async function safeBlockedSlotsForRange(from: Date, rangeEnd: Date) {
  try {
    return await prisma.blockedSlot.findMany({
      where: {
        startAt: { lte: rangeEnd },
        endAt: { gte: from },
      },
      select: { startAt: true, endAt: true },
    });
  } catch (err) {
    if (isMissingSchemaError(err)) {
      console.warn(
        "[db] BlockedSlot unavailable — treating as no blocks. Run `npx prisma migrate deploy`.",
      );
      return [];
    }
    throw err;
  }
}

/** Returns scheduledDate + slotMinutes (slotMinutes null if column not migrated yet). */
export async function safeBookingsWithScheduledRange(from: Date, toInclusive: Date) {
  return findBookingsWithSlot({
    scheduledDate: { gte: from, lte: toInclusive },
    status: { in: [...CALENDAR_BUSY_STATUSES] },
  });
}

export async function safeBookingsForDay(
  dayStart: Date,
  dayEnd: Date,
  excludeBookingId?: string,
) {
  const where: Prisma.BookingWhereInput = {
    scheduledDate: { gte: dayStart, lt: dayEnd },
    status: { in: [...CALENDAR_BUSY_STATUSES] },
  };
  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }
  return findBookingsWithSlot(where);
}

export async function safeAllBlockedSlots() {
  try {
    return await prisma.blockedSlot.findMany({ orderBy: { startAt: "asc" } });
  } catch (err) {
    if (isMissingSchemaError(err)) {
      console.warn("[db] BlockedSlot list unavailable. Run `npx prisma migrate deploy`.");
      return [];
    }
    throw err;
  }
}

export async function safeAvailabilityConfigForDay(dayOfWeek: number) {
  try {
    return await prisma.availabilityConfig.findMany({ where: { dayOfWeek } });
  } catch (err) {
    if (isMissingSchemaError(err)) {
      console.warn("[db] AvailabilityConfig read failed — using defaults.");
      return [];
    }
    throw err;
  }
}

export async function safeBlockedSlotsForDay(dayStart: Date, dayEnd: Date) {
  try {
    return await prisma.blockedSlot.findMany({
      where: {
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { startAt: true, endAt: true },
    });
  } catch (err) {
    if (isMissingSchemaError(err)) {
      console.warn("[db] BlockedSlot read failed for day — no blocks.");
      return [];
    }
    throw err;
  }
}
