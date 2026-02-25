import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session")?.value;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    // If requesting all (admin view), require auth
    if (all) {
      if (!(await isAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const testimonials = await prisma.testimonial.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ testimonials });
    }

    // Public endpoint: only visible testimonials
    const testimonials = await prisma.testimonial.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ testimonials });
  } catch (err) {
    console.error("GET /api/testimonial failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = body.name?.trim();
    const quote = body.quote?.trim();
    const rating = body.rating != null ? parseInt(body.rating, 10) : null;
    const visible = body.visible !== false;
    const sortOrder = body.sortOrder != null ? parseInt(body.sortOrder, 10) : 0;

    if (!name || !quote) {
      return NextResponse.json(
        { success: false, error: "Name and quote are required" },
        { status: 400 }
      );
    }

    if (rating != null && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: { name, quote, rating, visible, sortOrder },
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (err) {
    console.error("POST /api/testimonial failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
