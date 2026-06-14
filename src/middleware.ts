import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — protects /dashboard routes.
 * Cookie presence is checked here (no DB); the actual session validity
 * is verified server-side inside each protected page/action.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = request.cookies.get("ucr_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
