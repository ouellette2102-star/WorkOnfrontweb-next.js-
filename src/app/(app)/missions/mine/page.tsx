"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { api, type MissionResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";
import { MissionCard } from "@/components/mission/mission-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "active" | "done" | "cancelled";

type MissionView = {
  mission: MissionResponse;
  offerCount: number;
  nextStep: string;
  tone: "action" | "progress" | "complete" | "quiet";
};

const TABS: { key: Tab; label: string; detail: string }[] = [
  { key: "active", label: "Actives", detail: "A suivre maintenant" },
  { key: "done", label: "Terminees", detail: "Livrees ou payees" },
  { key: "cancelled", label: "Annulees", detail: "Archivees" },
];

const activeStatuses = ["open", "assigned", "in_progress"] as const;
const doneStatuses = ["completed", "paid"] as const;

const statusRank: Record<MissionResponse["status"], number> = {
  in_progress: 0,
  assigned: 1,
  open: 2,
  completed: 3,
  paid: 4,
  cancelled: 5,
};

const emptyMessages: Record<Tab, { title: string; text: string }> = {
  active: {
    title: "Aucune mission active",
    text: "Quand une mission est publiee, assignee ou en cours, elle apparait ici avec sa prochaine action.",
  },
  done: {
    title: "Aucune mission terminee",
    text: "Les missions completees et payees formeront ton historique de travail.",
  },
  cancelled: {
    title: "Aucune mission annulee",
    text: "Les missions annulees restent separees pour garder le tableau de bord propre.",
  },
};

function filterByTab(missions: MissionResponse[], tab: Tab): MissionResponse[] {
  switch (tab) {
    case "active":
      return missions.filter((mission) =>
        activeStatuses.includes(mission.status as (typeof activeStatuses)[number]),
      );
    case "done":
      return missions.filter((mission) =>
        doneStatuses.includes(mission.status as (typeof doneStatuses)[number]),
      );
    case "cancelled":
      return missions.filter((mission) => mission.status === "cancelled");
  }
}

function toTimestamp(value: string | null | undefined) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNextStep(
  mission: MissionResponse,
  isEmployer: boolean,
  offerCount: number,
): MissionView["nextStep"] {
  if (mission.status === "open") {
    if (isEmployer && offerCount > 0) {
      return `${offerCount} offre${offerCount > 1 ? "s" : ""} a examiner`;
    }
    return isEmployer ? "Attendre ou partager la mission" : "Mission disponible";
  }
  if (mission.status === "assigned") {
    return isEmployer ? "Coordonner le debut" : "Preparer le depart";
  }
  if (mission.status === "in_progress") {
    return isEmployer ? "Suivre la livraison" : "Completer la mission";
  }
  if (mission.status === "completed") {
    return isEmployer ? "Verifier paiement et avis" : "Attendre confirmation";
  }
  if (mission.status === "paid") {
    return "Payee et archivee";
  }
  return "Annulee";
}

function getTone(mission: MissionResponse, offerCount: number): MissionView["tone"] {
  if (
    mission.status === "in_progress" ||
    mission.status === "assigned" ||
    offerCount > 0
  ) {
    return "action";
  }
  if (mission.status === "open") return "progress";
  if (doneStatuses.includes(mission.status as (typeof doneStatuses)[number])) {
    return "complete";
  }
  return "quiet";
}

function buildMissionView(
  mission: MissionResponse,
  isEmployer: boolean,
  offerCount: number,
): MissionView {
  return {
    mission,
    offerCount,
    nextStep: getNextStep(mission, isEmployer, offerCount),
    tone: getTone(mission, offerCount),
  };
}

function sortMissionViews(items: MissionView[]) {
  return [...items].sort((a, b) => {
    const statusDelta = statusRank[a.mission.status] - statusRank[b.mission.status];
    if (statusDelta !== 0) return statusDelta;

    const offerDelta = b.offerCount - a.offerCount;
    if (offerDelta !== 0) return offerDelta;

    return toTimestamp(b.mission.updatedAt) - toTimestamp(a.mission.updatedAt);
  });
}

export default function MyMissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { mode } = useMode();
  const [tab, setTab] = useState<Tab>("active");

  // Acting-as: the Pro/Client mode selects the view, not the locked role.
  const isEmployer = mode === "client";

  const {
    data: missions,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [isEmployer ? "my-missions" : "my-assignments"],
    queryFn: () => (isEmployer ? api.getMyMissions() : api.getMyAssignments()),
    enabled: !!user,
  });

  // Employer: fetch pending offers per active mission, preserving the existing badge behavior.
  const missionIds = useMemo(
    () =>
      (missions ?? [])
        .filter((mission) =>
          activeStatuses.includes(mission.status as (typeof activeStatuses)[number]),
        )
        .map((mission) => mission.id),
    [missions],
  );

  const offersQueries = useQuery({
    queryKey: ["offers-counts", ...missionIds],
    queryFn: async () => {
      if (!isEmployer || missionIds.length === 0) return {};
      const results: Record<string, number> = {};
      await Promise.all(
        missionIds.map(async (missionId) => {
          try {
            const offers = await api.getOffersForMission(missionId);
            results[missionId] = offers.filter((offer) => offer.status === "PENDING").length;
          } catch {
            results[missionId] = 0;
          }
        }),
      );
      return results;
    },
    enabled: isEmployer && missionIds.length > 0,
  });

  const offerCounts = useMemo(() => offersQueries.data ?? {}, [offersQueries.data]);

  const missionViews = useMemo(() => {
    return (missions ?? []).map((mission) =>
      buildMissionView(
        mission,
        isEmployer,
        Math.max(mission.offersCount ?? 0, offerCounts[mission.id] ?? 0),
      ),
    );
  }, [isEmployer, missions, offerCounts]);

  const stats = useMemo(() => {
    const active = missionViews.filter((item) =>
      activeStatuses.includes(item.mission.status as (typeof activeStatuses)[number]),
    );
    const done = missionViews.filter((item) =>
      doneStatuses.includes(item.mission.status as (typeof doneStatuses)[number]),
    );
    const cancelled = missionViews.filter((item) => item.mission.status === "cancelled");
    const actionRequired = active.filter((item) => item.tone === "action").length;
    const pendingOffers = missionViews.reduce((sum, item) => sum + item.offerCount, 0);
    const activeValue = active.reduce((sum, item) => sum + (item.mission.price ?? 0), 0);

    return {
      active: active.length,
      done: done.length,
      cancelled: cancelled.length,
      actionRequired,
      pendingOffers,
      activeValue,
      latest: sortMissionViews(active)[0] ?? sortMissionViews(missionViews)[0],
    };
  }, [missionViews]);

  const tabCounts = useMemo(
    () => ({
      active: stats.active,
      done: stats.done,
      cancelled: stats.cancelled,
    }),
    [stats.active, stats.cancelled, stats.done],
  );

  const filtered = useMemo(
    () => sortMissionViews(missionViews.filter((item) => filterByTab([item.mission], tab).length > 0)),
    [missionViews, tab],
  );

  const loading = authLoading || isLoading;
  const ctaHref = isEmployer ? "/missions/new" : "/missions";
  const ctaLabel = isEmployer ? "Creer une mission" : "Trouver une mission";

  return (
    <div
      className="min-h-screen bg-workon-bg px-4 pb-36 pt-5 sm:px-6 lg:px-8"
      data-testid="missions-mine-page"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="workon-dark-panel overflow-hidden rounded-[28px] p-4 shadow-lg shadow-workon-primary/15 sm:p-6">
          <div className="relative z-10 space-y-4 sm:space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  {isEmployer ? (
                    <Briefcase className="h-3.5 w-3.5 text-workon-gold" />
                  ) : (
                    <ClipboardList className="h-3.5 w-3.5 text-workon-gold" />
                  )}
                  {isEmployer ? "Espace client" : "Espace pro"}
                </div>
                <h1 className="font-[family-name:var(--font-cabinet)] text-3xl font-black tracking-tight text-white md:text-4xl">
                  {isEmployer ? "Mes missions" : "Mes affectations"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
                  {isEmployer
                    ? "Suis tes missions publiees, les offres a examiner et les dossiers qui avancent vers le paiement."
                    : "Garde tes affectations, livraisons et missions terminees dans une seule vue de travail."}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  Actualiser
                </button>
                <Button asChild className="rounded-full bg-white px-5 text-workon-primary hover:bg-workon-bg-cream">
                  <Link href={ctaHref}>
                    {isEmployer ? <Plus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <section className="grid grid-cols-4 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <HeroMetric
                icon={Clock3}
                label="Actives"
                value={stats.active}
                detail="A suivre"
              />
              <HeroMetric
                icon={CheckCircle2}
                label="Terminees"
                value={stats.done}
                detail="Historique"
              />
              <HeroMetric
                icon={isEmployer ? MessageCircle : ShieldCheck}
                label={isEmployer ? "Offres" : "A traiter"}
                value={isEmployer ? stats.pendingOffers : stats.actionRequired}
                detail={isEmployer ? "En attente" : "Missions chaudes"}
              />
              <HeroMetric
                icon={DollarSign}
                label="Valeur active"
                value={formatCurrency(stats.activeValue)}
                detail="Budget en cours"
              />
            </section>
          </div>
        </header>

        {!loading && !error && stats.latest && (
          <section
            className="grid gap-3 rounded-[24px] border border-workon-border bg-white p-3 shadow-sm sm:p-4 lg:grid-cols-[1fr_auto] lg:items-center"
            data-testid="missions-next-action"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary sm:h-11 sm:w-11">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-workon-primary">
                  Prochaine action
                </p>
                <h2 className="mt-1 truncate text-base font-black text-workon-ink sm:text-lg">
                  {stats.latest.mission.title}
                </h2>
                <p className="mt-1 text-xs text-workon-muted sm:text-sm">
                  {stats.latest.nextStep} - {stats.latest.mission.city || "Ville non precisee"} -{" "}
                  {formatDate(stats.latest.mission.updatedAt)}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/missions/${stats.latest.mission.id}`}>
                Ouvrir la mission
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}

        <section className="rounded-[24px] border border-workon-border bg-white p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            {TABS.map((item) => {
              const selected = tab === item.key;
              const count = tabCounts[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  aria-pressed={selected}
                  data-testid={`missions-tab-${item.key}`}
                  className={cn(
                    "min-w-0 rounded-2xl px-2 py-3 text-left transition sm:px-4",
                    selected
                      ? "bg-workon-primary text-white shadow-sm"
                      : "text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black">{item.label}</span>
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black",
                        selected ? "bg-white/18 text-white" : "bg-workon-primary/10 text-workon-primary",
                      )}
                    >
                      {count}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-1 hidden text-xs font-semibold sm:block",
                      selected ? "text-white/70" : "text-workon-muted",
                    )}
                  >
                    {item.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {loading && <MissionsLoading />}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <TriangleAlert className="mx-auto mb-3 h-9 w-9 text-red-600" />
            <h2 className="text-lg font-bold text-red-800">
              Impossible de charger les missions
            </h2>
            <p className="mt-1 text-sm text-red-700">
              Relance l&apos;actualisation ou reessaie dans quelques instants.
            </p>
            <Button
              type="button"
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 rounded-full border-red-200 bg-white text-red-700 hover:bg-red-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Reessayer
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyMissionState tab={tab} isEmployer={isEmployer} />
        )}

        {!loading && !error && filtered.length > 0 && (
          <section className="space-y-4" data-testid="missions-list">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-workon-ink">
                  {TABS.find((item) => item.key === tab)?.label}
                </h2>
                <p className="text-sm text-workon-muted">
                  {filtered.length} mission{filtered.length > 1 ? "s" : ""} dans cette vue
                </p>
              </div>
              <Badge variant="outline" className="border-workon-border bg-white text-workon-muted">
                {isEmployer ? "Vue client" : "Vue pro"}
              </Badge>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((item) => (
                <MissionListItem
                  key={item.mission.id}
                  item={item}
                  isEmployer={isEmployer}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-2 text-white shadow-sm sm:p-3">
      <div className="mb-2 hidden h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-workon-gold sm:mb-3 sm:flex sm:h-9 sm:w-9 sm:rounded-xl">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      <p className="truncate text-[10px] font-semibold text-white/64 sm:text-xs">{label}</p>
      <p className="mt-0.5 truncate text-lg font-black sm:mt-1 sm:text-2xl">{value}</p>
      <p className="mt-1 hidden truncate text-[11px] font-semibold text-white/55 sm:block">{detail}</p>
    </div>
  );
}

function MissionListItem({
  item,
  isEmployer,
}: {
  item: MissionView;
  isEmployer: boolean;
}) {
  const missionForCard: MissionResponse = {
    ...item.mission,
    offersCount: Math.max(item.mission.offersCount ?? 0, item.offerCount),
  };

  return (
    <article
      className="relative"
      data-testid="mission-list-item"
      data-status={item.mission.status}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-workon-border bg-white px-3 py-2 shadow-sm">
        <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-workon-muted">
          <StatusDot tone={item.tone} />
          <span className="truncate">{item.nextStep}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-workon-muted">
          <MapPin className="h-3.5 w-3.5" />
          {item.mission.city || "Ville non precisee"}
        </div>
      </div>

      <MissionCard
        mission={missionForCard}
        variant={isEmployer ? "client" : "pro"}
        showCTA={false}
        source="mine"
      />

      {isEmployer && item.offerCount > 0 && (
        <Link
          href={`/missions/${item.mission.id}`}
          className="absolute right-3 top-14 z-10 inline-flex items-center gap-1 rounded-full bg-workon-primary px-2.5 py-1 text-[11px] font-black text-white shadow-sm transition hover:bg-workon-primary-hover"
        >
          {item.offerCount} offre{item.offerCount > 1 ? "s" : ""}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </article>
  );
}

function StatusDot({ tone }: { tone: MissionView["tone"] }) {
  const className =
    tone === "action"
      ? "bg-workon-copper"
      : tone === "progress"
        ? "bg-blue-500"
        : tone === "complete"
          ? "bg-emerald-500"
          : "bg-workon-muted";

  return <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />;
}

function MissionsLoading() {
  return (
    <div className="space-y-4" aria-label="Chargement des missions">
      <div className="h-20 animate-pulse rounded-[24px] border border-workon-border bg-white" />
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-56 animate-pulse rounded-[24px] border border-workon-border bg-white" />
        ))}
      </div>
    </div>
  );
}

function EmptyMissionState({
  tab,
  isEmployer,
}: {
  tab: Tab;
  isEmployer: boolean;
}) {
  const empty = emptyMessages[tab];
  const href = isEmployer ? "/missions/new" : "/missions";
  const label = isEmployer ? "Creer une mission" : "Trouver une mission";

  return (
    <section
      className="rounded-[28px] border border-dashed border-workon-border bg-white p-8 text-center shadow-sm"
      data-testid="missions-empty-state"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-bg-cream text-workon-primary">
        {tab === "done" ? (
          <CheckCircle2 className="h-7 w-7" />
        ) : tab === "cancelled" ? (
          <FileText className="h-7 w-7" />
        ) : (
          <ClipboardList className="h-7 w-7" />
        )}
      </div>
      <h2 className="mt-4 text-xl font-black text-workon-ink">{empty.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-workon-muted">
        {empty.text}
      </p>
      {tab === "active" && (
        <Button asChild className="mt-5 rounded-full bg-workon-primary text-white hover:bg-workon-primary-hover">
          <Link href={href}>
            {isEmployer ? <Plus className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {label}
          </Link>
        </Button>
      )}
    </section>
  );
}
