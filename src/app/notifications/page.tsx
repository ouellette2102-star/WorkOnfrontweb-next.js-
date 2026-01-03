"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notifications-api";
import type { Notification } from "@/types/notification";
import { NotificationType } from "@/types/notification";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Impossible de récupérer le token");
        return;
      }

      const data = await fetchNotifications(token);
      setNotifications(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des notifications",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    const token = await getToken();
    if (!token) return;

    // Marquer comme lue
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(token, notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Naviguer vers la destination appropriée selon le type et le statut
    if (notification.type === NotificationType.NEW_MESSAGE) {
      router.push(`/missions/${notification.missionId}/chat`);
    } else if (notification.type === NotificationType.MISSION_STATUS_CHANGED) {
      const status = notification.statusAfter;
      // Si terminée, aller vers le paiement/évaluation
      if (status === "COMPLETED") {
        router.push(`/missions/${notification.missionId}/pay`);
      } else {
        // Sinon, aller vers le détail de la mission
        router.push(`/missions/${notification.missionId}`);
      }
    } else if (notification.type === NotificationType.MISSION_TIME_EVENT) {
      router.push(`/missions/${notification.missionId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      await markAllNotificationsAsRead(token);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationText = (notification: Notification): string => {
    const missionTitle = notification.mission?.title ?? "une mission";

    if (notification.type === NotificationType.NEW_MESSAGE) {
      return `💬 Nouveau message sur "${missionTitle}"`;
    }

    if (notification.type === NotificationType.MISSION_STATUS_CHANGED) {
      const status = notification.statusAfter;
      if (status === "COMPLETED") {
        return `✅ "${missionTitle}" est terminée — laissez un avis`;
      }
      if (status === "RESERVED") {
        return `🎯 "${missionTitle}" a été réservée`;
      }
      if (status === "IN_PROGRESS") {
        return `🚀 "${missionTitle}" est en cours`;
      }
      if (status === "CANCELLED") {
        return `❌ "${missionTitle}" a été annulée`;
      }
      return `📋 "${missionTitle}" : ${notification.statusBefore ?? "?"} → ${notification.statusAfter ?? "?"}`;
    }

    if (notification.type === NotificationType.MISSION_TIME_EVENT) {
      const eventType = notification.statusBefore;
      if (eventType === "CHECK_IN") {
        return `⏰ Le worker s'est enregistré sur "${missionTitle}"`;
      } else if (eventType === "CHECK_OUT") {
        return `⏱️ Le worker a terminé sur "${missionTitle}"`;
      }
    }

    return "📌 Notification";
  };

  const getNotificationBadgeColor = (
    type: NotificationType,
  ): string => {
    switch (type) {
      case NotificationType.NEW_MESSAGE:
        return "bg-blue-600";
      case NotificationType.MISSION_STATUS_CHANGED:
        return "bg-purple-600";
      case NotificationType.MISSION_TIME_EVENT:
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  const getNotificationBadgeLabel = (
    type: NotificationType,
  ): string => {
    switch (type) {
      case NotificationType.NEW_MESSAGE:
        return "Message";
      case NotificationType.MISSION_STATUS_CHANGED:
        return "Statut";
      case NotificationType.MISSION_TIME_EVENT:
        return "Temps";
      default:
        return "Info";
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
          <p className="text-white/70">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="mb-4 text-red-400">{error}</p>
          <Button
            onClick={loadNotifications}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-2 text-sm text-white/70">
                {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue
                {unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Liste des notifications */}
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="mb-4 text-6xl">🔔</div>
            <p className="text-lg text-white/70">Aucune notification</p>
            <p className="mt-2 text-sm text-white/50">
              Toutes vos notifications apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full rounded-2xl border p-4 text-left transition hover:border-red-500/50 ${
                  notification.isRead
                    ? "border-white/10 bg-white/5"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Badge type */}
                  <div
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white ${getNotificationBadgeColor(notification.type)}`}
                  >
                    {getNotificationBadgeLabel(notification.type)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      {getNotificationText(notification)}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: frCA,
                      })}
                    </p>
                  </div>

                  {/* Indicateur non lu */}
                  {!notification.isRead && (
                    <div className="h-3 w-3 shrink-0 rounded-full bg-red-600"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lien retour */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-white/70 transition hover:text-red-400"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

