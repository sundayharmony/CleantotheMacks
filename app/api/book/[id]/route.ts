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
