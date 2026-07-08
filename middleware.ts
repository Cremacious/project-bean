// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// The session cookie name (kept as a literal so this Edge-runtime file does not
// import lib/auth, which uses node:crypto). Presence-only check here; real
// signature verification happens in getReader() on the server.
const SESSION_COOKIE = "story_session";
const PUBLIC_PATHS = ["/sign-in"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
