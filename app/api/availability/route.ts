import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  AvailabilityRule,
  DEFAULT_AVAILABILITY,
  eachDateInclusive,
  generateSlotsForDate,
  overlapsAny,
  SlotRange,
} from "@/lib/scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIdx, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const from = parseDateParam(fromParam) ?? startOfToday;
  const defaultTo = new Date(startOfToday);
  defaultTo.setDate(defaultTo.getDate() + 30);
  const to = parseDateParam(toParam) ?? defaultTo;

  if (to.getTime() < from.getTime()) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  try {
    const [configRows, bookings, blocks] = await Promise.all([
      prisma.availabilityConfig.findMany(),
      prisma.booking.findMany({
        where: {
          scheduledDate: { gte: from, lte: new Date(to.getTime() + 24 * 60 * 60 * 1000) },
          status: { in: ["NEW", "CONFIRMED", "COMPLETED"] },
        },
        select: { scheduledDate: true, slotMinutes: true },
      }),
      prisma.blockedSlot.findMany({
        where: {
          startAt: { lte: new Date(to.getTime() + 24 * 60 * 60 * 1000) },
          endAt: { gte: from },
        },
        select: { startAt: true, endAt: true },
      }),
    ]);

    const ruleByDay = new Map<number, AvailabilityRule>();
    for (const r of DEFAULT_AVAILABILITY) ruleByDay.set(r.dayOfWeek, r);
    for (const r of configRows) {
      ruleByDay.set(r.dayOfWeek, {
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        slotMinutes: r.slotMinutes,
        enabled: r.enabled,
      });
    }

    const busy: SlotRange[] = [];
    for (const b of bookings) {
      if (!b.scheduledDate) continue;
      const minutes = b.slotMinutes ?? 60;
      busy.push({
        startAt: b.scheduledDate,
        endAt: new Date(b.scheduledDate.getTime() + minutes * 60 * 1000),
      });
    }
    for (const block of blocks) {
      busy.push({ startAt: block.startAt, endAt: block.endAt });
    }

    const days = eachDateInclusive(from, to).map((day) => {
      const rule = ruleByDay.get(day.getDay()) ?? DEFAULT_AVAILABILITY[day.getDay()];
      const slots = generateSlotsForDate(day, rule).map((slot) => ({
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        available: !overlapsAny(slot, busy) && slot.startAt.getTime() > Date.now(),
      }));
      return {
        date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
        dayOfWeek: day.getDay(),
        slots,
      };
    });

    return NextResponse.json({ days });
  } catch (err) {
    console.error("GET /api/availability failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
