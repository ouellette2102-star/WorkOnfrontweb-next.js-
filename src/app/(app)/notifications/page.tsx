"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  ArrowRight,
  Bell,
  BellOff,
  Briefcase,
  Clock3,
  MessageCircle,
  CreditCard,
  Star,
  Shield,
  ShieldCheck,
  Calendar,
  Megaphone,
  FileSignature,
  Heart,
  CheckCheck,
  Loader2,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  // Top-level actionUrl from LocalNotification.actionUrl column.
  // The BE now sets this for messages, leads, offers, contracts, swipe
  // matches; routing here always wins over payload-derived fallbacks.
  actionUrl?: string | null;
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

  // Invoice-review loop (post-payment bilateral acceptance + escrow).
  // Before this file change these 4 types fell back to the grey Bell,
  // making the most important action-required notifications visually
  // indistinguishable from marketing.
  mission_completed_pay_now: { icon: CreditCard, color: "text-amber-600", bgColor: "bg-amber-50" },
  invoice_review_pending:    { icon: FileSignature, color: "text-amber-600", bgColor: "bg-amber-50" },
  invoice_disputed:          { icon: Shield, color: "text-red-600", bgColor: "bg-red-50" },
  escrow_released:           { icon: CreditCard, color: "text-emerald-600", bgColor: "bg-emerald-50" },
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

  // Top-level `actionUrl` from LocalNotification.actionUrl column wins
  // over everything — the backend sets this explicitly per call site
  // (messages → /messages/:id, leads → /leads/mine, offers → /offers/:id,
  // contracts → /contracts/:id, swipe match → /matches).
  if (typeof n.actionUrl === "string" && n.actionUrl.length > 0) {
    return n.actionUrl;
  }

  // Explicit URL fields in the payload come next. `reviewUrl` is what
  // the invoice flow emits on the backend (see invoice.service.ts
  // createLocalNotification calls for invoice_review_pending /
  // invoice_disputed / escrow_released). Without this line the 4
  // invoice-flow notifications all fell through to the default `/home`
  // cul-de-sac even though they had a perfectly valid deep-link.
  const explicit =
    pickString(p, "link") ??
    pickString(p, "actionUrl") ??
    pickString(p, "reviewUrl");
  if (explicit) return explicit;

  const contractId = pickString(p, "contractId");
  const missionId = pickString(p, "missionId");
  const conversationId = pickString(p, "conversationId");
  const offerId = pickString(p, "offerId");
  const invoiceId = pickString(p, "invoiceId");

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
    case "mission_completed_pay_now":
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

    // Invoice-review loop (post-escrow bilateral acceptance).
    // BE always ships `invoiceId` + `reviewUrl` in the payload; the
    // `reviewUrl` short-circuit above handles the happy path. These
    // case arms are the safety net when payload shape drifts.
    case "invoice_review_pending":
    case "invoice_disputed":
      return invoiceId ? `/invoices/${invoiceId}/review` : "/invoices";

    case "escrow_released":
      // Worker-side confirmation. Land them on /earnings where the
      // payout now shows as "Versé" — more useful than the invoice page.
      return "/earnings";

    case "payout_failed":
      // Always a Stripe Connect issue on the worker side — the action
      // they need to take is in /worker/payments, not /earnings.
      return "/worker/payments";

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

type NotificationBucket = "priority" | "money" | "operations" | "history";

const bucketMeta: Record<
  NotificationBucket,
  { eyebrow: string; title: string; description: string }
> = {
  priority: {
    eyebrow: "A traiter",
    title: "Priorite immediate",
    description: "Elements non lus ou sensibles qui peuvent bloquer une mission.",
  },
  money: {
    eyebrow: "Confiance",
    title: "Contrats et paiements",
    description: "Factures, depot, litige, verification et mouvements d'argent.",
  },
  operations: {
    eyebrow: "Execution",
    title: "Missions, messages et matchs",
    description: "Activite qui fait avancer le travail terrain.",
  },
  history: {
    eyebrow: "Historique",
    title: "Mises a jour",
    description: "Informations conservees pour suivi et reference.",
  },
};

function getNotificationBucket(n: Notification): NotificationBucket {
  if (!n.readAt) return "priority";

  const type = n.type.toLowerCase();
  if (
    type.includes("payment") ||
    type.includes("payout") ||
    type.includes("invoice") ||
    type.includes("escrow") ||
    type.includes("contract") ||
    type.includes("dispute") ||
    type.includes("security") ||
    type.includes("verification")
  ) {
    return "money";
  }

  if (
    type.includes("mission") ||
    type.includes("offer") ||
    type.includes("message") ||
    type.includes("booking") ||
    type.includes("lead") ||
    type.includes("swipe")
  ) {
    return "operations";
  }

  return "history";
}

function getActionLabel(n: Notification): string {
  const type = n.type.toLowerCase();
  if (type.includes("payment") || type.includes("invoice") || type.includes("escrow")) {
    return "Voir le paiement";
  }
  if (type.includes("contract")) return "Voir le contrat";
  if (type.includes("message")) return "Ouvrir le fil";
  if (type.includes("offer")) return "Voir l'offre";
  if (type.includes("booking")) return "Voir reservation";
  if (type.includes("mission")) return "Voir mission";
  if (type.includes("lead")) return "Voir le lead";
  if (type.includes("swipe")) return "Voir le match";
  return "Ouvrir";
}

function buildSections(notifications: Notification[]) {
  const buckets: Record<NotificationBucket, Notification[]> = {
    priority: [],
    money: [],
    operations: [],
    history: [],
  };

  notifications.forEach((notification) => {
    buckets[getNotificationBucket(notification)].push(notification);
  });

  return (Object.keys(buckets) as NotificationBucket[])
    .map((bucket) => ({
      bucket,
      meta: bucketMeta[bucket],
      items: buckets[bucket],
    }))
    .filter((section) => section.items.length > 0);
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
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
  const safeNotifications = notifications ?? [];
  const sections = buildSections(safeNotifications);
  const actionRequiredCount = safeNotifications.filter(
    (n) => getNotificationBucket(n) === "priority",
  ).length;
  const moneyCount = safeNotifications.filter(
    (n) => getNotificationBucket(n) === "money",
  ).length;

  const openNotification = (notification: Notification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    router.push(resolveActionUrl(notification));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 pb-10">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15">
        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <Bell className="h-3.5 w-3.5 text-workon-gold" />
                Centre de signal
              </div>
              <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white">
                Notifications
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                Les signaux sont regroupes par importance pour savoir quoi faire
                maintenant, quoi proteger et quoi suivre.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="hidden shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream disabled:opacity-50 sm:inline-flex"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SignalMetric label="Non lues" value={unreadCount} />
            <SignalMetric label="Priorite" value={actionRequiredCount} />
            <SignalMetric label="Argent" value={moneyCount} />
          </div>
        </div>
      </header>

      {isLoading ? (
        <NotificationState
          icon={Loader2}
          title="Chargement des signaux"
          text="On recupere les actions, messages et paiements recents."
          spinning
        />
      ) : isError ? (
        <NotificationState
          icon={TriangleAlert}
          title="Impossible de charger les notifications"
          text="Verifiez votre connexion et reessayez."
          tone="danger"
        >
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-workon-border bg-white px-4 py-2 text-sm font-bold text-workon-ink transition hover:bg-workon-bg-cream disabled:opacity-60"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Reessayer
          </button>
        </NotificationState>
      ) : safeNotifications.length === 0 ? (
        <NotificationState
          icon={BellOff}
          title="Aucune notification pour le moment"
          text="Les prochains messages, offres, contrats et paiements apparaitront ici."
        />
      ) : (
        <div className="mt-4 space-y-5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-workon-border bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream disabled:opacity-50 sm:hidden"
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Tout marquer lu
            </button>
          )}

          {sections.map((section) => (
            <NotificationSection
              key={section.bucket}
              meta={section.meta}
              items={section.items}
              onOpen={openNotification}
              pendingId={markRead.isPending ? markRead.variables : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SignalMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function NotificationSection({
  meta,
  items,
  onOpen,
  pendingId,
}: {
  meta: { eyebrow: string; title: string; description: string };
  items: Notification[];
  onOpen: (notification: Notification) => void;
  pendingId?: string;
}) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
          {meta.eyebrow}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-cabinet)] text-lg font-black text-workon-ink">
              {meta.title}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-workon-muted">
              {meta.description}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-workon-border bg-white px-2.5 py-1 text-[10px] font-bold text-workon-stone">
            {items.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onOpen={onOpen}
            isPending={pendingId === notification.id}
          />
        ))}
      </div>
    </section>
  );
}

function NotificationCard({
  notification,
  onOpen,
  isPending,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  isPending: boolean;
}) {
  const config = getConfig(notification.type);
  const Icon = config.icon;
  const isUnread = !notification.readAt;
  const title = getTitle(notification);
  const body = getBody(notification);
  const bucket = getNotificationBucket(notification);
  const actionLabel = getActionLabel(notification);

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "group w-full overflow-hidden rounded-[24px] border bg-workon-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(27,26,24,0.10)]",
        isUnread ? "border-workon-copper/30 ring-1 ring-workon-copper/10" : "border-workon-line",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.bgColor}`}>
          {isPending ? (
            <Loader2 className={`h-5 w-5 animate-spin ${config.color}`} />
          ) : (
            <Icon className={`h-5 w-5 ${config.color}`} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-black capitalize text-workon-ink">
                  {title}
                </p>
                {isUnread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-workon-copper" />
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-workon-stone">
                <Clock3 className="h-3 w-3" />
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </div>

            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                bucket === "priority"
                  ? "border-workon-copper/30 bg-workon-copper/10 text-workon-copper"
                  : bucket === "money"
                    ? "border-workon-trust-green/25 bg-workon-trust-green/10 text-workon-trust-green"
                    : "border-workon-border bg-white text-workon-stone",
              )}
            >
              {bucketMeta[bucket].eyebrow}
            </span>
          </div>

          {body && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-workon-gray">
              {body}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-workon-border bg-white px-2.5 py-1 text-[10px] font-bold text-workon-stone">
              <ShieldCheck className="h-3 w-3 text-workon-trust-green" />
              Trace conservee
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-workon-primary opacity-80 transition group-hover:opacity-100">
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function NotificationState({
  icon: Icon,
  title,
  text,
  children,
  tone = "neutral",
  spinning = false,
}: {
  icon: typeof Bell;
  title: string;
  text: string;
  children?: React.ReactNode;
  tone?: "neutral" | "danger";
  spinning?: boolean;
}) {
  return (
    <section className="mt-4 workon-premium-card rounded-[28px] p-6 text-center">
      <div
        className={cn(
          "mx-auto flex h-16 w-16 items-center justify-center rounded-[24px]",
          tone === "danger" ? "bg-red-50 text-red-500" : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-7 w-7", spinning && "animate-spin")} />
      </div>
      <p className="mt-4 text-sm font-black text-workon-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-workon-muted">
        {text}
      </p>
      {children}
    </section>
  );
}
