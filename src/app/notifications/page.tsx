"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
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
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (authLoading || !isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = getAccessToken();
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
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    const token = getAccessToken();
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
    const token = getAccessToken();
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
        return "bg-blue-500/15 text-blue-300 border border-blue-500/25";
      case NotificationType.MISSION_STATUS_CHANGED:
        return "bg-[#FF4D1C]/15 text-[#FF4D1C] border border-[#FF4D1C]/25";
      case NotificationType.MISSION_TIME_EVENT:
        return "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/25";
      default:
        return "bg-white/5 text-white/60 border border-white/10";
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

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#FF4D1C] border-t-transparent"></div>
          <p className="text-white/70">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
        <div className="max-w-md rounded-3xl border border-[#FF4D1C]/30 bg-[#FF4D1C]/5 p-6 text-center shadow-lg shadow-black/20">
          <p className="mb-4 text-[#FF4D1C]">{error}</p>
          <Button onClick={loadNotifications} variant="hero" size="sm">
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
            <Button onClick={handleMarkAllAsRead} variant="secondary" size="sm">
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Liste des notifications */}
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center shadow-lg shadow-black/20">
            <div className="mb-4 text-6xl">🔔</div>
            <p className="text-lg text-white/80 font-semibold">Aucune notification</p>
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
                className={`w-full rounded-3xl border p-5 text-left transition-all shadow-lg shadow-black/10 hover:-translate-y-0.5 hover:border-[#FF4D1C]/40 ${
                  notification.isRead
                    ? "border-white/10 bg-white/5 backdrop-blur-sm"
                    : "border-[#FF4D1C]/30 bg-gradient-to-br from-[#FF4D1C]/10 via-[#FF4D1C]/5 to-transparent backdrop-blur-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Badge type */}
                  <div
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getNotificationBadgeColor(notification.type)}`}
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
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF4D1C] mt-2 shadow-sm shadow-[#FF4D1C]/40"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lien retour */}
        <div className="mt-8 text-center">
          <Link
            href="/home"
            className="text-sm text-white/70 transition hover:text-[#FF4D1C]"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

