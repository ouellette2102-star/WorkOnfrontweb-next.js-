import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clear all auth cookies.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete("workon_token");
  response.cookies.delete("workon_refresh");

  return response;
}
