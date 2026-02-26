import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cleaner_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = await prisma.cleanerSession.findUnique({
      where: { token },
      include: { cleaner: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.cleanerSession.delete({ where: { id: session.id } }).catch(() => {});
      }
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const jobs = await prisma.cleaningJob.findMany({
      where: { cleanerId: session.cleaner.id },
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            name: true,
            address: true,
            homeSize: true,
            sqft: true,
            notes: true,
            scheduledDate: true,
            serviceType: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      cleaner: {
        id: session.cleaner.id,
        name: session.cleaner.name,
        email: session.cleaner.email,
        phone: session.cleaner.phone,
        paymentType: session.cleaner.paymentType,
        hourlyRate: session.cleaner.hourlyRate,
      },
      jobs,
    });
  } catch (err) {
    console.error("GET /api/cleaner-portal/me failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
