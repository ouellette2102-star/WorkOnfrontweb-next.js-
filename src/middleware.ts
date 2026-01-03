import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Check if Clerk is configured (without importing env.ts to avoid edge runtime issues)
 */
function isClerkConfiguredInMiddleware(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key && key.length > 10 && (key.startsWith("pk_test_") || key.startsWith("pk_live_")));
}

// Routes publiques (pas besoin d'auth)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/api/webhooks(.*)",
  "/debug(.*)", // Debug routes (health check, etc.)
  "/setup(.*)", // Setup/config page (always public)
]);

// Routes d'onboarding (auth requise mais pas de rôle)
const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)",
]);

// Routes worker (auth + rôle WORKER requis)
const isWorkerRoute = createRouteMatcher([
  "/worker(.*)",
]);

// Routes employer (auth + rôle EMPLOYER requis)
const isEmployerRoute = createRouteMatcher([
  "/employer(.*)",
  "/missions/new(.*)",
  "/missions/mine(.*)",
]);

/**
 * Fallback middleware when Clerk is not configured
 * Allows public routes, redirects protected routes to /setup
 */
function fallbackMiddleware(req: NextRequest): NextResponse {
  // Always allow public routes and static files
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Redirect protected routes to setup page
  const setupUrl = new URL("/setup", req.url);
  setupUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(setupUrl);
}

/**
 * Main middleware with Clerk auth
 */
const clerkAuthMiddleware = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;

  // Routes publiques : laisser passer
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Si pas authentifié : rediriger vers sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", url.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Si authentifié : récupérer le profil via le backend pour connaître le rôle
  // Note : en production, on pourrait mettre le rôle dans sessionClaims pour éviter l'appel API
  // Pour cette implémentation, on laisse passer et les helpers server-side gèrent la redirection

  return NextResponse.next();
});

/**
 * Exported middleware - chooses between Clerk and fallback based on config
 */
export default function middleware(req: NextRequest) {
  // If Clerk is not configured, use fallback (no crash)
  if (!isClerkConfiguredInMiddleware()) {
    return fallbackMiddleware(req);
  }
  
  // Use Clerk middleware
  return clerkAuthMiddleware(req, {} as never);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
