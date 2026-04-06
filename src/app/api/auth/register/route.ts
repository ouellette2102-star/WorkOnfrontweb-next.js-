import { NextRequest, NextResponse } from "next/server";

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

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Échec de l'inscription" },
        { status: backendRes.status },
      );
    }

    const response = NextResponse.json({ user: data.user });

    response.cookies.set("workon_token", data.accessToken, COOKIE_OPTIONS);
    response.cookies.set("workon_refresh", data.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
