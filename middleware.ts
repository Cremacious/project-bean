// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// `/apple-icon` is the generated apple-touch-icon route. It has no file
// extension, so (unlike /icon.svg and /favicon.ico) it is not caught by the
// matcher's extension exclusion below; list it here so the logo icon stays
// publicly reachable instead of redirecting to sign-in.
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/auth", "/apple-icon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
