import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { AvailabilityRule, DEFAULT_AVAILABILITY } from "@/lib/scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("admin_session")?.value);
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.availabilityConfig.findMany();
    const byDay = new Map<number, AvailabilityRule>();
    for (const r of DEFAULT_AVAILABILITY) byDay.set(r.dayOfWeek, r);
    for (const r of rows) {
      byDay.set(r.dayOfWeek, {
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        slotMinutes: r.slotMinutes,
        enabled: r.enabled,
      });
    }
    const config = Array.from(byDay.values()).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    return NextResponse.json({ config });
  } catch (err) {
    console.error("GET /api/availability/config failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { config?: Partial<AvailabilityRule>[] };
  if (!Array.isArray(body.config)) {
    return NextResponse.json({ error: "Missing config array" }, { status: 400 });
  }

  for (const row of body.config) {
    if (
      typeof row.dayOfWeek !== "number" ||
      row.dayOfWeek < 0 ||
      row.dayOfWeek > 6 ||
      !isValidTime(row.startTime) ||
      !isValidTime(row.endTime) ||
      typeof row.slotMinutes !== "number" ||
      row.slotMinutes < 15 ||
      row.slotMinutes > 480 ||
      typeof row.enabled !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid config row" }, { status: 400 });
    }
  }

  try {
    await prisma.$transaction(
      body.config.map((row) =>
        prisma.availabilityConfig.upsert({
          where: { dayOfWeek: row.dayOfWeek as number },
          create: {
            dayOfWeek: row.dayOfWeek as number,
            startTime: row.startTime as string,
            endTime: row.endTime as string,
            slotMinutes: row.slotMinutes as number,
            enabled: row.enabled as boolean,
          },
          update: {
            startTime: row.startTime as string,
            endTime: row.endTime as string,
            slotMinutes: row.slotMinutes as number,
            enabled: row.enabled as boolean,
          },
        }),
      ),
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/availability/config failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
