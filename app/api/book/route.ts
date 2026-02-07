import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    address?: string;
    homeSize?: string;
    notes?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim();
  const address = body.address?.trim();
  const homeSize = body.homeSize?.trim();
  const notes = body.notes?.trim();

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
      address,
      homeSize,
      notes: notes || null,
    },
  });

  return NextResponse.json({ success: true, id: booking.id });
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
