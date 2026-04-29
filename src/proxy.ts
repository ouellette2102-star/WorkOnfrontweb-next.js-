import { NextResponse, type NextRequest } from "next/server";

/**
 * JWT-based proxy (replaces the deprecated `middleware` file convention
 * in Next.js 16+ — see https://nextjs.org/docs/messages/middleware-to-proxy).
 *
 * QA report item #11 / Sprint 1: previously this lived at
 * `src/middleware.ts`. Renamed to `proxy.ts` to silence the build
 * warning. Behaviour is unchanged — same matcher, same token check,
 * same redirect contract.
 *
 * Checks for the `workon_token` cookie on protected routes and
 * redirects unauth visitors to /login while preserving the intended
 * destination via `?redirect=`.
 */

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/login",
  "/register",
  "/forgot-password",
  // NOTE: /onboarding/* is intentionally NOT public. Every onboarding page
  // (role, details, success, employer) requires an authenticated user to
  // PATCH /users/me. Proxy redirects unauth to /login before the
  // client-side guard fires, avoiding the pre-hydration flash of the form.
  "/pros",
  "/p/",
  "/pro/",
  "/rejoindre-pro",
  "/missions",
  "/pricing",
  "/legal/",
  "/faq",
  "/api/",
];

function isPublicPath(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Prefix matches (routes with dynamic segments)
  return PUBLIC_PATHS.some(
    (p) => p.endsWith("/") && pathname.startsWith(p),
  );
}

export default function proxy(req: NextRequest) {
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
