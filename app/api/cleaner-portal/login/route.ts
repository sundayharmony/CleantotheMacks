import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleaner = await prisma.cleaner.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!cleaner || !cleaner.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const hash = crypto.createHash("sha256").update(password).digest("hex");
    if (hash !== cleaner.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.cleanerSession.create({
      data: { token, cleanerId: cleaner.id, expiresAt },
    });

    const cookieStore = await cookies();
    cookieStore.set("cleaner_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return NextResponse.json({
      success: true,
      cleaner: { id: cleaner.id, name: cleaner.name, email: cleaner.email },
    });
  } catch (err) {
    console.error("POST /api/cleaner-portal/login failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
