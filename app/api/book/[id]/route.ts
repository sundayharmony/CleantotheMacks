import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs"; // ensure Prisma runs in Node (not Edge)

// NOTE: Use a permissive `context: any` param and defensively resolve params
// because the build-time types in Vercel/Next can differ (sometimes params
// may be provided as a Promise). This keeps the runtime behavior unchanged
// while avoiding brittle type errors during `next build`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, context: any) {
  try {
    // defensive: support context.params being a Promise or a plain object
    const rawParams = context?.params;
    const params =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;

    const body = (await req.json()) as {
      id?: string;
      status?: string;
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      homeSize?: string;
      sqft?: string;
      sqFt?: string;
      notes?: string;
    };
    const id = params?.id ?? body.id;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const data: {
      status?: string;
      name?: string;
      email?: string;
      phone?: string | null;
      address?: string;
      homeSize?: string;
      sqft?: string | null;
      notes?: string | null;
    } = {};

    if (typeof body.status === "string" && body.status.trim()) {
      data.status = body.status.trim();
    }
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.email === "string" && body.email.trim()) {
      data.email = body.email.trim();
    }
    if (typeof body.phone === "string") {
      const phone = body.phone.trim();
      data.phone = phone || null;
    }
    if (typeof body.address === "string" && body.address.trim()) {
      data.address = body.address.trim();
    }
    if (typeof body.homeSize === "string" && body.homeSize.trim()) {
      data.homeSize = body.homeSize.trim();
    }
    if (typeof body.notes === "string") {
      const notes = body.notes.trim();
      data.notes = notes || null;
    }
    if (typeof body.sqft === "string" || typeof body.sqFt === "string") {
      const sqft = (body.sqft ?? body.sqFt ?? "").trim();
      data.sqft = sqft || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error("PATCH /api/book/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
  try {
    const rawParams = context?.params;
    const params =
      rawParams && typeof rawParams.then === "function"
        ? await rawParams
        : rawParams;
    const { id } = params ?? {};

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.booking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/book/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
