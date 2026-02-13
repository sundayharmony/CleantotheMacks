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

    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.email === "string" && body.email.trim()) data.email = body.email.trim();
    if (typeof body.phone === "string") data.phone = body.phone.trim() || null;
    if (typeof body.address === "string") data.address = body.address.trim() || null;
    if (body.paymentType === "hourly" || body.paymentType === "per_job") {
      data.paymentType = body.paymentType;
    }
    if (body.hourlyRate !== undefined) {
      data.hourlyRate = body.hourlyRate ? parseFloat(body.hourlyRate) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const cleaner = await prisma.cleaner.update({ where: { id }, data });
    return NextResponse.json({ success: true, cleaner });
  } catch (err) {
    console.error("PATCH /api/cleaner/[id] failed:", err);
    const message =
      err instanceof Error && err.message.includes("Unique constraint")
        ? "A cleaner with that email already exists"
        : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
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

    await prisma.cleaner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/cleaner/[id] failed:", err);
    const message =
      err instanceof Error && err.message.includes("restrict")
        ? "Cannot delete cleaner with active jobs"
        : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
