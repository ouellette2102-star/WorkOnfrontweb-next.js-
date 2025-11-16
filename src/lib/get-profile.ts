import { auth } from "@clerk/nextjs/server";

/**
 * URL de base de l'API backend WorkOn.
 * On la force en dur pour éviter tous les problèmes de NEXT_PUBLIC_API_URL / Invalid URL.
 */
const API_BASE_URL = "http://localhost:3001/api/v1";
const PROFILE_ENDPOINT = `${API_BASE_URL}/profile/me`;

type ProfileSnapshot = {
  primaryRole: string;
  fullName?: string;
  phone?: string;
  city?: string;
};

type MaybePromise<T> = T | Promise<T>;

function isPromise<T>(value: MaybePromise<T>): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<T>).then === "function"
  );
}

/**
 * Récupère le token Clerk côté serveur via auth()
 */
async function getSessionToken(): Promise<string | null> {
  const authResultCandidate = auth();
  const authResult = isPromise(authResultCandidate)
    ? await authResultCandidate
    : authResultCandidate;

  if (!authResult || typeof authResult.getToken !== "function") {
    console.error(
      "[Clerk] auth().getToken est indisponible dans ce contexte serveur",
    );
    return null;
  }

  try {
    const token = await authResult.getToken();
    return token ?? null;
  } catch (error) {
    console.error("[Clerk] Échec lors de l'appel getToken()", error);
    return null;
  }
}

/**
 * Va chercher le profil courant dans le backend WorkOn
 */
export async function getCurrentProfile(
  clerkId: string | undefined | null,
): Promise<ProfileSnapshot | null> {
  if (!clerkId) {
    return null;
  }

  const token = await getSessionToken();

  if (!token) {
    console.error(
      "[WorkOn] Aucun token Clerk disponible pour l’appel /profile/me",
    );
    return null;
  }

  const response = await fetch(PROFILE_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const profile = (await response.json()) as ProfileSnapshot;
  return profile;
}
