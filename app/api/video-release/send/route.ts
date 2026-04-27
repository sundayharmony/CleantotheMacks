import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyVideoReleaseRequest } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RELEASE_EXPIRY_HOURS = 72;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    clientName?: string;
    clientEmail?: string;
    propertyAddress?: string;
    bookingId?: string;
  };

  const clientName = body.clientName?.trim();
  const clientEmail = body.clientEmail?.trim().toLowerCase();
  const propertyAddress = body.propertyAddress?.trim() || null;
  const bookingId = body.bookingId?.trim() || null;

  if (!clientName || !clientEmail) {
    return NextResponse.json({ success: false, error: "Client name and email are required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail)) {
    return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
  }

  const token = randomBytes(24).toString("hex");
  const tokenExpiresAt = new Date(Date.now() + RELEASE_EXPIRY_HOURS * 60 * 60 * 1000);

  try {
    const release = await prisma.videoRelease.create({
      data: {
        clientName,
        clientEmail,
        propertyAddress,
        bookingId,
        token,
        tokenExpiresAt,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";
    const signingUrl = `${baseUrl.replace(/\/$/, "")}/video-release/${token}`;

    await notifyVideoReleaseRequest({
      clientName,
      clientEmail,
      propertyAddress,
      signingUrl,
      expiresAtText: tokenExpiresAt.toLocaleString(),
    });

    return NextResponse.json({
      success: true,
      releaseId: release.id,
      expiresAt: tokenExpiresAt,
    });
  } catch (err) {
    console.error("POST /api/video-release/send failed:", err);
    return NextResponse.json({ success: false, error: "Failed to send video release form" }, { status: 500 });
  }
}
