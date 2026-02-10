import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  };

  const name = body.name?.trim();
  const email = body.email?.trim();
  const address = body.address?.trim();
  const homeSize = body.homeSize?.trim();
  const phone = body.phone?.trim();
  const sqft = (body.sqft ?? body.squareFeet ?? "").trim();
  const notes = body.notes?.trim();

  if (!name || !email || !address || !homeSize) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        name,
        email,
        phone: phone || null,
        address,
        homeSize,
        sqft: sqft || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, id: booking.id });
  } catch (err) {
    console.error("POST /api/book failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple auth: require admin_session cookie to exist
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
      },
    });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("GET /api/book failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
