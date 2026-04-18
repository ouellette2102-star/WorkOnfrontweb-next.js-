"use client";

import { useRouter } from "next/navigation";
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
  FileSignature,
  Heart,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Notifications — reads GET /notifications.
 *
 * Handles both legacy UPPERCASE types (MISSION_NEW_OFFER, PAYMENT_RECEIVED…)
 * and the new lowercase LocalNotification types (contract_received, new_message…).
 *
 * Each notification maps to a deterministic destination URL via resolveActionUrl:
 *   1. payload.link / payload.actionUrl  (explicit backend override)
 *   2. Type + payload-field mapping      (contractId, missionId, conversationId)
 *   3. Fallback route per type family
 */

interface Notification {
  id: string;
  type: string;
  // Legacy shape
  payloadJSON?: {
    title?: string;
    body?: string;
    link?: string;
    actionUrl?: string;
    [key: string]: unknown;
  };
  // LocalNotification shape (inlined title/body, separate payload)
  title?: string;
  body?: string;
  payload?: {
    title?: string;
    body?: string;
    link?: string;
    actionUrl?: string;
    [key: string]: unknown;
  };
  readAt: string | null;
  createdAt: string;
}

type IconStyle = { icon: typeof Bell; color: string; bgColor: string };

const typeConfig: Record<string, IconStyle> = {
  // Legacy UPPERCASE
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

  // New LocalNotification (lowercase)
  contract_received:      { icon: FileSignature, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  contract_signed:        { icon: FileSignature, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  new_message:            { icon: MessageCircle, color: "text-blue-600", bgColor: "bg-blue-50" },
  mission_accepted:       { icon: Briefcase, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  mission_completed:      { icon: Briefcase, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  mission_cancelled:      { icon: Briefcase, color: "text-workon-accent", bgColor: "bg-workon-accent-subtle" },
  offer_received:         { icon: Briefcase, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  offer_accepted:         { icon: Briefcase, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  review_received:        { icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  payout_failed:          { icon: CreditCard, color: "text-workon-accent", bgColor: "bg-workon-accent-subtle" },
  lead_delivered:         { icon: Briefcase, color: "text-workon-primary", bgColor: "bg-workon-primary-subtle" },
  swipe_match:            { icon: Heart, color: "text-pink-600", bgColor: "bg-pink-50" },
};

function getConfig(type: string): IconStyle {
  return typeConfig[type] ?? { icon: Bell, color: "text-workon-gray", bgColor: "bg-workon-bg-cream" };
}

function getPayload(n: Notification): Record<string, unknown> {
  return (n.payload ?? n.payloadJSON ?? {}) as Record<string, unknown>;
}

function getTitle(n: Notification): string {
  const p = getPayload(n);
  return (
    (n.title as string | undefined) ??
    (p.title as string | undefined) ??
    n.type.replace(/_/g, " ").toLowerCase()
  );
}

function getBody(n: Notification): string {
  const p = getPayload(n);
  return (n.body as string | undefined) ?? (p.body as string | undefined) ?? "";
}

function pickString(p: Record<string, unknown>, key: string): string | null {
  const v = p[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Deterministic URL resolver. Priority:
 *   1. Explicit payload.link / payload.actionUrl
 *   2. Type-based routing with payload fields (contractId, missionId, conversationId)
 *   3. Fallback to a sensible list route
 */
function resolveActionUrl(n: Notification): string {
  const p = getPayload(n);

  const explicit = pickString(p, "link") ?? pickString(p, "actionUrl");
  if (explicit) return explicit;

  const contractId = pickString(p, "contractId");
  const missionId = pickString(p, "missionId");
  const conversationId = pickString(p, "conversationId");
  const offerId = pickString(p, "offerId");

  switch (n.type) {
    case "contract_received":
    case "contract_signed":
      return contractId ? `/contracts/${contractId}` : "/contracts";

    case "new_message":
    case "MESSAGE_NEW":
    case "MESSAGE_UNREAD_REMINDER":
      if (conversationId) return `/messages/cv/${conversationId}`;
      if (missionId) return `/messages/${missionId}`;
      return "/messages";

    case "mission_accepted":
    case "mission_completed":
    case "mission_cancelled":
    case "MISSION_OFFER_ACCEPTED":
    case "MISSION_STARTED":
    case "MISSION_COMPLETED":
    case "MISSION_CANCELLED":
      return missionId ? `/missions/${missionId}` : "/missions/mine";

    case "offer_received":
    case "offer_accepted":
    case "MISSION_NEW_OFFER":
      if (missionId) return `/missions/${missionId}`;
      if (offerId) return `/offers/${offerId}`;
      return "/missions/mine";

    case "review_received":
    case "REVIEW_RECEIVED":
    case "REVIEW_REMINDER":
      return "/reviews";

    case "payout_failed":
    case "PAYMENT_FAILED":
    case "PAYMENT_RECEIVED":
    case "PAYMENT_SENT":
    case "PAYOUT_PROCESSED":
      return "/earnings";

    case "BOOKING_REQUEST":
    case "BOOKING_CONFIRMED":
    case "BOOKING_REMINDER":
    case "BOOKING_CANCELLED":
      return "/bookings";

    case "lead_delivered":
      return "/leads/mine";

    case "swipe_match":
      return "/matches";

    case "ACCOUNT_SECURITY":
    case "ACCOUNT_VERIFICATION":
      return "/settings";

    case "MARKETING_PROMO":
    case "MARKETING_NEWS":
      return "/home";

    default:
      return "/home";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
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
            const title = getTitle(notif);
            const body = getBody(notif);

            return (
              <button
                key={notif.id}
                onClick={() => {
                  if (isUnread) markRead.mutate(notif.id);
                  const url = resolveActionUrl(notif);
                  router.push(url);
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
