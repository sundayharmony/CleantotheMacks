import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session")?.value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, context: any) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = context?.params;
    const params =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.cleanerId === "string" && body.cleanerId.trim()) {
      data.cleanerId = body.cleanerId.trim();
    }
    if (typeof body.status === "string" && body.status.trim()) {
      data.status = body.status.trim();
    }
    if (typeof body.completionNotes === "string") {
      data.completionNotes = body.completionNotes.trim() || null;
    }
    if (body.flatRateAmount !== undefined) {
      data.flatRateAmount = body.flatRateAmount ? parseFloat(body.flatRateAmount) : null;
    }

    // Clock-in
    if (body.clockIn === true) {
      data.clockInTime = new Date();
      data.status = "in_progress";
    }

    // Clock-out + pay calculation
    if (body.clockOut === true) {
      data.clockOutTime = new Date();
      data.status = "completed";

      // Fetch the job with cleaner to calculate pay
      const job = await prisma.cleaningJob.findUnique({
        where: { id },
        include: { cleaner: true },
      });

      if (job) {
        const clockIn = job.clockInTime ?? new Date();
        const clockOut = new Date();
        if (job.cleaner.paymentType === "hourly" && job.cleaner.hourlyRate) {
          const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          data.totalPay = Math.round(hours * job.cleaner.hourlyRate * 100) / 100;
        } else if (job.cleaner.paymentType === "per_job") {
          data.totalPay = job.flatRateAmount ?? body.flatRateAmount ?? null;
        }
      }
    }

    // Manual totalPay override
    if (body.totalPay !== undefined && data.totalPay === undefined) {
      data.totalPay = body.totalPay ? parseFloat(body.totalPay) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const job = await prisma.cleaningJob.update({
      where: { id },
      data,
      include: {
        booking: { select: { id: true, name: true, address: true } },
        cleaner: { select: { id: true, name: true, paymentType: true, hourlyRate: true } },
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (err) {
    console.error("PATCH /api/job/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = context?.params;
    const params =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.cleaningJob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/job/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
