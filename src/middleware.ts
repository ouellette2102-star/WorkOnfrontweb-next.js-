import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes publiques (pas besoin d'auth)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/api/webhooks(.*)",
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
  "/missions/create(.*)",
  "/missions/mine(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
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

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};