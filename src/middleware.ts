import { NextResponse, type NextRequest } from "next/server";

/**
 * JWT-based middleware (replaces Clerk)
 * Checks for auth token cookie on protected routes
 */

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/sign-up",
  "/pros",
  "/employeurs",
  "/p/",
  "/pro/",
  "/missions",
  "/pricing",
  "/legal/",
  "/faq",
  "/api/",
  "/setup",
];

function isPublicPath(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Prefix matches (routes with dynamic segments)
  return PUBLIC_PATHS.some(
    (p) => p.endsWith("/") && pathname.startsWith(p),
  );
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("workon_token")?.value;

  // Authenticated users landing on marketing pages → redirect to app
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Public routes — always pass
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Protected routes — check for token in cookie
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};
