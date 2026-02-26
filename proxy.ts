import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and login/auth pages
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname === "/portal/login" ||
    pathname.startsWith("/api/portal/login") ||
    pathname.startsWith("/api/portal/register") ||
    pathname === "/cleaner/login" ||
    pathname.startsWith("/api/cleaner-portal/login") ||
    pathname.startsWith("/api/cleaner-portal/set-password") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get("admin_session")?.value;

    if (!cookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Protect /portal dashboard (not login or API)
  if (pathname === "/portal" || (pathname.startsWith("/portal/") && !pathname.startsWith("/portal/login"))) {
    const cookie = request.cookies.get("client_session")?.value;

    if (!cookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
  }

  // Protect /cleaner dashboard (not login or API)
  if (pathname === "/cleaner" || (pathname.startsWith("/cleaner/") && !pathname.startsWith("/cleaner/login"))) {
    const cookie = request.cookies.get("cleaner_session")?.value;

    if (!cookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/cleaner/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/cleaner/:path*"],
};
