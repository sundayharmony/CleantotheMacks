import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cleaner_session")?.value;

    if (token) {
      await prisma.cleanerSession.deleteMany({ where: { token } }).catch(() => {});
    }

    cookieStore.set("cleaner_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/cleaner-portal/logout failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
