/**
 * API Route: POST /api/premium/subscribe
 * Créer une session de paiement Stripe pour Premium
 *
 * PR-27: Paiement Premium & plans
 *
 * Flow:
 * 1. Valider l'utilisateur (auth Clerk)
 * 2. Valider le plan sélectionné
 * 3. Appeler le backend pour créer la session Stripe Checkout
 * 4. Retourner l'URL de redirection
 *
 * Si backend non prêt → retourner "coming soon"
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPlanById, type PremiumPlanId } from "@/lib/premium-plans";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

const FETCH_TIMEOUT_MS = 15000;

// Response helpers
function successResponse(data: { checkoutUrl: string; sessionId: string }) {
  return NextResponse.json({ ok: true, ...data });
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    // Check Stripe configuration
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return errorResponse(
        "STRIPE_NOT_CONFIGURED",
        "Le paiement n'est pas encore disponible. Revenez bientôt.",
        503
      );
    }

    // Check API URL
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return errorResponse(
        "API_NOT_CONFIGURED",
        "Service temporairement indisponible.",
        503
      );
    }

    // Auth check
    const { userId, getToken } = await auth();

    if (!userId) {
      return errorResponse("UNAUTHENTICATED", "Connexion requise", 401);
    }

    const token = await getToken();
    if (!token) {
      return errorResponse("TOKEN_UNAVAILABLE", "Erreur d'authentification", 401);
    }

    // Parse request body
    let body: { planId: PremiumPlanId };
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Requête invalide", 400);
    }

    // Validate plan
    const plan = getPlanById(body.planId);
    if (!plan) {
      return errorResponse("INVALID_PLAN", "Plan non reconnu", 400);
    }

    // Build success/cancel URLs
    const origin = request.headers.get("origin") ?? "http://localhost:3000";
    const successUrl = `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/premium/pricing?canceled=true`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const backendUrl = `${API_BASE_URL}/premium/checkout`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
          successUrl,
          cancelUrl,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (networkError) {
      clearTimeout(timeoutId);

      if (networkError instanceof Error && networkError.name === "AbortError") {
        return errorResponse("TIMEOUT", "Le serveur n'a pas répondu", 504);
      }

      console.error("[PREMIUM_SUBSCRIBE] Backend unreachable:", networkError);
      return errorResponse(
        "COMING_SOON",
        "Premium sera bientôt disponible. Nous vous tiendrons informé.",
        503
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Backend not ready (501/404)
    if (response.status === 501 || response.status === 404) {
      return errorResponse(
        "COMING_SOON",
        "Premium sera bientôt disponible. Nous vous tiendrons informé.",
        501
      );
    }

    // Other backend errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[PREMIUM_SUBSCRIBE] Backend error:", response.status, errorBody);

      let message = "Une erreur est survenue. Réessayez plus tard.";
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed?.message ?? message;
      } catch {
        // Keep default
      }

      return errorResponse("BACKEND_ERROR", message, 502);
    }

    // Parse success response
    try {
      const data = await response.json();

      if (!data.checkoutUrl) {
        return errorResponse("INVALID_RESPONSE", "Réponse invalide", 502);
      }

      return successResponse({
        checkoutUrl: data.checkoutUrl,
        sessionId: data.sessionId ?? "",
      });
    } catch {
      return errorResponse("PARSE_ERROR", "Réponse invalide", 502);
    }
  } catch (error) {
    console.error("[PREMIUM_SUBSCRIBE_ERROR]", error);
    return errorResponse("INTERNAL_ERROR", "Erreur interne", 500);
  }
}

