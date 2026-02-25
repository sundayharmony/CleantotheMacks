import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin() {
  const cookieStore = await cookies();
  return !!cookieStore.get("admin_session")?.value;
}

async function tableExists(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'GalleryItem'
      ) as exists
    `;
    return result[0]?.exists === true;
  } catch { return false; }
}

export async function GET(request: Request) {
  try {
    if (!(await tableExists())) {
      return NextResponse.json({ gallery: [] });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      if (!(await isAdmin())) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const gallery = await prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });
      return NextResponse.json({ gallery });
    }

    const gallery = await prisma.galleryItem.findMany({
      where: { visible: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ gallery });
  } catch (err) {
    console.error("GET /api/gallery failed:", err);
    return NextResponse.json({ gallery: [] });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const title = body.title?.trim();
    const description = body.description?.trim() || null;
    const beforeImageUrl = body.beforeImageUrl?.trim();
    const afterImageUrl = body.afterImageUrl?.trim();
    const visible = body.visible !== false;
    const sortOrder = body.sortOrder != null ? parseInt(body.sortOrder, 10) : 0;

    if (!title || !beforeImageUrl || !afterImageUrl) {
      return NextResponse.json({ error: "Title and both image URLs are required" }, { status: 400 });
    }

    const item = await prisma.galleryItem.create({
      data: { title, description, beforeImageUrl, afterImageUrl, visible, sortOrder },
    });
    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error("POST /api/gallery failed:", err);
    return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 });
  }
}
