import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs"; // ensure Prisma runs in Node (not Edge)

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = (await req.json()) as { status?: string; id?: string };
    const id = params?.id ?? body.id;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (!body?.status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error("PATCH /api/book/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = params;
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
