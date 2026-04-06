/**
 * DEPRECATED: This file is a backward-compatibility shim.
 * All endpoints have been consolidated into api-client.ts.
 * Original archived at: src/legacy/api/notifications-api.ts
 *
 * New code should use: import { api } from "@/lib/api-client"
 */

import { api } from "./api-client";
import type { Notification } from "@/types/notification";

export async function fetchNotifications(
  _token: string,
  options?: { unreadOnly?: boolean },
): Promise<Notification[]> {
  return api.getNotifications(options?.unreadOnly) as Promise<Notification[]>;
}

export async function fetchUnreadCount(_token: string): Promise<number> {
  const result = await api.getNotificationUnreadCount();
  return result.count;
}

export async function markNotificationAsRead(
  _token: string,
  notificationId: string,
): Promise<void> {
  await api.markNotificationRead(notificationId);
}

export async function markAllNotificationsAsRead(_token: string): Promise<number> {
  const result = await api.markAllNotificationsRead();
  return result.count;
}
