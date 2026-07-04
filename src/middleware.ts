import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * The whole app is behind login. This middleware does an *optimistic* check
 * (cookie presence only — fast, edge-safe) and redirects unauthenticated
 * users to /login, preserving where they were headed.
 *
 * It deliberately does NOT redirect users *away* from /login when a cookie is
 * present: a stale/invalid cookie (localhost cookies are shared across ports)
 * would otherwise bounce /login -> home while the server -> /login, creating a
 * redirect loop. Real session validation happens in Server Components /
 * Server Actions via `auth.api.getSession`, and the auth pages redirect
 * genuinely-signed-in users client-side.
 */
const PUBLIC_PATHS = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublic) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
