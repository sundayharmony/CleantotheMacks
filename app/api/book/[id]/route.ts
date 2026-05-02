import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyBookingCanceled } from "@/lib/email";

export const runtime = "nodejs"; // ensure Prisma runs in Node (not Edge)

async function requireAdmin() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session")?.value;
}

/** Next.js 15+ passes `params` as a Promise; older builds use a plain object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveParams(context: any): Promise<{ id?: string }> {
  const raw = context?.params;
  if (!raw) return {};
  const resolved = await Promise.resolve(raw);
  return resolved && typeof resolved === "object" ? resolved : {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, context: any) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routeParams = await resolveParams(context);
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
      clientId?: string | null;
      scheduledDate?: string | null;
      serviceType?: string | null;
    };
    const id = routeParams?.id ?? body.id;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
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
      clientId?: string | null;
      scheduledDate?: Date | null;
      serviceType?: string | null;
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
    if (body.clientId !== undefined) {
      data.clientId = body.clientId || null;
    }
    if (body.scheduledDate !== undefined) {
      if (body.scheduledDate === null || body.scheduledDate === "") {
        data.scheduledDate = null;
      } else {
        const parsed = new Date(body.scheduledDate);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: "Invalid appointment date — check date and time." },
            { status: 400 },
          );
        }
        data.scheduledDate = parsed;
      }
    }
    if (typeof body.serviceType === "string") {
      data.serviceType = body.serviceType.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { status: true, name: true, email: true, scheduledDate: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data,
    });

    if (data.status === "CANCELED" && existing.status !== "CANCELED") {
      notifyBookingCanceled({
        clientName: existing.name,
        clientEmail: existing.email,
        scheduledDate: existing.scheduledDate
          ? existing.scheduledDate.toLocaleString()
          : null,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (err) {
    console.error("PATCH /api/book/[id] failed:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "Could not save — the linked client may have been removed. Set Link Client to None and try again.",
          },
          { status: 400 },
        );
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: "Save failed on the server. If this keeps happening, run database migrations or check logs." },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, context: any) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const routeParams = await resolveParams(context);
    const id = routeParams?.id;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.booking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/book/[id] failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
