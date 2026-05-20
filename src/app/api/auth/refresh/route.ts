import { NextRequest, NextResponse } from "next/server";
import { buildBackendErrorBody } from "@/lib/backend-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

/**
 * POST /api/auth/refresh
 * Read refresh token from cookie, get new tokens from backend, set new cookies.
 */
export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("workon_refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        buildBackendErrorBody(null, "Pas de refresh token", 401),
        { status: 401 },
      );
    }

    const backendRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      // Clear invalid cookies
      const response = NextResponse.json(
        buildBackendErrorBody(data, "Session expirée", backendRes.status),
        { status: 401 },
      );
      response.cookies.delete("workon_token");
      response.cookies.delete("workon_refresh");
      return response;
    }

    // Return new tokens in body so the client can update its localStorage
    // cache. The httpOnly cookies below stay in sync.
    const response = NextResponse.json({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    response.cookies.set("workon_token", data.accessToken, COOKIE_OPTIONS);
    response.cookies.set("workon_refresh", data.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json(
      buildBackendErrorBody(null, "Erreur serveur", 500),
      { status: 500 },
    );
  }
}
