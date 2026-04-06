/**
 * Server-side profile fetching for WorkOn.
 * Uses JWT cookie auth instead of Clerk.
 *
 * Legacy Clerk version archived at: src/legacy/clerk/get-profile-clerk.ts
 */

import { getServerToken } from "./server-auth";

export type ProfileSnapshot = {
  primaryRole: string;
  fullName?: string;
  phone?: string;
  city?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api/v1";

/**
 * Get the current user profile from the backend (server-side).
 * Uses the JWT cookie token instead of Clerk getToken().
 */
export async function getCurrentProfile(
  _userId?: string | undefined | null,
): Promise<ProfileSnapshot | null> {
  const token = await getServerToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      primaryRole: data.role?.toUpperCase() ?? "",
      fullName: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || undefined,
      phone: data.phone ?? undefined,
      city: data.city ?? undefined,
    };
  } catch {
    return null;
  }
}
