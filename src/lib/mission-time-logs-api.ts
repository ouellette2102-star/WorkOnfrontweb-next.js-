/**
 * Client API pour le suivi du temps des missions WorkOn
 */

import type { MissionTimeLog } from "@/types/mission-time-log";

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
    console.error("[WorkOn Time Logs API] Request failed", {
      url,
      status: response.status,
      body: errorBody,
    });

    let errorMessage = `Erreur API ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed?.message ?? parsed?.error ?? errorMessage;
    } catch {
      // Ignore parse errors
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Récupérer les time logs d'une mission
 */
export async function getMissionTimeLogs(
  token: string,
  missionId: string,
): Promise<MissionTimeLog[]> {
  return authenticatedRequest<MissionTimeLog[]>(
    `/missions/${missionId}/time-logs`,
    token,
    {
      method: "GET",
    },
  );
}

/**
 * Enregistrer une arrivée (CHECK_IN)
 */
export async function checkInToMission(
  token: string,
  missionId: string,
  note?: string,
): Promise<MissionTimeLog> {
  return authenticatedRequest<MissionTimeLog>(
    `/missions/${missionId}/time-logs/check-in`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );
}

/**
 * Enregistrer un départ (CHECK_OUT)
 */
export async function checkOutFromMission(
  token: string,
  missionId: string,
  note?: string,
): Promise<MissionTimeLog> {
  return authenticatedRequest<MissionTimeLog>(
    `/missions/${missionId}/time-logs/check-out`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );
}

