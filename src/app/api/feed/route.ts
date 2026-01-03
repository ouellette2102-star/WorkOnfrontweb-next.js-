/**
 * API Route: GET /api/feed
 * Proxy HTTP vers le backend NestJS - ZERO Prisma cote frontend
 *
 * Contrat de réponse normalisé (PR-17):
 * - { ok: true, data: FeedPost[], source: "backend" | "demo" }
 * - { ok: false, data: [], error: { code: string, message: string }, source: "backend" }
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { FeedPost } from "@/types/feed";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

// Demo mode: only in development OR if explicitly enabled
const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.NODE_ENV === "development";

const isProd = process.env.NODE_ENV === "production";

// Timeout for backend requests (10 seconds)
const FETCH_TIMEOUT_MS = 10000;

// Demo data (3 items max, minimal fields)
const DEMO_FEED: FeedPost[] = [
  {
    id: "demo-1",
    workerName: "Alexandra N.",
    role: "Chef traiteur",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=200&h=200&q=80",
    mediaUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    description:
      "Service catering express pour un gala fintech. Menu 100% local, monté en 4h avec l'équipe WorkOn.",
    likeCount: 128,
    isLiked: false,
    location: "Montréal • Vieux-Port",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    workerName: "Moussa Diallo",
    role: "Électricien certifié",
    avatarUrl:
      "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?auto=format&fit=facearea&w=200&h=200&q=80",
    mediaUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    description:
      "Remise aux normes d'un loft Mile-End + ajout éclairage d'ambiance. Réservation via WorkOn en moins de 30 min.",
    likeCount: 96,
    isLiked: false,
    location: "Montréal • Mile-End",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "demo-3",
    workerName: "Camila Ortega",
    role: "Designer d'intérieur",
    avatarUrl:
      "https://images.unsplash.com/photo-1546456073-92b9f0a8d1d6?auto=format&fit=facearea&w=200&h=200&q=80",
    mediaUrl:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    description:
      "Transformation express d'un pop-up store. Moodboard WorkOn + exécution en 48h.",
    likeCount: 211,
    isLiked: false,
    location: "Québec • Saint-Roch",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

// Normalized response helpers
function successResponse(data: FeedPost[], source: "backend" | "demo") {
  return NextResponse.json({
    ok: true,
    data,
    source,
    pagination: {
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
    },
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number
) {
  return NextResponse.json(
    {
      ok: false,
      data: [],
      error: { code, message },
      source: "backend" as const,
    },
    { status }
  );
}

export async function GET(request: Request) {
  try {
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

    // Check if API_URL is configured
    if (!process.env.NEXT_PUBLIC_API_URL) {
      if (isDemoMode && !isProd) {
        // Demo mode: return mock data
        console.log("[FEED_PROXY] Demo mode: returning mock feed");
        return successResponse(DEMO_FEED, "demo");
      }
      return errorResponse(
        "API_NOT_CONFIGURED",
        "L'URL de l'API backend n'est pas configurée",
        502
      );
    }

    const url = new URL(request.url);
    const page = url.searchParams.get("page") ?? "1";
    const limit = url.searchParams.get("limit") ?? "10";

    const backendUrl = `${API_BASE_URL}/feed?page=${page}&limit=${limit}`;

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

      // Check if it's a timeout
      if (networkError instanceof Error && networkError.name === "AbortError") {
        console.error("[FEED_PROXY] Backend timeout after", FETCH_TIMEOUT_MS, "ms");
        if (isDemoMode && !isProd) {
          return successResponse(DEMO_FEED, "demo");
        }
        return errorResponse(
          "BACKEND_TIMEOUT",
          "Le backend n'a pas répondu à temps",
          504
        );
      }

      // Network error - backend not reachable
      console.error("[FEED_PROXY] Backend unreachable:", networkError);
      if (isDemoMode && !isProd) {
        return successResponse(DEMO_FEED, "demo");
      }
      return errorResponse(
        "BACKEND_UNAVAILABLE",
        "Le backend NestJS n'est pas accessible",
        502
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Backend returned 404 or 501 = endpoint not implemented
    if (response.status === 404 || response.status === 501) {
      console.warn("[FEED_PROXY] Backend feed endpoint not implemented");
      if (isDemoMode && !isProd) {
        return successResponse(DEMO_FEED, "demo");
      }
      return errorResponse(
        "NOT_IMPLEMENTED",
        "Le endpoint /feed n'est pas encore implémenté dans le backend",
        501
      );
    }

    // Other backend errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error("[FEED_PROXY] Backend error:", response.status, errorBody);
      if (isDemoMode && !isProd) {
        return successResponse(DEMO_FEED, "demo");
      }
      return errorResponse(
        "BACKEND_ERROR",
        `Erreur backend: ${response.status}`,
        502
      );
    }

    // Success - parse and validate response
    try {
      const data = await response.json();
      // Normalize response shape
      const feedData: FeedPost[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      return successResponse(feedData, "backend");
    } catch (parseError) {
      console.error("[FEED_PROXY] Failed to parse backend response:", parseError);
      if (isDemoMode && !isProd) {
        return successResponse(DEMO_FEED, "demo");
      }
      return errorResponse(
        "PARSE_ERROR",
        "Réponse backend invalide",
        502
      );
    }
  } catch (error) {
    console.error("[FEED_PROXY_ERROR]", error);
    if (isDemoMode && !isProd) {
      return successResponse(DEMO_FEED, "demo");
    }
    return errorResponse(
      "INTERNAL_ERROR",
      "Erreur interne du proxy",
      500
    );
  }
}
