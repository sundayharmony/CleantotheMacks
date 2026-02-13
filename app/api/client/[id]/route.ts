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

    const stringFields = [
      "name", "email", "phone", "address",
      "preferredDay", "preferredTime", "specialInstructions",
      "pets", "accessCodes", "communicationNotes", "referralSource",
    ];

    for (const field of stringFields) {
      if (typeof body[field] === "string") {
        const val = body[field].trim();
        // Required fields keep their value; optional fields can be null
        if (field === "name" || field === "email" || field === "address") {
          if (val) data[field] = val;
        } else {
          data[field] = val || null;
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const client = await prisma.client.update({ where: { id }, data });
    return NextResponse.json({ success: true, client });
  } catch (err) {
    console.error("PATCH /api/client/[id] failed:", err);
    const message =
      err instanceof Error && err.message.includes("Unique constraint")
        ? "A client with that email already exists"
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

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/client/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
