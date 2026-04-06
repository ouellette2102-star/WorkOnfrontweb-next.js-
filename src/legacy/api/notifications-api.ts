/**
 * Client API pour les notifications WorkOn
 */

import type { Notification } from "@/types/notification";

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
    console.error("[WorkOn Notifications API] Request failed", {
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
 * Récupérer les notifications de l'utilisateur courant
 */
export async function fetchNotifications(
  token: string,
  options?: { unreadOnly?: boolean },
): Promise<Notification[]> {
  const query = options?.unreadOnly ? "?unreadOnly=true" : "";
  return authenticatedRequest<Notification[]>(`/notifications${query}`, token, {
    method: "GET",
  });
}

/**
 * Récupérer le compte de notifications non lues
 */
export async function fetchUnreadCount(token: string): Promise<number> {
  const response = await authenticatedRequest<{ count: number }>(
    "/notifications/unread-count",
    token,
    {
      method: "GET",
    },
  );
  return response.count;
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(
  token: string,
  notificationId: string,
): Promise<void> {
  await authenticatedRequest<{ success: boolean }>(
    `/notifications/${notificationId}/read`,
    token,
    {
      method: "PATCH",
    },
  );
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(token: string): Promise<number> {
  const response = await authenticatedRequest<{ count: number }>(
    "/notifications/read-all",
    token,
    {
      method: "PATCH",
    },
  );
  return response.count;
}

