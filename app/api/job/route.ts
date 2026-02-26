import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { notifyJobAssigned } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session")?.value;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await prisma.cleaningJob.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            name: true,
            address: true,
            homeSize: true,
            sqft: true,
            status: true,
            scheduledDate: true,
          },
        },
        cleaner: {
          select: {
            id: true,
            name: true,
            paymentType: true,
            hourlyRate: true,
          },
        },
      },
    });

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("GET /api/job failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const bookingId = body.bookingId?.trim();
    const cleanerId = body.cleanerId?.trim();
    const flatRateAmount = body.flatRateAmount ? parseFloat(body.flatRateAmount) : null;

    if (!bookingId || !cleanerId) {
      return NextResponse.json(
        { success: false, error: "Booking and cleaner are required" },
        { status: 400 }
      );
    }

    // Verify booking exists and doesn't already have a job
    const existingJob = await prisma.cleaningJob.findUnique({
      where: { bookingId },
    });
    if (existingJob) {
      return NextResponse.json(
        { success: false, error: "This booking already has an assigned cleaner" },
        { status: 400 }
      );
    }

    const job = await prisma.cleaningJob.create({
      data: {
        bookingId,
        cleanerId,
        flatRateAmount,
        status: "assigned",
      },
      include: {
        booking: { select: { id: true, name: true, address: true, homeSize: true, scheduledDate: true } },
        cleaner: { select: { id: true, name: true, email: true, paymentType: true, hourlyRate: true } },
      },
    });

    // Notify cleaner of new assignment (fire-and-forget)
    notifyJobAssigned({
      cleanerName: job.cleaner.name,
      cleanerEmail: job.cleaner.email,
      clientName: job.booking.name,
      address: job.booking.address,
      homeSize: job.booking.homeSize,
      date: job.booking.scheduledDate?.toString() || null,
    }).catch(() => {});

    return NextResponse.json({ success: true, job });
  } catch (err) {
    console.error("POST /api/job failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create job" },
      { status: 500 }
    );
  }
}
