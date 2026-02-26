import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Allows a cleaner to set their password.
 * Can be used for initial setup (with email) or password change (with session).
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleaner = await prisma.cleaner.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!cleaner) {
      return NextResponse.json({ error: "No cleaner account found with that email" }, { status: 404 });
    }

    const hash = crypto.createHash("sha256").update(password).digest("hex");
    await prisma.cleaner.update({
      where: { id: cleaner.id },
      data: { passwordHash: hash },
    });

    // Auto-login after setting password
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/cleaner-portal/set-password failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
