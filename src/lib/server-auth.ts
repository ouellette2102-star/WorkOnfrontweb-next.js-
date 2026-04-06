import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side authentication utilities for WorkOn.
 * Replaces Clerk server-side auth (auth(), currentUser()).
 * Uses the workon_token httpOnly cookie set by the custom JWT system.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api/v1";

export type ServerUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  pictureUrl: string | null;
  role: "worker" | "employer" | "residential_client";
  active: boolean;
};

/**
 * Read the JWT token from the workon_token cookie (server-side).
 * Returns null if no cookie is found.
 */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("workon_token")?.value ?? null;
}

/**
 * Fetch the current user from the backend using the server token.
 * Returns null if not authenticated or if the API call fails.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const token = await getServerToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as ServerUser;
  } catch {
    return null;
  }
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Returns the authenticated user.
 */
export async function requireAuth(): Promise<ServerUser> {
  const token = await getServerToken();
  if (!token) {
    redirect("/login");
  }

  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Require a specific role. Redirects appropriately if role doesn't match.
 */
export async function requireRole(
  role: "worker" | "employer" | "residential_client",
): Promise<ServerUser> {
  const user = await requireAuth();

  if (user.role !== role) {
    if (user.role === "worker") {
      redirect("/worker/dashboard");
    } else if (user.role === "employer") {
      redirect("/employer/dashboard");
    } else {
      redirect("/home");
    }
  }

  return user;
}

/**
 * Shortcut: require worker role.
 */
export async function requireWorker(): Promise<ServerUser> {
  return requireRole("worker");
}

/**
 * Shortcut: require employer role.
 */
export async function requireEmployer(): Promise<ServerUser> {
  return requireRole("employer");
}
