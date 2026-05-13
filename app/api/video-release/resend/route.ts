import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyVideoReleaseRequest } from "@/lib/email";
import { getPublicSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RELEASE_EXPIRY_HOURS = 72;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { releaseId?: string };
  const releaseId = body.releaseId?.trim();
  if (!releaseId) {
    return NextResponse.json({ success: false, error: "Release ID is required" }, { status: 400 });
  }

  try {
    const release = await prisma.videoRelease.findUnique({
      where: { id: releaseId },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        propertyAddress: true,
        status: true,
      },
    });

    if (!release) {
      return NextResponse.json({ success: false, error: "Release not found" }, { status: 404 });
    }
    if (release.status === "SIGNED") {
      return NextResponse.json(
        { success: false, error: "Signed releases cannot be resent" },
        { status: 400 }
      );
    }

    const token = randomBytes(24).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + RELEASE_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.videoRelease.update({
      where: { id: release.id },
      data: {
        token,
        tokenExpiresAt,
        status: "PENDING",
      },
    });

    const signingUrl = `${getPublicSiteUrl()}/video-release/${token}`;

    await notifyVideoReleaseRequest({
      clientName: release.clientName,
      clientEmail: release.clientEmail,
      propertyAddress: release.propertyAddress,
      signingUrl,
      expiresAtText: tokenExpiresAt.toLocaleString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/video-release/resend failed:", err);
    return NextResponse.json({ success: false, error: "Failed to resend release form" }, { status: 500 });
  }
}
