import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/**
 * GET /api/auth/me
 * Proxy current user request using httpOnly cookie token.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("workon_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const backendRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!backendRes.ok) {
      // If 401, try to refresh
      if (backendRes.status === 401) {
        const refreshToken = req.cookies.get("workon_refresh")?.value;
        if (refreshToken) {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            // Retry with new token
            const retryRes = await fetch(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${refreshData.accessToken}` },
              cache: "no-store",
            });

            if (retryRes.ok) {
              const user = await retryRes.json();
              const response = NextResponse.json(user);
              response.cookies.set("workon_token", refreshData.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
              });
              response.cookies.set("workon_refresh", refreshData.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
              });
              return response;
            }
          }
        }

        // Refresh failed — clear cookies
        const response = NextResponse.json(
          { message: "Session expirée" },
          { status: 401 },
        );
        response.cookies.delete("workon_token");
        response.cookies.delete("workon_refresh");
        return response;
      }

      return NextResponse.json(
        { message: "Erreur serveur" },
        { status: backendRes.status },
      );
    }

    const user = await backendRes.json();
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
