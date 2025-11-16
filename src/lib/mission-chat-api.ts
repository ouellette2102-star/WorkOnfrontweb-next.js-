/**
 * Client API pour le chat des missions WorkOn
 */

import type { Message, CreateMessagePayload } from "@/types/mission-chat";

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
    console.error("[WorkOn Chat API] Request failed", {
      url,
      status: response.status,
      body: errorBody,
    });

    // Essayer d'extraire un message d'erreur du backend
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
 * Récupérer tous les messages d'une mission
 */
export async function getMessagesForMission(
  token: string,
  missionId: string,
): Promise<Message[]> {
  return authenticatedRequest<Message[]>(
    `/missions/${missionId}/messages`,
    token,
    {
      method: "GET",
    },
  );
}

/**
 * Envoyer un nouveau message dans une mission
 */
export async function sendMessage(
  token: string,
  missionId: string,
  payload: CreateMessagePayload,
): Promise<Message> {
  return authenticatedRequest<Message>(
    `/missions/${missionId}/messages`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

