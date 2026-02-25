import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { email } });

    if (!client || !client.passwordHash) {
      return NextResponse.json({ error: "No account found with this email. Please register first." }, { status: 401 });
    }

    const hash = hashPassword(password);
    if (hash !== client.passwordHash) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.clientSession.create({
      data: { token, clientId: client.id, expiresAt },
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set("client_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error("POST /api/portal/login failed:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
