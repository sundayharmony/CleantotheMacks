import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("client_session")?.value;

    if (token) {
      try {
        await prisma.clientSession.deleteMany({ where: { token } });
      } catch { /* ignore if table doesn't exist */ }
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("client_session", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch {
    const res = NextResponse.json({ success: true });
    res.cookies.set("client_session", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  }
}
