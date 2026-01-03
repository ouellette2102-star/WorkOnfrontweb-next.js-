/**
 * API Route: POST /api/payments/create-intent
 * Proxy HTTP vers le backend NestJS pour créer un PaymentIntent Stripe
 *
 * Contrat de réponse normalisé (PR-18):
 * - { ok: true, clientSecret: string, paymentIntentId: string }
 * - { ok: false, error: { code: string, message: string } }
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

const FETCH_TIMEOUT_MS = 15000; // 15s timeout for payment operations

// Normalized response helpers
function successResponse(data: { clientSecret: string; paymentIntentId: string }) {
  return NextResponse.json({
    ok: true,
    ...data,
  });
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    // Check Stripe configuration
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return errorResponse(
        "STRIPE_NOT_CONFIGURED",
        "Stripe n'est pas configuré. Contactez le support.",
        503
      );
    }

    // Check API URL configuration
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return errorResponse(
        "API_NOT_CONFIGURED",
        "L'API backend n'est pas configurée.",
        503
      );
    }

    // Auth check
    const { userId, getToken } = await auth();

    if (!userId) {
      return errorResponse("UNAUTHENTICATED", "Authentification requise", 401);
    }

    const token = await getToken();
    if (!token) {
      return errorResponse(
        "TOKEN_UNAVAILABLE",
        "Impossible de récupérer le token",
        401
      );
    }

    // Parse request body
    let body: { missionId: string; amountCents: number };
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Corps de requête invalide", 400);
    }

    if (!body.missionId || typeof body.amountCents !== "number") {
      return errorResponse(
        "MISSING_PARAMS",
        "missionId et amountCents sont requis",
        400
      );
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const backendUrl = `${API_BASE_URL}/payments/create-intent`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missionId: body.missionId,
          amountCents: body.amountCents,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (networkError) {
      clearTimeout(timeoutId);

      if (networkError instanceof Error && networkError.name === "AbortError") {
        console.error("[PAYMENT_PROXY] Backend timeout");
        return errorResponse(
          "BACKEND_TIMEOUT",
          "Le serveur de paiement n'a pas répondu à temps. Réessayez.",
          504
        );
      }

      console.error("[PAYMENT_PROXY] Backend unreachable:", networkError);
      return errorResponse(
        "BACKEND_UNAVAILABLE",
        "Le service de paiement est temporairement indisponible.",
        502
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Backend returned 501 = endpoint not implemented
    if (response.status === 501 || response.status === 404) {
      return errorResponse(
        "NOT_IMPLEMENTED",
        "Le service de paiement n'est pas encore disponible.",
        501
      );
    }

    // Other backend errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[PAYMENT_PROXY] Backend error:", response.status, errorBody);

      let errorMessage = "Une erreur est survenue lors de la création du paiement.";
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed?.message ?? parsed?.error ?? errorMessage;
      } catch {
        // Keep default message
      }

      return errorResponse("BACKEND_ERROR", errorMessage, 502);
    }

    // Success - parse and validate response
    try {
      const data = await response.json();

      if (!data.clientSecret) {
        console.error("[PAYMENT_PROXY] Missing clientSecret in response");
        return errorResponse(
          "INVALID_RESPONSE",
          "Réponse invalide du serveur de paiement.",
          502
        );
      }

      return successResponse({
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId ?? "",
      });
    } catch (parseError) {
      console.error("[PAYMENT_PROXY] Failed to parse response:", parseError);
      return errorResponse("PARSE_ERROR", "Réponse invalide du serveur.", 502);
    }
  } catch (error) {
    console.error("[PAYMENT_PROXY_ERROR]", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Erreur interne. Réessayez plus tard.",
      500
    );
  }
}

