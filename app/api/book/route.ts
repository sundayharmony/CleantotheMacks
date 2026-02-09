import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_STATUSES = new Set(["NEW", "CONFIRMED", "COMPLETED"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    sqft?: string;
    homeSize?: string;
    notes?: string;
  };

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const address = (body.address ?? "").trim();
  const sqft = (body.sqft ?? "").trim();
  const homeSize = (body.homeSize ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!name || !email || !address || !homeSize) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      name,
      email,
      phone: phone || null,
      address,
      sqft: sqft || null,
      homeSize,
      notes: notes || null,
      // status defaults to "NEW" from Prisma schema
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, id: booking.id });
}

// Admin: fetch bookings list
export async function GET() {
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

  return NextResponse.json({ success: true, bookings });
}

// Admin: update booking status
export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string; status?: string };

  const id = (body.id ?? "").trim();
  const status = (body.status ?? "").trim().toUpperCase();

  if (!id || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { success: false, error: "Invalid id or status" },
      { status: 400 }
    );
  }

  await prisma.booking.update({
    where: { id },
    data: { status },
    select: { id: true },
  });

  return NextResponse.json({ success: true });
}
