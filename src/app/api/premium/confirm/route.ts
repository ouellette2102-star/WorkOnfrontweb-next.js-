/**
 * API Route: POST /api/premium/confirm
 * Confirmer une subscription Premium après Stripe Checkout
 *
 * PR-27: Paiement Premium & plans
 *
 * Flow:
 * 1. Recevoir session_id de Stripe
 * 2. Appeler backend pour valider et activer Premium
 * 3. Retourner statut
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

const FETCH_TIMEOUT_MS = 10000;

function successResponse(data: { premium: boolean; tier?: string }) {
  return NextResponse.json({ ok: true, ...data });
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
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
    let body: { sessionId: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Requête invalide", 400);
    }

    if (!body.sessionId) {
      return errorResponse("MISSING_SESSION", "Session ID requis", 400);
    }

    // Check API URL
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return errorResponse("API_NOT_CONFIGURED", "Service indisponible", 503);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const backendUrl = `${API_BASE_URL}/premium/confirm`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: body.sessionId }),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (networkError) {
      clearTimeout(timeoutId);

      if (networkError instanceof Error && networkError.name === "AbortError") {
        return errorResponse("TIMEOUT", "Le serveur n'a pas répondu", 504);
      }

      console.error("[PREMIUM_CONFIRM] Backend unreachable:", networkError);
      return errorResponse("COMING_SOON", "Confirmation en attente", 503);
    } finally {
      clearTimeout(timeoutId);
    }

    // Backend not ready
    if (response.status === 501 || response.status === 404) {
      return errorResponse("COMING_SOON", "Confirmation en attente", 501);
    }

    // Other errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[PREMIUM_CONFIRM] Backend error:", response.status, errorBody);
      return errorResponse("BACKEND_ERROR", "Confirmation en cours", 502);
    }

    // Parse success
    try {
      const data = await response.json();
      return successResponse({
        premium: data.premium ?? true,
        tier: data.tier,
      });
    } catch {
      return errorResponse("PARSE_ERROR", "Réponse invalide", 502);
    }
  } catch (error) {
    console.error("[PREMIUM_CONFIRM_ERROR]", error);
    return errorResponse("INTERNAL_ERROR", "Erreur interne", 500);
  }
}

