import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie-presence check only — this is NOT the real authorization
// boundary, it just avoids a flash of a protected page before redirecting.
// Every page/action re-verifies via lib/auth/dal.ts (requireUser /
// requireAdmin), which re-reads the user from the DB. Deliberately kept
// light (no jose verification, no DB import) per Next's own guidance for
// proxy/middleware.
const PROTECTED_PREFIXES = ["/dashboard", "/forum", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("session");

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
