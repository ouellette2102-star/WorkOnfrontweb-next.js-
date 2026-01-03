/**
 * API Route: GET /api/feed
 * Proxy HTTP vers le backend NestJS - ZERO Prisma cote frontend
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { FeedPost } from "@/types/feed";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

interface BackendFeedResponse {
  data: FeedPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(request: Request) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "TOKEN_UNAVAILABLE" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = url.searchParams.get("page") ?? "1";
    const limit = url.searchParams.get("limit") ?? "10";

    const backendUrl = `${API_BASE_URL}/feed?page=${page}&limit=${limit}`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    } catch (networkError) {
      // Backend not reachable
      console.error("[FEED_PROXY] Backend unreachable:", networkError);
      return NextResponse.json(
        {
          error: "BACKEND_UNAVAILABLE",
          message: "Le backend NestJS n'est pas accessible.",
        },
        { status: 503 }
      );
    }

    // Backend returned 404 = endpoint not implemented
    if (response.status === 404) {
      return NextResponse.json(
        {
          error: "NOT_IMPLEMENTED",
          message:
            "Le endpoint GET /feed n'est pas encore implemente dans le backend NestJS.",
        },
        { status: 501 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "BACKEND_ERROR",
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data: BackendFeedResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[FEED_PROXY_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Erreur interne du proxy" },
      { status: 500 }
    );
  }
}
