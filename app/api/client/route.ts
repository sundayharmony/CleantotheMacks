import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

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
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        bookings: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            serviceType: true,
            cleaningJob: {
              select: { totalPay: true, status: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        satisfactionNotes: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ clients });
  } catch (err) {
    console.error("GET /api/client failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim() || null;
    const address = body.address?.trim();
    const preferredDay = body.preferredDay?.trim() || null;
    const preferredTime = body.preferredTime?.trim() || null;
    const specialInstructions = body.specialInstructions?.trim() || null;
    const pets = body.pets?.trim() || null;
    const accessCodes = body.accessCodes?.trim() || null;
    const communicationNotes = body.communicationNotes?.trim() || null;
    const referralSource = body.referralSource?.trim() || null;

    if (!name || !email || !address) {
      return NextResponse.json(
        { success: false, error: "Name, email, and address are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        preferredDay,
        preferredTime,
        specialInstructions,
        pets,
        accessCodes,
        communicationNotes,
        referralSource,
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (err) {
    console.error("POST /api/client failed:", err);
    const message =
      err instanceof Error && err.message.includes("Unique constraint")
        ? "A client with that email already exists"
        : "Failed to create client";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
