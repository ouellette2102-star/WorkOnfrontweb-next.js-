/**
 * API Route: POST /api/reviews
 * Proxy HTTP vers le backend NestJS pour créer une review
 *
 * Contrat de réponse normalisé (PR-20):
 * - { ok: true, data: ReviewResponse }
 * - { ok: false, error: { code: string, message: string } }
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

const FETCH_TIMEOUT_MS = 10000;

// Normalized response helpers
function successResponse<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    // Auth check
    const { userId, getToken } = await auth();

    if (!userId) {
      return errorResponse("UNAUTHENTICATED", "Authentification requise", 401);
    }

    const token = await getToken();
    if (!token) {
      return errorResponse("TOKEN_UNAVAILABLE", "Impossible de recuperer le token", 401);
    }

    // Check API URL
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return errorResponse("API_NOT_CONFIGURED", "API backend non configuree", 503);
    }

    // Parse request body
    let body: { missionId: string; workerId: string; rating: number; comment?: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Corps de requete invalide", 400);
    }

    // Validate payload
    if (!body.missionId || !body.workerId) {
      return errorResponse("MISSING_PARAMS", "missionId et workerId sont requis", 400);
    }

    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return errorResponse("INVALID_RATING", "Rating doit etre entre 1 et 5", 400);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const backendUrl = `${API_BASE_URL}/reviews`;

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
          workerId: body.workerId,
          rating: body.rating,
          comment: body.comment ?? null,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (networkError) {
      clearTimeout(timeoutId);

      if (networkError instanceof Error && networkError.name === "AbortError") {
        return errorResponse("BACKEND_TIMEOUT", "Le serveur n'a pas repondu a temps", 504);
      }

      console.error("[REVIEW_PROXY] Backend unreachable:", networkError);
      return errorResponse("BACKEND_UNAVAILABLE", "Service temporairement indisponible", 502);
    } finally {
      clearTimeout(timeoutId);
    }

    // Backend returned 501 or 404 = not implemented
    if (response.status === 501 || response.status === 404) {
      return errorResponse("NOT_IMPLEMENTED", "Les avis ne sont pas encore disponibles", 501);
    }

    // Backend returned 409 = already reviewed
    if (response.status === 409) {
      return errorResponse("ALREADY_REVIEWED", "Vous avez deja laisse un avis pour cette mission", 409);
    }

    // Other backend errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[REVIEW_PROXY] Backend error:", response.status, errorBody);

      let errorMessage = "Impossible de creer l'avis";
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed?.message ?? parsed?.error ?? errorMessage;
      } catch {
        // Keep default
      }

      return errorResponse("BACKEND_ERROR", errorMessage, 502);
    }

    // Success
    try {
      const data = await response.json();
      return successResponse(data);
    } catch {
      return errorResponse("PARSE_ERROR", "Reponse serveur invalide", 502);
    }
  } catch (error) {
    console.error("[REVIEW_PROXY_ERROR]", error);
    return errorResponse("INTERNAL_ERROR", "Erreur interne", 500);
  }
}

