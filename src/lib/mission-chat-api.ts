/**
 * Client API pour le chat des missions WorkOn
 * Appelle le proxy front /api/missions/[id]/messages (PR-23)
 *
 * Contrat normalisé:
 * - { ok: true, data: Message[] | Message, source: "backend" }
 * - { ok: false, data: [], error: { code, message }, source: "proxy" }
 */

import type { Message, CreateMessagePayload } from "@/types/mission-chat";

const FETCH_TIMEOUT_MS = 10000; // 10 seconds client-side timeout

// Normalized API response types
export type ChatMessagesResponse =
  | { ok: true; data: Message[]; source: "backend" }
  | { ok: false; data: []; error: { code: string; message: string }; source: "proxy" };

export type ChatSendResponse =
  | { ok: true; data: Message; source: "backend" }
  | { ok: false; data: []; error: { code: string; message: string }; source: "proxy" };

/**
 * Helper for fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Récupérer tous les messages d'une mission
 * @returns Normalized response with ok/error
 */
export async function getMessagesForMission(
  token: string,
  missionId: string
): Promise<ChatMessagesResponse> {
  try {
    const response = await fetchWithTimeout(
      `/api/missions/${missionId}/messages`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();
    return data as ChatMessagesResponse;
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        data: [],
        error: { code: "TIMEOUT", message: "Le chargement a pris trop de temps" },
        source: "proxy",
      };
    }

    // Network error
    return {
      ok: false,
      data: [],
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Erreur réseau",
      },
      source: "proxy",
    };
  }
}

/**
 * Envoyer un nouveau message dans une mission
 * @returns Normalized response with ok/error
 */
export async function sendMessage(
  token: string,
  missionId: string,
  payload: CreateMessagePayload
): Promise<ChatSendResponse> {
  try {
    const response = await fetchWithTimeout(
      `/api/missions/${missionId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response.json();
    return data as ChatSendResponse;
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        data: [],
        error: { code: "TIMEOUT", message: "L'envoi a pris trop de temps" },
        source: "proxy",
      };
    }

    // Network error
    return {
      ok: false,
      data: [],
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Impossible d'envoyer",
      },
      source: "proxy",
    };
  }
}
