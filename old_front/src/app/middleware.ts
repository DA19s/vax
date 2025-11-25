import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const userCookie = req.cookies.get("user")?.value; // Cookie non HttpOnly géré côté frontend
  const url = req.nextUrl.pathname;

  // ✅ Si pas de user → redirection login
  if (!userCookie && url.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // middleware appliqué uniquement aux routes dashboard
};
