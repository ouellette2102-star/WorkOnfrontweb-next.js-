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
 * POST /api/auth/register
 * Proxy registration to backend, set httpOnly cookies.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      return NextResponse.json(
        buildBackendErrorBody(data, "Échec de l'inscription", backendRes.status),
        { status: backendRes.status },
      );
    }

    // Tokens returned in body so the client can cache them in localStorage
    // for api-client.ts. httpOnly cookies below back the middleware gate.
    const response = NextResponse.json({
      user: data.user,
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
