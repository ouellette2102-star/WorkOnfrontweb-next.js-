/**
 * Auth helpers for server components.
 * Delegates to server-auth.ts (JWT cookie-based).
 *
 * Legacy Clerk version archived at: src/legacy/clerk/auth-helpers-clerk.ts
 */

import {
  requireAuth,
  requireWorker as serverRequireWorker,
  requireEmployer as serverRequireEmployer,
  getServerUser,
  getServerToken,
  type ServerUser,
} from "./server-auth";

// Re-export types for backward compatibility
export type ProfileRole = "WORKER" | "EMPLOYER" | "ADMIN" | "CLIENT_RESIDENTIAL";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  primaryRole: ProfileRole;
  isWorker: boolean;
  isEmployer: boolean;
  isClientResidential: boolean;
};

/**
 * Map ServerUser to the legacy UserProfile shape expected by existing components.
 */
function toUserProfile(user: ServerUser): UserProfile {
  const roleMap: Record<string, ProfileRole> = {
    worker: "WORKER",
    employer: "EMPLOYER",
    residential_client: "CLIENT_RESIDENTIAL",
  };

  return {
    id: user.id,
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    phone: user.phone ?? "",
    city: user.city ?? "",
    primaryRole: roleMap[user.role] ?? "WORKER",
    isWorker: user.role === "worker",
    isEmployer: user.role === "employer",
    isClientResidential: user.role === "residential_client",
  };
}

/**
 * Require authentication and return a UserProfile.
 * Redirects to /login if not authenticated.
 */
export async function requireAuthServer(): Promise<UserProfile> {
  const user = await requireAuth();
  return toUserProfile(user);
}

/**
 * Require worker role. Redirects to employer dashboard if wrong role.
 */
export async function requireWorker(): Promise<UserProfile> {
  const user = await serverRequireWorker();
  return toUserProfile(user);
}

/**
 * Require employer role. Redirects to worker dashboard if wrong role.
 */
export async function requireEmployer(): Promise<UserProfile> {
  const user = await serverRequireEmployer();
  return toUserProfile(user);
}

/**
 * Get current profile without requiring auth (returns null if not authenticated).
 */
export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const user = await getServerUser();
  if (!user) return null;
  return toUserProfile(user);
}

// Re-export for convenience
export { getServerToken, getServerUser };
