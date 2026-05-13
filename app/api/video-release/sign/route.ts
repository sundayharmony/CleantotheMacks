import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidSignaturePngDataUrl } from "@/lib/signature-validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    token?: string;
    signerName?: string;
    signatureImageDataUrl?: string;
    signatureText?: string;
    agreed?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const token = body.token?.trim();
  const signerName = body.signerName?.trim();
  const signatureImageDataUrl = body.signatureImageDataUrl?.trim();
  const agreed = body.agreed === true;

  if (!token || !signerName || !agreed) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const hasDrawnSignature = isValidSignaturePngDataUrl(signatureImageDataUrl);
  const legacyTyped =
    !hasDrawnSignature &&
    typeof body.signatureText === "string" &&
    body.signatureText.trim().length >= 2;

  if (!hasDrawnSignature && !legacyTyped) {
    return NextResponse.json(
      { success: false, error: "A drawn signature is required" },
      { status: 400 },
    );
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
        signatureText: legacyTyped ? body.signatureText!.trim() : null,
        signatureImageDataUrl: hasDrawnSignature ? signatureImageDataUrl! : null,
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
