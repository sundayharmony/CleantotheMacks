import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { buildVideoReleasePdfBytes, safeVideoReleaseFilename } from "@/lib/video-release-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  const id = searchParams.get("id")?.trim();

  if (!token && !id) {
    return NextResponse.json({ error: "Missing token or id" }, { status: 400 });
  }
  if (token && id) {
    return NextResponse.json({ error: "Use either token or id, not both" }, { status: 400 });
  }

  try {
    if (id) {
      const cookieStore = await cookies();
      if (!cookieStore.get("admin_session")?.value) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const release = await prisma.videoRelease.findUnique({
      where: id ? { id } : { token: token! },
      select: {
        status: true,
        signedAt: true,
        clientName: true,
        clientEmail: true,
        propertyAddress: true,
        signerName: true,
        signatureImageDataUrl: true,
        signatureText: true,
        signerIp: true,
        signerUserAgent: true,
      },
    });

    if (!release || release.status !== "SIGNED" || !release.signedAt) {
      return NextResponse.json({ error: "Signed release not found" }, { status: 404 });
    }

    const bytes = await buildVideoReleasePdfBytes({
      clientName: release.clientName,
      clientEmail: release.clientEmail,
      propertyAddress: release.propertyAddress,
      signedAt: release.signedAt,
      signerName: release.signerName,
      signatureImageDataUrl: release.signatureImageDataUrl,
      signatureText: release.signatureText,
      signerIp: release.signerIp,
      signerUserAgent: release.signerUserAgent,
    });

    const filename = safeVideoReleaseFilename(release.signerName?.trim() || release.clientName);

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/video-release/pdf failed:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
