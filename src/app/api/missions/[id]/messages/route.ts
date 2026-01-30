/**
 * API Routes: GET/POST /api/missions/[id]/messages
 * Proxy HTTP vers le backend NestJS pour le chat mission
 *
 * Contrat de réponse normalisé (PR-23):
 * - { ok: true, data: Message[], source: "backend" }
 * - { ok: false, data: [], error: { code: string, message: string }, source: "proxy" }
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { Message } from "@/types/mission-chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

const FETCH_TIMEOUT_MS = 10000; // 10 seconds

// Normalized response types
type ChatSuccessResponse = {
  ok: true;
  data: Message[];
  source: "backend";
};

type ChatErrorResponse = {
  ok: false;
  data: [];
  error: { code: string; message: string };
  source: "proxy";
};

type ChatApiResponse = ChatSuccessResponse | ChatErrorResponse;

// Response helpers
function successResponse(data: Message[]): NextResponse<ChatSuccessResponse> {
  return NextResponse.json({
    ok: true,
    data,
    source: "backend",
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number
): NextResponse<ChatErrorResponse> {
  return NextResponse.json(
    {
      ok: false,
      data: [],
      error: { code, message },
      source: "proxy",
    },
    { status }
  );
}

// Map HTTP status to error codes
function getErrorCode(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return "AUTH_REQUIRED";
    case 404:
      return "NOT_FOUND";
    case 501:
      return "NOT_IMPLEMENTED";
    default:
      return status >= 500 ? "BACKEND_ERROR" : "REQUEST_ERROR";
  }
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/missions/[id]/messages
 * Récupérer les messages d'une mission
 */
export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ChatApiResponse>> {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return errorResponse("AUTH_REQUIRED", "Authentification requise", 401);
    }

    const token = await getToken();
    if (!token) {
      return errorResponse("TOKEN_UNAVAILABLE", "Token non disponible", 401);
    }

    const { id: missionId } = await context.params;

    if (!missionId) {
      return errorResponse("INVALID_PARAMS", "ID de mission requis", 400);
    }

    // Check API URL
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return errorResponse("API_NOT_CONFIGURED", "API backend non configuree", 503);
    }

    const backendUrl = `${API_BASE_URL}/missions/${missionId}/messages`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (networkError) {
      clearTimeout(timeoutId);

      if (networkError instanceof Error && networkError.name === "AbortError") {
        return errorResponse("TIMEOUT", "Le serveur n'a pas repondu a temps", 504);
      }

      console.error("[CHAT_PROXY] Backend unreachable:", networkError);
      return errorResponse("NETWORK_ERROR", "Service temporairement indisponible", 502);
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle backend errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const code = getErrorCode(response.status);

      let message = "Erreur du serveur";
      if (response.status === 501 || response.status === 404) {
        message = "Le chat n'est pas encore disponible pour cette mission";
      } else {
        try {
          const parsed = JSON.parse(errorBody);
          message = parsed?.message ?? parsed?.error ?? message;
        } catch {
          // Keep default
        }
      }

      console.error("[CHAT_PROXY] Backend error:", response.status, code);
      return errorResponse(code, message, response.status >= 500 ? 502 : response.status);
    }

    // Parse response
    try {
      const data = await response.json();
      const messages: Message[] = Array.isArray(data) ? data : data?.data ?? [];
      return successResponse(messages);
    } catch {
      return errorResponse("PARSE_ERROR", "Reponse serveur invalide", 502);
    }
  } catch (error) {
    console.error("[CHAT_PROXY_ERROR]", error);
    return errorResponse("INTERNAL_ERROR", "Erreur interne", 500);
  }
}

/**
 * POST /api/missions/[id]/messages
 * Envoyer un nouveau message
 */
export async function POST(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ChatApiResponse | { ok: true; data: Message; source: "backend" }>> {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return errorResponse("AUTH_REQUIRED", "Authentification requise", 401);
    }

    const token = await getToken();
    if (!token) {
      return errorResponse("TOKEN_UNAVAILABLE", "Token non disponible", 401);
    }

    const { id: missionId } = await context.params;

    if (!missionId) {
      return errorResponse("INVALID_PARAMS", "ID de mission requis", 400);
    }

    // Parse request body
    let body: { content: string };
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Corps de requete invalide", 400);
    }

    if (!body.content?.trim()) {
      return errorResponse("INVALID_CONTENT", "Le message ne peut pas etre vide", 400);
    }

    // Check API URL
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return errorResponse("API_NOT_CONFIGURED", "API backend non configuree", 503);
    }

    const backendUrl = `${API_BASE_URL}/missions/${missionId}/messages`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: body.content.trim() }),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (networkError) {
      clearTimeout(timeoutId);

      if (networkError instanceof Error && networkError.name === "AbortError") {
        return errorResponse("TIMEOUT", "Le serveur n'a pas repondu a temps", 504);
      }

      console.error("[CHAT_PROXY] Backend unreachable:", networkError);
      return errorResponse("NETWORK_ERROR", "Impossible d'envoyer le message", 502);
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle backend errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const code = getErrorCode(response.status);

      let message = "Erreur lors de l'envoi";
      if (response.status === 501 || response.status === 404) {
        message = "L'envoi de messages n'est pas disponible";
      } else {
        try {
          const parsed = JSON.parse(errorBody);
          message = parsed?.message ?? parsed?.error ?? message;
        } catch {
          // Keep default
        }
      }

      console.error("[CHAT_PROXY] Send error:", response.status, code);
      return errorResponse(code, message, response.status >= 500 ? 502 : response.status);
    }

    // Parse response
    try {
      const data: Message = await response.json();
      return NextResponse.json({
        ok: true,
        data,
        source: "backend" as const,
      });
    } catch {
      return errorResponse("PARSE_ERROR", "Reponse serveur invalide", 502);
    }
  } catch (error) {
    console.error("[CHAT_PROXY_ERROR]", error);
    return errorResponse("INTERNAL_ERROR", "Erreur interne", 500);
  }
}



