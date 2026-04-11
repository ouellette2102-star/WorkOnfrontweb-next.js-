"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  Bell,
  BellOff,
  Briefcase,
  MessageCircle,
  CreditCard,
  Star,
  Shield,
  Calendar,
  Megaphone,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Notifications page — reads from backend GET /notifications.
 *
 * Notification types map to icons/colors:
 *   - MISSION_*    → Briefcase (green)
 *   - MESSAGE_*    → MessageCircle (blue)
 *   - PAYMENT_*    → CreditCard (emerald)
 *   - REVIEW_*     → Star (yellow)
 *   - ACCOUNT_*    → Shield (red)
 *   - BOOKING_*    → Calendar (purple)
 *   - MARKETING_*  → Megaphone (orange)
 */

interface Notification {
  id: string;
  type: string;
  payloadJSON: {
    title?: string;
    body?: string;
    link?: string;
    [key: string]: unknown;
  };
  readAt: string | null;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
  MISSION_NEW_OFFER:      { icon: Briefcase, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  MISSION_OFFER_ACCEPTED: { icon: Briefcase, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  MISSION_STARTED:        { icon: Briefcase, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  MISSION_COMPLETED:      { icon: Briefcase, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  MISSION_CANCELLED:      { icon: Briefcase, color: "text-workon-accent", bgColor: "bg-workon-accent-subtle" },
  MESSAGE_NEW:            { icon: MessageCircle, color: "text-blue-600", bgColor: "bg-blue-50" },
  MESSAGE_UNREAD_REMINDER:{ icon: MessageCircle, color: "text-blue-600", bgColor: "bg-blue-50" },
  PAYMENT_RECEIVED:       { icon: CreditCard, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  PAYMENT_SENT:           { icon: CreditCard, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  PAYMENT_FAILED:         { icon: CreditCard, color: "text-workon-accent", bgColor: "bg-workon-accent-subtle" },
  PAYOUT_PROCESSED:       { icon: CreditCard, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  REVIEW_RECEIVED:        { icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  REVIEW_REMINDER:        { icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  ACCOUNT_SECURITY:       { icon: Shield, color: "text-workon-accent", bgColor: "bg-workon-accent-subtle" },
  ACCOUNT_VERIFICATION:   { icon: Shield, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  BOOKING_REQUEST:        { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-50" },
  BOOKING_CONFIRMED:      { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-50" },
  BOOKING_REMINDER:       { icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-50" },
  BOOKING_CANCELLED:      { icon: Calendar, color: "text-workon-accent", bgColor: "bg-workon-accent-subtle" },
  MARKETING_PROMO:        { icon: Megaphone, color: "text-orange-600", bgColor: "bg-orange-50" },
  MARKETING_NEWS:         { icon: Megaphone, color: "text-orange-600", bgColor: "bg-orange-50" },
};

function getConfig(type: string) {
  return typeConfig[type] ?? { icon: Bell, color: "text-workon-gray", bgColor: "bg-workon-bg-cream" };
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications() as Promise<Notification[]>,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-workon-ink font-[family-name:var(--font-cabinet)]">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-sm text-workon-primary hover:text-workon-primary-hover transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-workon-muted" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-workon-bg-cream flex items-center justify-center mb-4">
            <BellOff className="h-8 w-8 text-workon-muted" />
          </div>
          <p className="text-workon-gray text-sm">Aucune notification pour le moment</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => {
            const config = getConfig(notif.type);
            const Icon = config.icon;
            const isUnread = !notif.readAt;
            const payload = notif.payloadJSON ?? {};
            const title = payload.title ?? notif.type.replace(/_/g, " ").toLowerCase();
            const body = payload.body ?? "";

            return (
              <button
                key={notif.id}
                onClick={() => {
                  if (isUnread) markRead.mutate(notif.id);
                  if (payload.link && typeof window !== "undefined") {
                    window.location.href = payload.link as string;
                  }
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-colors ${
                  isUnread ? "bg-workon-primary-subtle" : "hover:bg-workon-bg-cream"
                }`}
              >
                <div
                  className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${config.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-workon-ink truncate capitalize">
                      {title}
                    </p>
                    {isUnread && (
                      <div className="h-2 w-2 rounded-full bg-workon-primary shrink-0" />
                    )}
                  </div>
                  {body && (
                    <p className="text-xs text-workon-gray mt-0.5 line-clamp-2">{body}</p>
                  )}
                  <p className="text-[10px] text-workon-muted mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
