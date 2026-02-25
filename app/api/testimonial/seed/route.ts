import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session")?.value;
}

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if testimonials already exist
    const existing = await prisma.testimonial.count();
    if (existing > 0) {
      return NextResponse.json({
        success: false,
        error: `Already have ${existing} testimonials in the database. Seed skipped.`,
      });
    }

    // Seed the three original hardcoded testimonials
    const seeded = await prisma.testimonial.createMany({
      data: [
        {
          name: "Ashley R.",
          quote: "Every visit feels like a reset. Easy booking and great attention to detail.",
          rating: 5,
          visible: true,
          sortOrder: 0,
        },
        {
          name: "Jordan L.",
          quote: "Professional, on time, and my home has never looked better.",
          rating: 5,
          visible: true,
          sortOrder: 1,
        },
        {
          name: "Priya S.",
          quote: "Friendly crew and consistent quality. The best cleaning service we've used.",
          rating: 5,
          visible: true,
          sortOrder: 2,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Seeded ${seeded.count} testimonials`,
    });
  } catch (err) {
    console.error("POST /api/testimonial/seed failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to seed testimonials" },
      { status: 500 }
    );
  }
}
