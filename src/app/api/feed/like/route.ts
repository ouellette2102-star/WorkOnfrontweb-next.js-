/**
 * API Route: POST /api/feed/like
 * Proxy HTTP vers le backend NestJS - ZERO Prisma cote frontend
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

const LikeSchema = z.object({
  postId: z.string().min(1),
});

interface LikeResponse {
  postId: string;
  liked: boolean;
  likeCount: number;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — extract token from header or cookie
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("workon_token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    let postId: string;
    try {
      const body = await request.json();
      const parsed = LikeSchema.parse(body);
      postId = parsed.postId;
    } catch {
      return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
    }

    const backendUrl = `${API_BASE_URL}/feed/like`;

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });
    } catch (networkError) {
      console.error("[FEED_LIKE_PROXY] Backend unreachable:", networkError);
      return NextResponse.json(
        {
          error: "BACKEND_UNAVAILABLE",
          message: "Le backend NestJS n'est pas accessible.",
        },
        { status: 503 }
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        {
          error: "NOT_IMPLEMENTED",
          message:
            "Le endpoint POST /feed/like n'est pas encore implemente dans le backend NestJS.",
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

    const data: LikeResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[FEED_LIKE_PROXY_ERROR]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}



