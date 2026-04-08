import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Récupère le profil de l'utilisateur connecté
 * Utilisé dans les Server Components
 */
async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profile/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Garantit que l'utilisateur est authentifié et a un profil
 * Redirige vers /onboarding/role si pas de primaryRole
 */
export async function requireAuthServer(): Promise<UserProfile> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await fetchCurrentProfile();

  if (!profile) {
    // Utilisateur connecté mais pas de profil backend
    redirect("/onboarding/role");
  }

  if (!profile.primaryRole) {
    // Profil existe mais pas de rôle choisi
    redirect("/onboarding/role");
  }

  return profile;
}

/**
 * Garantit que l'utilisateur est un WORKER
 * Redirige vers /employer/dashboard si c'est un employer
 * Redirige vers /onboarding/role si pas de rôle
 */
export async function requireWorker(): Promise<UserProfile> {
  const profile = await requireAuthServer();

  if (profile.primaryRole === "EMPLOYER") {
    redirect("/employer/dashboard");
  }

  if (profile.primaryRole !== "WORKER") {
    redirect("/onboarding/role");
  }

  return profile;
}

/**
 * Garantit que l'utilisateur est un EMPLOYER
 * Redirige vers /worker/dashboard si c'est un worker
 * Redirige vers /onboarding/role si pas de rôle
 */
export async function requireEmployer(): Promise<UserProfile> {
  const profile = await requireAuthServer();

  if (profile.primaryRole === "WORKER") {
    redirect("/worker/dashboard");
  }

  if (profile.primaryRole !== "EMPLOYER" && profile.primaryRole !== "ADMIN") {
    redirect("/onboarding/role");
  }

  return profile;
}

