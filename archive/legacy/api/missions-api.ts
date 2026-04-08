/**
 * Client API pour les missions WorkOn
 * Toutes les requêtes nécessitent un token Clerk valide
 *
 * PR-C2: Détection CONSENT_REQUIRED sur les endpoints protégés
 */

import type {
  Mission,
  CreateMissionPayload,
  ListMissionsFilters,
  UpdateMissionStatusPayload,
  MissionFeedItem,
  MissionFeedFilters,
} from "@/types/mission";
import {
  isConsentRequiredError,
  createConsentRequiredError,
  type ApiError,
} from "./api-consent-handler";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api/v1";

/**
 * Helper générique pour les requêtes authentifiées
 */
async function authenticatedRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  // Debug log temporaire - vérifier le token
  const tokenPreview = token ? token.substring(0, 20) + "..." : "MISSING";
  console.log(`[Missions API] Calling ${init?.method || "GET"} ${url} with token: ${tokenPreview}`);

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[WorkOn Missions API] Request failed", {
      url,
      method: init?.method || "GET",
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    // Essayer d'extraire un message d'erreur du backend
    let errorMessage = `Erreur API ${response.status}`;
    let errorData: Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(errorBody);
      errorData = parsed;
      errorMessage = parsed?.message ?? parsed?.error ?? errorMessage;

      // PR-C2: Détecter CONSENT_REQUIRED (403)
      if (response.status === 403 && parsed?.error === "CONSENT_REQUIRED") {
        throw createConsentRequiredError(parsed.missing);
      }
    } catch (e) {
      // Re-throw CONSENT_REQUIRED errors
      if (isConsentRequiredError(e)) {
        throw e;
      }
      // Si le body n'est pas du JSON, utiliser le texte brut s'il est court
      if (errorBody && errorBody.length < 200) {
        errorMessage = errorBody;
      }
    }

    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  console.log(`[Missions API] Success: ${init?.method || "GET"} ${url} - ${response.status}`);
  return response.json() as Promise<T>;
}

/**
 * Créer une nouvelle mission (EMPLOYER uniquement)
 */
export async function createMission(
  token: string,
  payload: CreateMissionPayload,
): Promise<Mission> {
  return authenticatedRequest<Mission>("/missions", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Lister les missions créées par l'employeur courant
 */
export async function getMyMissions(token: string): Promise<Mission[]> {
  return authenticatedRequest<Mission[]>("/missions/mine", token, {
    method: "GET",
  });
}

/**
 * Lister toutes les missions du worker courant (RESERVED, IN_PROGRESS, COMPLETED)
 */
export async function getWorkerMissions(token: string): Promise<Mission[]> {
  return authenticatedRequest<Mission[]>("/missions/worker/mine", token, {
    method: "GET",
  });
}

/**
 * Lister les missions disponibles (WORKER)
 */
export async function getAvailableMissions(
  token: string,
  filters?: ListMissionsFilters,
): Promise<Mission[]> {
  const queryParams = new URLSearchParams();
  if (filters?.city) queryParams.set("city", filters.city);
  if (filters?.category) queryParams.set("category", filters.category);

  const queryString = queryParams.toString();
  const path = `/missions/available${queryString ? `?${queryString}` : ""}`;

  return authenticatedRequest<Mission[]>(path, token, {
    method: "GET",
  });
}

/**
 * Récupérer une mission par ID
 */
export async function getMissionById(
  token: string,
  missionId: string,
): Promise<Mission> {
  return authenticatedRequest<Mission>(`/missions/${missionId}`, token, {
    method: "GET",
  });
}

/**
 * Mettre à jour le statut d'une mission (EMPLOYER uniquement)
 */
export async function updateMissionStatus(
  token: string,
  missionId: string,
  payload: UpdateMissionStatusPayload,
): Promise<Mission> {
  return authenticatedRequest<Mission>(
    `/missions/${missionId}/status`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * Réserver une mission (WORKER uniquement)
 * Attache le worker courant à la mission et change le statut de CREATED -> RESERVED
 */
export async function reserveMission(
  token: string,
  missionId: string,
): Promise<Mission> {
  return authenticatedRequest<Mission>(`/missions/${missionId}/reserve`, token, {
    method: "POST",
  });
}

/**
 * Récupérer le feed de missions avec distance calculée (WORKER uniquement)
 * Permet de filtrer par catégorie, ville, distance max et position GPS
 */
export async function getMissionFeed(
  token: string,
  filters?: MissionFeedFilters,
): Promise<MissionFeedItem[]> {
  const queryParams = new URLSearchParams();
  
  if (filters?.category) queryParams.set("category", filters.category);
  if (filters?.city) queryParams.set("city", filters.city);
  if (filters?.latitude !== undefined) queryParams.set("latitude", filters.latitude.toString());
  if (filters?.longitude !== undefined) queryParams.set("longitude", filters.longitude.toString());
  if (filters?.maxDistance !== undefined) queryParams.set("maxDistance", filters.maxDistance.toString());

  const queryString = queryParams.toString();
  const path = `/missions/feed${queryString ? `?${queryString}` : ""}`;

  return authenticatedRequest<MissionFeedItem[]>(path, token, {
    method: "GET",
  });
}

