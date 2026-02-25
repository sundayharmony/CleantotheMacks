import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("client_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = await prisma.clientSession.findUnique({
      where: { token },
      include: { client: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.clientSession.delete({ where: { id: session.id } });
      }
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const client = session.client;

    // Get bookings with cleaning job info
    const bookings = await prisma.booking.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      include: {
        cleaningJob: {
          select: { status: true, totalPay: true, clockInTime: true, clockOutTime: true },
        },
      },
    });

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        preferredDay: client.preferredDay,
        preferredTime: client.preferredTime,
      },
      bookings,
    });
  } catch (err) {
    console.error("GET /api/portal/me failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
