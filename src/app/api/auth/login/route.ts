import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * POST /api/auth/login
 * Proxy login to backend, set httpOnly cookies with tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Échec de la connexion" },
        { status: backendRes.status },
      );
    }

    // Return tokens in body so the client (lib/auth.ts) can cache them in
    // localStorage for api-client.ts. The httpOnly cookies below are set
    // for the middleware + RSC server-side gate. Both are sources of truth
    // and must stay in sync — never one without the other.
    const response = NextResponse.json({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    response.cookies.set("workon_token", data.accessToken, COOKIE_OPTIONS);
    response.cookies.set("workon_refresh", data.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 },
    );
  }
}
