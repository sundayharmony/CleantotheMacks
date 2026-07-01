import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { safeAllBlockedSlots } from "@/lib/prisma-scheduling-compat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("admin_session")?.value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const blocks = await safeAllBlockedSlots();
    return NextResponse.json({ blocks });
  } catch (err) {
    console.error("GET /api/availability/block failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    startAt?: string;
    endAt?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  };

  let startAt: Date | null = body.startAt ? new Date(body.startAt) : null;
  let endAt: Date | null = body.endAt ? new Date(body.endAt) : null;

  if (body.startDate && body.endDate) {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/;
    const sm = dateMatch.exec(body.startDate);
    const em = dateMatch.exec(body.endDate);
    if (!sm || !em) {
      return NextResponse.json({ error: "Invalid startDate/endDate" }, { status: 400 });
    }
    startAt = new Date(Number(sm[1]), Number(sm[2]) - 1, Number(sm[3]));
    endAt = new Date(Number(em[1]), Number(em[2]) - 1, Number(em[3]) + 1);
  }

  if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Invalid start/end" }, { status: 400 });
  }
  if (endAt.getTime() <= startAt.getTime()) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  try {
    const block = await prisma.blockedSlot.create({
      data: {
        startAt,
        endAt,
        reason: body.reason?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, block });
  } catch (err) {
    console.error("POST /api/availability/block failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.blockedSlot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/availability/block failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
