import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { notifyJobCompleted, notifyAdminJobCompleted } from "@/lib/email";

export const runtime = "nodejs";

async function getCleanerFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cleaner_session")?.value;
  if (!token) return null;

  const session = await prisma.cleanerSession.findUnique({
    where: { token },
    include: { cleaner: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.cleaner;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, context: any) {
  try {
    const cleaner = await getCleanerFromSession();
    if (!cleaner) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rawParams = context?.params;
    const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    // Verify this job belongs to the cleaner
    const job = await prisma.cleaningJob.findUnique({
      where: { id },
      include: {
        booking: { select: { name: true, email: true, address: true } },
      },
    });

    if (!job || job.cleanerId !== cleaner.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    // Cleaners can update: status (only to specific values) and completionNotes
    if (typeof body.completionNotes === "string") {
      data.completionNotes = body.completionNotes.trim() || null;
    }

    if (body.status === "completed") {
      data.status = "completed";
      data.clockOutTime = new Date();

      // Calculate pay
      if (cleaner.paymentType === "hourly" && cleaner.hourlyRate && job.clockInTime) {
        const hours = (Date.now() - new Date(job.clockInTime).getTime()) / (1000 * 60 * 60);
        data.totalPay = Math.round(hours * cleaner.hourlyRate * 100) / 100;
      } else if (cleaner.paymentType === "per_job" && job.flatRateAmount) {
        data.totalPay = job.flatRateAmount;
      }
    }

    if (body.status === "in_progress" && job.status === "assigned") {
      data.status = "in_progress";
      data.clockInTime = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.cleaningJob.update({
      where: { id },
      data,
      include: {
        booking: { select: { id: true, name: true, address: true, email: true } },
      },
    });

    // Send email notifications if job completed
    if (data.status === "completed") {
      notifyJobCompleted({
        clientName: updated.booking.name,
        clientEmail: updated.booking.email,
        address: updated.booking.address,
        completionNotes: updated.completionNotes,
      }).catch(() => {});

      notifyAdminJobCompleted({
        cleanerName: cleaner.name,
        clientName: updated.booking.name,
        address: updated.booking.address,
        totalPay: updated.totalPay,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, job: updated });
  } catch (err) {
    console.error("PATCH /api/cleaner-portal/job/[id] failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
