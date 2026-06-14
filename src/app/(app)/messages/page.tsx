"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Briefcase,
  Loader2,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { api, type ConversationItem } from "@/lib/api-client";
import { useMode } from "@/contexts/mode-context";
import { cn } from "@/lib/utils";

type InboxFilter = "all" | "priority" | "mission" | "direct";

type EnrichedConversation = ConversationItem & {
  href: string;
  isDirect: boolean;
  isPriority: boolean;
  lastMessageDate: Date;
  statusLabel: string;
  statusClassName: string;
};

const FILTERS: Array<{ value: InboxFilter; label: string }> = [
  { value: "all", label: "Tout" },
  { value: "priority", label: "Priorite" },
  { value: "mission", label: "Missions" },
  { value: "direct", label: "Matchs" },
];

function getConversationHref(conv: ConversationItem) {
  return conv.conversationId
    ? `/messages/cv/${conv.conversationId}`
    : `/messages/${conv.missionId}`;
}

function getInitials(conv: ConversationItem) {
  return `${conv.otherUser.firstName?.[0] ?? ""}${conv.otherUser.lastName?.[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2);
}

function enrichConversation(conv: ConversationItem): EnrichedConversation {
  const lastMessageDate = new Date(conv.lastMessageAt);
  const isDirect = Boolean(conv.conversationId && !conv.missionId);
  const isPriority = conv.unreadCount > 0;

  return {
    ...conv,
    href: getConversationHref(conv),
    isDirect,
    isPriority,
    lastMessageDate,
    statusLabel: isPriority ? "A traiter" : isDirect ? "Match actif" : "Mission",
    statusClassName: isPriority
      ? "border-workon-copper/30 bg-workon-copper/10 text-workon-copper"
      : isDirect
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-workon-primary/20 bg-workon-primary/10 text-workon-primary",
  };
}

export default function MessagesPage() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const { mode } = useMode();
  const { data: conversations, isLoading, isError } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.getConversations(),
  });

  const enriched = useMemo(
    () =>
      (conversations ?? [])
        .map(enrichConversation)
        .sort((a, b) => {
          if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
          return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
        }),
    [conversations],
  );

  const filtered = useMemo(() => {
    if (filter === "priority") return enriched.filter((conv) => conv.isPriority);
    if (filter === "mission") return enriched.filter((conv) => !conv.isDirect);
    if (filter === "direct") return enriched.filter((conv) => conv.isDirect);
    return enriched;
  }, [enriched, filter]);

  const priorityCount = enriched.filter((conv) => conv.isPriority).length;
  const unreadCount = enriched.reduce((total, conv) => total + conv.unreadCount, 0);
  const missionCount = enriched.filter((conv) => !conv.isDirect).length;
  const ctaHref = mode === "pro" ? "/missions" : "/missions/new";
  const ctaLabel = mode === "pro" ? "Trouver une mission" : "Publier une mission";

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 pb-10">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15">
        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <MessageCircle className="h-3.5 w-3.5 text-workon-gold" />
                Inbox operationnelle
              </div>
              <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white">
                Messages
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                Suis les conversations qui font avancer les missions, les matchs
                et les prochaines decisions.
              </p>
            </div>

            <Link
              href={ctaHref}
              className="hidden shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream sm:inline-flex"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <InboxMetric label="Non lus" value={unreadCount} />
            <InboxMetric label="Priorite" value={priorityCount} />
            <InboxMetric label="Missions" value={missionCount} />
          </div>
        </div>
      </header>

      <section className="mt-4 workon-premium-card rounded-[24px] p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
                filter === item.value
                  ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                  : "border-workon-border bg-white text-workon-stone hover:border-workon-primary/30 hover:text-workon-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <StatePanel
          icon={Loader2}
          title="Chargement de l'inbox"
          text="On recupere les conversations et les priorites."
          spinning
        />
      ) : isError ? (
        <StatePanel
          icon={MessageCircle}
          title="Impossible de charger les conversations"
          text="Verifie ta connexion et reessaie dans quelques instants."
          tone="danger"
        />
      ) : enriched.length === 0 ? (
        <EmptyInbox ctaHref={ctaHref} ctaLabel={ctaLabel} />
      ) : (
        <div className="mt-4 space-y-4">
          {priorityCount > 0 && filter === "all" && (
            <InboxSection
              title="A traiter maintenant"
              eyebrow={`${priorityCount} conversation${priorityCount > 1 ? "s" : ""}`}
              conversations={enriched.filter((conv) => conv.isPriority)}
            />
          )}

          <InboxSection
            title={filter === "all" ? "Toutes les conversations" : "Resultats filtres"}
            eyebrow={`${filtered.length} fil${filtered.length > 1 ? "s" : ""} actif${filtered.length > 1 ? "s" : ""}`}
            conversations={filtered}
          />
        </div>
      )}
    </div>
  );
}

function InboxMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function InboxSection({
  title,
  eyebrow,
  conversations,
}: {
  title: string;
  eyebrow: string;
  conversations: EnrichedConversation[];
}) {
  if (conversations.length === 0) {
    return (
      <section className="workon-premium-card rounded-[24px] p-6 text-center">
        <Search className="mx-auto h-6 w-6 text-workon-muted" />
        <p className="mt-2 text-sm font-semibold text-workon-ink">
          Aucun resultat dans ce filtre
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-workon-stone">
            {eyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-cabinet)] text-lg font-black text-workon-ink">
            {title}
          </h2>
        </div>
      </div>
      <div className="space-y-3">
        {conversations.map((conv) => (
          <ConversationCard
            key={
              conv.conversationId ??
              conv.missionId ??
              `${conv.otherUser.id}-${conv.lastMessageAt}`
            }
            conversation={conv}
          />
        ))}
      </div>
    </section>
  );
}

function ConversationCard({ conversation: conv }: { conversation: EnrichedConversation }) {
  return (
    <Link
      href={conv.href}
      className={cn(
        "group block overflow-hidden rounded-[24px] border bg-workon-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(27,26,24,0.10)]",
        conv.isPriority
          ? "border-workon-copper/30 ring-1 ring-workon-copper/10"
          : "border-workon-line",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-workon-primary text-sm font-black text-white shadow-sm">
            {getInitials(conv)}
          </div>
          {conv.isPriority && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-workon-copper px-1 text-[10px] font-black text-white">
              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-workon-ink">
                {conv.otherUser.firstName} {conv.otherUser.lastName}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-workon-stone">
                {conv.missionTitle}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-workon-muted">
              {formatDistanceToNow(conv.lastMessageDate, { addSuffix: true, locale: fr })}
            </span>
          </div>

          <p
            className={cn(
              "mt-2 line-clamp-2 text-sm leading-relaxed",
              conv.isPriority ? "font-semibold text-workon-ink" : "text-workon-gray",
            )}
          >
            {conv.lastMessage ?? "Conversation ouverte. Lance le prochain message pour avancer."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                conv.statusClassName,
              )}
            >
              {conv.isPriority ? <Zap className="h-3 w-3" /> : conv.isDirect ? <Users className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
              {conv.statusLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-workon-trust-green/20 bg-workon-trust-green/10 px-2.5 py-1 text-[10px] font-bold text-workon-trust-green">
              <ShieldCheck className="h-3 w-3" />
              Contexte conserve
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-workon-primary opacity-80 transition group-hover:opacity-100">
              Ouvrir
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyInbox({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="mt-4 workon-premium-card rounded-[28px] p-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-workon-primary/10 text-workon-primary">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
        Aucune conversation active
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-workon-gray">
        Les messages apparaitront quand un match, une mission ou une reservation
        necessite une decision.
      </p>
      <Link
        href={ctaHref}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-workon-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-workon-primary-hover"
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function StatePanel({
  icon: Icon,
  title,
  text,
  tone = "neutral",
  spinning = false,
}: {
  icon: typeof MessageCircle;
  title: string;
  text: string;
  tone?: "neutral" | "danger";
  spinning?: boolean;
}) {
  return (
    <section className="mt-4 workon-premium-card rounded-[28px] p-6 text-center">
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "danger" ? "bg-red-50 text-red-500" : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-6 w-6", spinning && "animate-spin")} />
      </div>
      <p className="mt-3 text-sm font-black text-workon-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>
    </section>
  );
}
