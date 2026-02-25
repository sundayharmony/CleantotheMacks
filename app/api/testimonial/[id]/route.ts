import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session")?.value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, context: any) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = context?.params;
    const params =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      const val = body.name.trim();
      if (val) data.name = val;
    }
    if (typeof body.quote === "string") {
      const val = body.quote.trim();
      if (val) data.quote = val;
    }
    if (body.rating !== undefined) {
      data.rating = body.rating != null ? parseInt(body.rating, 10) : null;
    }
    if (typeof body.visible === "boolean") {
      data.visible = body.visible;
    }
    if (body.sortOrder !== undefined) {
      data.sortOrder = parseInt(body.sortOrder, 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, testimonial });
  } catch (err) {
    console.error("PATCH /api/testimonial/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = context?.params;
    const params =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/testimonial/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
