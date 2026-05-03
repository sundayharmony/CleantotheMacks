import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyNewBooking } from "@/lib/email";
import {
  safeAvailabilityConfigForDay,
  safeBlockedSlotsForDay,
  safeBookingsForDay,
} from "@/lib/prisma-scheduling-compat";
import {
  AvailabilityRule,
  DEFAULT_AVAILABILITY,
  generateSlotsForDate,
  overlapsAny,
  SlotRange,
} from "@/lib/scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_TYPES = new Set([
  "standard",
  "deep_clean",
  "move_in",
  "recurring",
  "painting",
]);

async function isSlotAvailable(scheduledDate: Date, slotMinutes: number): Promise<boolean> {
  const dayStart = new Date(
    scheduledDate.getFullYear(),
    scheduledDate.getMonth(),
    scheduledDate.getDate(),
  );
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [configRows, bookings, blocks] = await Promise.all([
    safeAvailabilityConfigForDay(scheduledDate.getDay()),
    safeBookingsForDay(dayStart, dayEnd),
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

  const busy: SlotRange[] = [];
  for (const b of bookings) {
    if (!b.scheduledDate) continue;
    /* slotMinutes is null on legacy rows / pre-migration DBs; default to 60 */
    const minutes = b.slotMinutes ?? 60;
    busy.push({
      startAt: b.scheduledDate,
      endAt: new Date(b.scheduledDate.getTime() + minutes * 60 * 1000),
    });
  }
  for (const block of blocks) {
    busy.push({ startAt: block.startAt, endAt: block.endAt });
  }

  return !overlapsAny(matched, busy);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    homeSize?: string;
    sqft?: string;
    squareFeet?: string;
    notes?: string;
    serviceType?: string;
    scheduledDate?: string;
    slotMinutes?: number;
  };

  const name = body.name?.trim();
  const email = body.email?.trim();
  const address = body.address?.trim();
  const homeSize = body.homeSize?.trim();
  const phone = body.phone?.trim();
  const sqft = (body.sqft ?? body.squareFeet ?? "").trim();
  const notes = body.notes?.trim();
  const serviceType = body.serviceType?.trim();
  const scheduledDateRaw = body.scheduledDate?.trim();
  const slotMinutes = typeof body.slotMinutes === "number" ? body.slotMinutes : 60;

  if (!name || !email || !address || !homeSize) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { success: false, error: "Invalid email address" },
      { status: 400 },
    );
  }

  if (!serviceType || !SERVICE_TYPES.has(serviceType)) {
    return NextResponse.json(
      { success: false, error: "Please choose a service type" },
      { status: 400 },
    );
  }

  let scheduledDate: Date | null = null;
  if (scheduledDateRaw) {
    scheduledDate = new Date(scheduledDateRaw);
    if (Number.isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid scheduled date" },
        { status: 400 },
      );
    }
    if (scheduledDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, error: "Please pick a future time slot" },
        { status: 400 },
      );
    }
    const ok = await isSlotAvailable(scheduledDate, slotMinutes);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "That time slot is no longer available" },
        { status: 409 },
      );
    }
  }

  let clientId: string | null = null;
  try {
    const existingClient = await prisma.client.findUnique({ where: { email } });
    if (existingClient) {
      /* Preserve every existing Client field — only reuse the id to link this booking. */
      clientId = existingClient.id;
    } else {
      try {
        const created = await prisma.client.create({
          data: {
            name,
            email,
            phone: phone || null,
            address,
          },
        });
        clientId = created.id;
      } catch (createErr) {
        /* Race: another request inserted the same email between findUnique and create. */
        if (
          createErr instanceof Prisma.PrismaClientKnownRequestError &&
          createErr.code === "P2002"
        ) {
          const raced = await prisma.client.findUnique({ where: { email } });
          if (raced) {
            clientId = raced.id;
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }
  } catch (clientErr) {
    /* Don't block the booking if client linking fails — log and continue unlinked. */
    console.error("POST /api/book client upsert failed:", clientErr);
    clientId = null;
  }

  const fullCreate = {
    name,
    email,
    phone: phone || null,
    address,
    homeSize,
    sqft: sqft || null,
    notes: notes || null,
    serviceType,
    scheduledDate: scheduledDate ?? undefined,
    slotMinutes: scheduledDate ? slotMinutes : null,
    clientId: clientId ?? undefined,
  } satisfies Parameters<typeof prisma.booking.create>[0]["data"];

  try {
    let booking;
    try {
      booking = await prisma.booking.create({ data: fullCreate });
    } catch (firstErr) {
      /* Older DBs before scheduling migration have no slotMinutes column */
      if (
        firstErr instanceof Prisma.PrismaClientKnownRequestError &&
        firstErr.code === "P2022"
      ) {
        const { slotMinutes: _omit, ...rest } = fullCreate;
        booking = await prisma.booking.create({ data: rest });
      } else {
        throw firstErr;
      }
    }

    notifyNewBooking({
      name,
      email,
      address,
      homeSize,
      date: scheduledDate ? scheduledDate.toLocaleString() : null,
      notes,
    }).catch(() => {});

    return NextResponse.json({ success: true, id: booking.id });
  } catch (err) {
    console.error("POST /api/book failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        sqft: true,
        homeSize: true,
        notes: true,
        status: true,
        clientId: true,
        scheduledDate: true,
        serviceType: true,
        cleaningJob: {
          select: { id: true, cleanerId: true, status: true },
        },
      },
    });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("GET /api/book failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
