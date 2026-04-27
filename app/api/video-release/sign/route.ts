import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    signerName?: string;
    signatureText?: string;
    agreed?: boolean;
  };

  const token = body.token?.trim();
  const signerName = body.signerName?.trim();
  const signatureText = body.signatureText?.trim();
  const agreed = body.agreed === true;

  if (!token || !signerName || !signatureText || !agreed) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    const release = await prisma.videoRelease.findUnique({
      where: { token },
      select: { id: true, status: true, tokenExpiresAt: true },
    });

    if (!release) {
      return NextResponse.json({ success: false, error: "Release form not found" }, { status: 404 });
    }

    if (release.status === "SIGNED") {
      return NextResponse.json({ success: true, alreadySigned: true });
    }

    if (release.tokenExpiresAt.getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: "This signing link has expired" }, { status: 410 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const signerIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
    const signerUserAgent = request.headers.get("user-agent");

    await prisma.videoRelease.update({
      where: { id: release.id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        signerName,
        signatureText,
        signerIp: signerIp || null,
        signerUserAgent: signerUserAgent || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/video-release/sign failed:", err);
    return NextResponse.json({ success: false, error: "Failed to sign release form" }, { status: 500 });
  }
}
