/**
 * Production databases occasionally lag behind Prisma schema until
 * `prisma migrate deploy` runs. These helpers avoid querying columns/tables
 * that may not exist yet so read APIs stay up.
 */
import { prisma } from "@/lib/db";

export async function safeAvailabilityConfigRows() {
  try {
    return await prisma.availabilityConfig.findMany();
  } catch (err) {
    console.warn(
      "[db] AvailabilityConfig unavailable — using defaults. Run `npx prisma migrate deploy`.",
      err,
    );
    return [];
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
    console.warn(
      "[db] BlockedSlot unavailable — treating as no blocks. Run `npx prisma migrate deploy`.",
      err,
    );
    return [];
  }
}

/** Does not select slotMinutes so Booking rows work before that migration exists. */
export async function safeBookingsWithScheduledRange(from: Date, toInclusive: Date) {
  return prisma.booking.findMany({
    where: {
      scheduledDate: { gte: from, lte: toInclusive },
      status: { in: ["NEW", "CONFIRMED", "COMPLETED"] },
    },
    select: { scheduledDate: true },
  });
}

export async function safeBookingsForDay(dayStart: Date, dayEnd: Date) {
  return prisma.booking.findMany({
    where: {
      scheduledDate: { gte: dayStart, lt: dayEnd },
      status: { in: ["NEW", "CONFIRMED", "COMPLETED"] },
    },
    select: { scheduledDate: true },
  });
}

export async function safeAllBlockedSlots() {
  try {
    return await prisma.blockedSlot.findMany({ orderBy: { startAt: "asc" } });
  } catch (err) {
    console.warn(
      "[db] BlockedSlot list unavailable. Run `npx prisma migrate deploy`.",
      err,
    );
    return [];
  }
}

export async function safeAvailabilityConfigForDay(dayOfWeek: number) {
  try {
    return await prisma.availabilityConfig.findMany({ where: { dayOfWeek } });
  } catch (err) {
    console.warn("[db] AvailabilityConfig read failed — using defaults.", err);
    return [];
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
    console.warn("[db] BlockedSlot read failed for day — no blocks.", err);
    return [];
  }
}
