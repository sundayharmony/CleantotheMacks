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
    const name = body.name?.trim();
    const email = body.email?.trim()?.toLowerCase();
    const phone = body.phone?.trim() || null;
    const address = body.address?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    // Check if client with this email already exists
    const existing = await prisma.client.findUnique({ where: { email } });

    if (existing) {
      if (existing.passwordHash) {
        return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
      }
      // Existing client without password — set their password
      await prisma.client.update({
        where: { email },
        data: { passwordHash },
      });
    } else {
      // New client — require name and address
      if (!name || !address) {
        return NextResponse.json({ error: "Name, email, address, and password are required for new accounts" }, { status: 400 });
      }
      await prisma.client.create({
        data: { name, email, phone, address, passwordHash },
      });
    }

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const client = await prisma.client.findUnique({ where: { email } });
    if (!client) {
      return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }

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
    console.error("POST /api/portal/register failed:", err);
    const msg = err instanceof Error && err.message.includes("Unique constraint")
      ? "An account with this email already exists"
      : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
