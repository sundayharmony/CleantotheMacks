import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const releases = await prisma.videoRelease.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        clientName: true,
        clientEmail: true,
        propertyAddress: true,
        bookingId: true,
        tokenExpiresAt: true,
        status: true,
        signedAt: true,
        signerName: true,
        signatureText: true,
        signerIp: true,
        signerUserAgent: true,
      },
    });

    return NextResponse.json({ releases });
  } catch (err) {
    console.error("GET /api/video-release failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
