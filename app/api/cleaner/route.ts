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
    const cleaners = await prisma.cleaner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cleaningJobs: {
          select: {
            id: true,
            status: true,
            totalPay: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ cleaners });
  } catch (err) {
    console.error("GET /api/cleaner failed:", err);
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
    const phone = body.phone?.trim();
    const address = body.address?.trim() || null;
    const paymentType = body.paymentType === "per_job" ? "per_job" : "hourly";
    const hourlyRate = body.hourlyRate ? parseFloat(body.hourlyRate) : null;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    if (paymentType === "hourly" && (!hourlyRate || hourlyRate <= 0)) {
      return NextResponse.json(
        { success: false, error: "Hourly rate must be greater than 0" },
        { status: 400 }
      );
    }

    const cleaner = await prisma.cleaner.create({
      data: { name, email, phone, address, paymentType, hourlyRate },
    });

    return NextResponse.json({ success: true, cleaner });
  } catch (err) {
    console.error("POST /api/cleaner failed:", err);
    const message =
      err instanceof Error && err.message.includes("Unique constraint")
        ? "A cleaner with that email already exists"
        : "Failed to create cleaner";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
