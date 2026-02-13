import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Clear the cookie by expiring it
  res.cookies.set({
    name: "admin_session",
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(0),
  });

  return res;
}
