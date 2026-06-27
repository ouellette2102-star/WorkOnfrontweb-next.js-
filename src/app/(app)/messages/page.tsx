"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
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
  participantName: string;
  statusLabel: string;
  statusClassName: string;
  nextStep: string;
};

const FILTERS: Array<{ value: InboxFilter; label: string; icon: LucideIcon }> = [
  { value: "all", label: "Tout", icon: Inbox },
  { value: "priority", label: "Priorite", icon: Zap },
  { value: "mission", label: "Missions", icon: Briefcase },
  { value: "direct", label: "Matchs", icon: Users },
];

function getConversationHref(conv: ConversationItem) {
  return conv.conversationId
    ? `/messages/cv/${conv.conversationId}`
    : `/messages/${conv.missionId}`;
}

function getInitials(conv: ConversationItem) {
  return `${conv.otherUser.firstName?.[0] ?? ""}${conv.otherUser.lastName?.[0] ?? ""}`
    .toUpperCase()
    .slice(0, 2) || "WO";
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function enrichConversation(conv: ConversationItem): EnrichedConversation {
  const lastMessageDate = parseDate(conv.lastMessageAt);
  const isDirect = Boolean(conv.conversationId && !conv.missionId);
  const isPriority = conv.unreadCount > 0;
  const participantName = `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.trim();

  return {
    ...conv,
    href: getConversationHref(conv),
    isDirect,
    isPriority,
    lastMessageDate,
    participantName: participantName || "Contact WorkOn",
    statusLabel: isPriority ? "A traiter" : isDirect ? "Match actif" : "Mission",
    statusClassName: isPriority
      ? "border-workon-copper/30 bg-workon-copper/10 text-workon-copper"
      : isDirect
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-workon-primary/20 bg-workon-primary/10 text-workon-primary",
    nextStep: isPriority
      ? "Repondre maintenant"
      : isDirect
        ? "Entretenir le match"
        : "Garder le suivi mission",
  };
}

export default function MessagesPage() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");
  const { mode } = useMode();
  const {
    data: conversations,
    isFetching,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
    const normalizedSearch = search.trim().toLowerCase();
    return enriched.filter((conv) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "priority" && conv.isPriority) ||
        (filter === "mission" && !conv.isDirect) ||
        (filter === "direct" && conv.isDirect);

      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;

      return [
        conv.participantName,
        conv.missionTitle,
        conv.lastMessage ?? "",
        conv.statusLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [enriched, filter, search]);

  const priorityCount = enriched.filter((conv) => conv.isPriority).length;
  const unreadCount = enriched.reduce((total, conv) => total + conv.unreadCount, 0);
  const missionCount = enriched.filter((conv) => !conv.isDirect).length;
  const directCount = enriched.filter((conv) => conv.isDirect).length;
  const lastActivity = enriched[0]?.lastMessageDate;
  const ctaHref = mode === "pro" ? "/missions" : "/missions/new";
  const ctaLabel = mode === "pro" ? "Trouver une mission" : "Publier une mission";

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 pb-36 sm:px-6 lg:px-8">
      <header className="workon-dark-panel overflow-hidden rounded-[28px] p-5 shadow-lg shadow-workon-primary/15 sm:p-6">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <MessageCircle className="h-3.5 w-3.5 text-workon-gold" />
                Inbox operationnelle
              </div>
              <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                Messages
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
                Pilote les conversations qui declenchent une mission, confirment
                une decision ou gardent la preuve dans WorkOn.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Actualiser
              </button>
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-workon-primary shadow-sm transition hover:bg-workon-bg-cream"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <InboxMetric icon={Inbox} label="Non lus" value={unreadCount} detail="Messages a traiter" />
            <InboxMetric icon={Zap} label="Priorite" value={priorityCount} detail="Reponse attendue" />
            <InboxMetric icon={Briefcase} label="Missions" value={missionCount} detail="Contexte mission" />
            <InboxMetric icon={Users} label="Matchs" value={directCount} detail="Conversations directes" />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
              <ShieldCheck className="h-4 w-4 text-workon-gold" />
              Preuve, mission et paiement restent dans le meme fil.
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/62">
              <Clock3 className="h-4 w-4" />
              {lastActivity
                ? `Derniere activite ${formatDistanceToNow(lastActivity, { addSuffix: true, locale: fr })}`
                : "Aucune activite pour le moment"}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-32 grid gap-3 rounded-[24px] border border-workon-border bg-white p-3 shadow-sm sm:mt-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="relative block">
          <span className="sr-only">Rechercher une conversation</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-workon-stone" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Chercher par contact, mission ou message..."
            className="h-11 w-full rounded-2xl border border-workon-border bg-workon-bg px-10 text-sm font-medium text-workon-ink outline-none transition placeholder:text-workon-muted focus:border-workon-primary focus:ring-2 focus:ring-workon-primary-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-bold text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink"
            >
              Effacer
            </button>
          )}
        </label>

        <div className="flex gap-1.5 overflow-x-auto sm:gap-2">
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const selected = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border px-2 text-xs font-black transition sm:gap-2 sm:px-3",
                  selected
                    ? "border-workon-primary bg-workon-primary text-white shadow-sm"
                    : "border-workon-border bg-white text-workon-stone hover:border-workon-primary/30 hover:bg-workon-bg-cream hover:text-workon-ink",
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {isLoading ? (
        <StatePanel
          icon={Loader2}
          title="Chargement de l'inbox"
          text="On recupere les conversations, les priorites et les compteurs."
          spinning
        />
      ) : isError ? (
        <StatePanel
          icon={MessageCircle}
          title="Impossible de charger les conversations"
          text="Verifie ta connexion ou relance l'actualisation."
          tone="danger"
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-workon-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-workon-primary-hover"
            >
              Reessayer
              <RefreshCw className="h-4 w-4" />
            </button>
          }
        />
      ) : enriched.length === 0 ? (
        <EmptyInbox ctaHref={ctaHref} ctaLabel={ctaLabel} />
      ) : (
        <div className="mt-5 space-y-5">
          {priorityCount > 0 && filter === "all" && !search && (
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

function InboxMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
          <p className="mt-1 truncate text-[11px] leading-relaxed text-white/65">
            {detail}
          </p>
        </div>
        <span className="rounded-xl bg-white/10 p-2 text-workon-gold">
          <Icon className="h-4 w-4" />
        </span>
      </div>
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
      <section className="rounded-[24px] border border-dashed border-workon-border bg-white p-8 text-center shadow-sm">
        <Search className="mx-auto h-7 w-7 text-workon-muted" />
        <p className="mt-3 text-sm font-black text-workon-ink">
          Aucun resultat dans ce filtre
        </p>
        <p className="mt-1 text-xs text-workon-muted">
          Essaie un autre filtre ou retire la recherche active.
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
          <h2 className="font-[family-name:var(--font-cabinet)] text-xl font-black text-workon-ink">
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
        "group block overflow-hidden rounded-[24px] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-workon-primary/35 hover:shadow-[0_18px_48px_rgba(27,26,24,0.10)] sm:p-5",
        conv.isPriority
          ? "border-workon-copper/35 ring-1 ring-workon-copper/10"
          : "border-workon-border",
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-workon-primary text-sm font-black text-white shadow-sm">
              {getInitials(conv)}
            </div>
            {conv.isPriority && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-workon-copper px-1 text-[10px] font-black text-white">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-black text-workon-ink">
                {conv.participantName}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  conv.statusClassName,
                )}
              >
                {conv.isPriority ? (
                  <Zap className="h-3 w-3" />
                ) : conv.isDirect ? (
                  <Users className="h-3 w-3" />
                ) : (
                  <Briefcase className="h-3 w-3" />
                )}
                {conv.statusLabel}
              </span>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-workon-stone">
              {conv.missionTitle}
            </p>
            <p
              className={cn(
                "mt-2 line-clamp-2 text-sm leading-relaxed",
                conv.isPriority ? "font-semibold text-workon-ink" : "text-workon-gray",
              )}
            >
              {conv.lastMessage ?? "Conversation ouverte. Lance le prochain message pour avancer."}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 md:w-[360px] md:grid-cols-1 lg:grid-cols-3 lg:items-stretch">
          <ConversationFact
            icon={Clock3}
            label="Dernier signal"
            value={formatDistanceToNow(conv.lastMessageDate, { addSuffix: true, locale: fr })}
          />
          <ConversationFact
            icon={ShieldCheck}
            label="Contexte"
            value={conv.isDirect ? "Match conserve" : "Mission liee"}
          />
          <ConversationFact icon={CheckCircle2} label="Prochaine etape" value={conv.nextStep} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-workon-border pt-3">
        <span className="text-xs font-bold text-workon-muted">
          {conv.unreadCount > 0
            ? `${conv.unreadCount} message${conv.unreadCount > 1 ? "s" : ""} non lu${conv.unreadCount > 1 ? "s" : ""}`
            : "Aucun message non lu"}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-black text-workon-primary transition group-hover:translate-x-0.5">
          Ouvrir
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function ConversationFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-workon-border bg-workon-bg-cream p-3">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-workon-stone">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="line-clamp-2 text-xs font-bold leading-relaxed text-workon-ink">
        {value}
      </p>
    </div>
  );
}

function EmptyInbox({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="mt-5 rounded-[28px] border border-workon-border bg-white p-5 text-center shadow-sm sm:p-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-workon-primary/10 text-workon-primary">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-cabinet)] text-2xl font-black text-workon-ink">
        Aucune conversation active
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-workon-gray">
        Les messages apparaitront quand un match, une mission ou une reservation
        demande une decision. Garde les echanges importants dans WorkOn pour
        conserver le contexte.
      </p>

      <div className="mt-6 grid gap-3 text-left md:grid-cols-3">
        <EmptyAction
          icon={Briefcase}
          title="Trouver une mission"
          text="Lance une conversation depuis une mission ouverte."
          href="/missions"
        />
        <EmptyAction
          icon={Users}
          title="Explorer les pros"
          text="Un match mutuel debloque une discussion directe."
          href="/swipe"
        />
        <EmptyAction
          icon={ShieldCheck}
          title="Besoin d'aide"
          text="Le support garde un suivi clair si une situation bloque."
          href="/support"
        />
      </div>

      <Link
        href={ctaHref}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-workon-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-workon-primary-hover"
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function EmptyAction({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-workon-border bg-workon-bg-cream p-4 transition hover:border-workon-primary/30 hover:bg-white"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-workon-primary shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-black text-workon-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-workon-muted">{text}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-workon-primary">
        Ouvrir
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function StatePanel({
  icon: Icon,
  title,
  text,
  tone = "neutral",
  spinning = false,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: "neutral" | "danger";
  spinning?: boolean;
  action?: ReactNode;
}) {
  return (
    <section className="mt-5 rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "danger" ? "bg-red-50 text-red-500" : "bg-workon-primary/10 text-workon-primary",
        )}
      >
        <Icon className={cn("h-6 w-6", spinning && "animate-spin")} />
      </div>
      <p className="mt-3 text-sm font-black text-workon-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-workon-muted">
        {text}
      </p>
      {action}
    </section>
  );
}
