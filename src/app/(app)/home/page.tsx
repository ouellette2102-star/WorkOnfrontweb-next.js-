"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck,
  Inbox,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMode } from "@/contexts/mode-context";
import { useCopy } from "@/lib/copy";
import { formatFullDate } from "@/lib/format-date";
import { api, type MissionResponse, type WorkerProfile } from "@/lib/api-client";
import { getFeaturedWorkers, type FeaturedWorker } from "@/lib/public-api";
import { Button } from "@/components/ui/button";
import { MissionProgressBar } from "@/components/mission/mission-progress-bar";
import { SkeletonWorkerCard } from "@/components/ui/skeleton";
import { WorkerCardFeed } from "@/components/worker/worker-card-feed";
import { cn } from "@/lib/utils";
import { missionStatusColor, missionStatusLabel } from "@/lib/i18n-labels";

export default function HomePage() {
  const { user } = useAuth();
  const { mode } = useMode();
  const copy = useCopy();

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: () => api.getHomeStats(),
    staleTime: 60_000,
  });

  const { data: featured, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["featured-workers-public"],
    queryFn: () => getFeaturedWorkers(24),
    staleTime: 60_000,
  });

  const { data: myClientMissions } = useQuery({
    queryKey: ["my-missions-client"],
    queryFn: () => api.getMyMissions(),
    enabled: !!user,
  });

  const { data: myProMissions } = useQuery({
    queryKey: ["my-missions-pro"],
    queryFn: () => api.getMyAssignments(),
    enabled: !!user,
  });

  const { data: quota } = useQuery({
    queryKey: ["missions-quota"],
    queryFn: () => api.getMissionsQuota().catch(() => null),
  });

  const { data: leadsData } = useQuery({
    queryKey: ["leads-mine-home"],
    queryFn: () => api.getMyLeads().catch(() => null),
    enabled: !!user,
    staleTime: 60_000,
  });

  const realWorkers = toDisplayWorkers(featured ?? []);
  const missions = [...(myClientMissions ?? []), ...(myProMissions ?? [])];
  const activeMissions = missions.filter((m) =>
    ["open", "assigned", "in_progress"].includes(m.status),
  );
  const topMission = activeMissions[0];
  const pendingLeads =
    leadsData?.deliveries?.filter((d) => !d.acceptedAt && !d.declinedAt) ?? [];
  const quotaExceeded = Boolean(
    quota && quota.limit !== null && quota.used >= quota.limit,
  );
  const openMissionCount = stats?.openServiceCalls ?? 0;
  const activeWorkerCount = stats?.activeWorkers ?? realWorkers.length;
  const completedContracts = stats?.completedContracts ?? 0;
  const todayLabel = formatFullDate(new Date());
  const isPro = mode === "pro";

  return (
    <div className="space-y-5 px-4 py-5 pb-28">
      <header className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-workon-stone">
          {todayLabel}
          {user?.city ? ` · ${user.city}` : ""}
        </p>
        <h1 className="font-heading text-2xl font-bold leading-tight text-workon-ink">
          Bonjour {user?.firstName || "WorkOn"}
        </h1>
        <p className="text-sm text-workon-muted">
          {isPro
            ? "Voici les actions qui peuvent faire avancer tes revenus aujourd'hui."
            : "Voici les actions qui peuvent faire avancer tes missions aujourd'hui."}
        </p>
      </header>

      <PrimaryActionCard
        mode={mode}
        pendingLeads={pendingLeads.length}
        topMission={topMission}
        openMissionCount={openMissionCount}
        quotaExceeded={quotaExceeded}
      />

      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label={isPro ? "Missions" : "Demandes"}
          value={isPro ? openMissionCount : missions.length}
          detail={isPro ? "ouvertes" : "en cours"}
          icon={Briefcase}
        />
        <MetricCard
          label={isPro ? "Revenus" : "Budget"}
          value={isPro ? formatMoneyFromMissions(missions) : `${missions.length}`}
          detail={isPro ? "potentiel" : "mission"}
          icon={isPro ? Wallet : CreditCard}
        />
        <MetricCard
          label="Confiance"
          value={completedContracts || activeWorkerCount}
          detail={completedContracts ? "contrats" : "pros"}
          icon={ShieldCheck}
        />
      </div>

      <ToDoSection
        pendingLeads={pendingLeads.length}
        quotaExceeded={quotaExceeded}
        mode={mode}
      />

      {activeMissions.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader
            eyebrow="En cours"
            title={isPro ? "Missions a piloter" : "Missions a suivre"}
            href="/missions/mine"
            action="Voir tout"
          />
          <div className="space-y-3">
            {activeMissions.slice(0, 3).map((mission) => (
              <MissionDashboardCard key={mission.id} mission={mission} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyActionCard mode={mode} copy={copy.home} />
      )}

      <TrustStrip labels={copy.trustPills} />

      {(isLoadingWorkers || realWorkers.length > 0) && (
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Terrain"
            title="Pros autour de toi"
            href="/swipe"
            action="Explorer"
          />
          <div className="space-y-4">
            {isLoadingWorkers
              ? Array.from({ length: 2 }).map((_, index) => (
                  <SkeletonWorkerCard key={`worker-skeleton-${index}`} />
                ))
              : realWorkers
                  .slice(0, 4)
                  .map((worker) => (
                    <WorkerCardFeed key={worker.id} worker={worker} />
                  ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PrimaryActionCard({
  mode,
  pendingLeads,
  topMission,
  openMissionCount,
  quotaExceeded,
}: {
  mode: "pro" | "client";
  pendingLeads: number;
  topMission?: MissionResponse;
  openMissionCount: number;
  quotaExceeded: boolean;
}) {
  const isPro = mode === "pro";
  const href = quotaExceeded
    ? "/settings/subscription"
    : pendingLeads > 0
      ? "/leads/mine"
      : topMission
        ? `/missions/${topMission.id}`
        : isPro
          ? "/missions"
          : "/missions/new";
  const cta = quotaExceeded
    ? "Debloquer le plan"
    : pendingLeads > 0
      ? "Traiter les demandes"
      : topMission
        ? "Ouvrir la mission"
        : isPro
          ? "Trouver une mission"
          : "Publier une mission";
  const title = quotaExceeded
    ? "Ton plan limite la prochaine action"
    : pendingLeads > 0
      ? `${pendingLeads} demande${pendingLeads > 1 ? "s" : ""} a traiter`
      : topMission
        ? topMission.title
        : isPro
          ? "Trouve une mission rentable pres de toi"
          : "Confie une mission a un pro verifie";
  const body = quotaExceeded
    ? "Passe au plan adapte pour continuer sans friction."
    : pendingLeads > 0
      ? "Accepte, refuse ou qualifie les opportunites pendant qu'elles sont chaudes."
      : topMission
        ? `${topMission.category} · ${topMission.city} · ${topMission.price}$`
        : isPro
          ? `${openMissionCount} opportunite${openMissionCount > 1 ? "s" : ""} ouverte${openMissionCount > 1 ? "s" : ""} sur WorkOn.`
          : "Publie le besoin, protege le contrat, paie seulement avec confiance.";

  return (
    <section className="workon-dark-panel overflow-hidden rounded-[24px] p-5 shadow-[0_18px_40px_rgba(8,34,25,0.24)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/78">
            <Sparkles className="h-3.5 w-3.5 text-workon-gold" />
            A faire maintenant
          </p>
          <h2 className="font-heading text-2xl font-bold leading-tight text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/72">{body}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-workon-gold">
          {isPro ? <Briefcase className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] text-white/72">
        <TrustMini icon={ShieldCheck} label="Identite" value="verifiee" />
        <TrustMini icon={CreditCard} label="Paiement" value="securise" />
        <TrustMini icon={FileCheck} label="Contrat" value="protege" />
      </div>

      <Button asChild variant="inverse" className="mt-5 h-12 w-full rounded-2xl">
        <Link href={href}>
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof Briefcase;
}) {
  return (
    <div className="workon-premium-card rounded-2xl p-3">
      <Icon className="mb-2 h-4 w-4 text-workon-primary" />
      <p className="font-heading text-xl font-bold leading-none text-workon-ink">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-workon-stone">
        {label}
      </p>
      <p className="mt-0.5 text-[11px] text-workon-muted">{detail}</p>
    </div>
  );
}

function MissionDashboardCard({ mission }: { mission: MissionResponse }) {
  return (
    <Link
      href={`/missions/${mission.id}`}
      className="block rounded-[22px] border border-workon-border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold leading-snug text-workon-ink">
            {mission.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-workon-muted">
            <span className="font-medium text-workon-copper">
              {mission.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {mission.city}
            </span>
            <span className="font-semibold text-workon-ink">
              {mission.price}$
            </span>
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
            missionStatusColor(mission.status),
          )}
        >
          {missionStatusLabel(mission.status)}
        </span>
      </div>
      <MissionProgressBar status={mission.status} className="mt-4" />
    </Link>
  );
}

function ToDoSection({
  pendingLeads,
  quotaExceeded,
  mode,
}: {
  pendingLeads: number;
  quotaExceeded: boolean;
  mode: "pro" | "client";
}) {
  const items = [];
  if (pendingLeads > 0) {
    items.push({
      id: "leads",
      href: "/leads/mine",
      icon: Inbox,
      title: `${pendingLeads} lead${pendingLeads > 1 ? "s" : ""} en attente`,
      detail: "Reponds vite pour maximiser tes chances.",
      tone: "primary" as const,
    });
  }
  if (quotaExceeded) {
    items.push({
      id: "quota",
      href: "/settings/subscription",
      icon: CreditCard,
      title: "Limite gratuite atteinte",
      detail: "Choisis le plan qui garde ton activite en mouvement.",
      tone: "copper" as const,
    });
  }
  if (items.length === 0) {
    items.push({
      id: "next",
      href: mode === "pro" ? "/missions" : "/missions/new",
      icon: Clock3,
      title: mode === "pro" ? "Cherche une mission active" : "Publie ton besoin",
      detail:
        mode === "pro"
          ? "Les opportunites proches de toi sont centralisees dans Missions."
          : "WorkOn structure la demande, le contrat et le paiement.",
      tone: "neutral" as const,
    });
  }

  return (
    <section className="space-y-3">
      <SectionHeader eyebrow="Priorite" title="Actions rapides" />
      <div className="space-y-2">
        {items.map((item) => (
          <ActionRow key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}

function ActionRow({
  href,
  icon: Icon,
  title,
  detail,
  tone,
}: {
  href: string;
  icon: typeof Inbox;
  title: string;
  detail: string;
  tone: "primary" | "copper" | "neutral";
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-workon-border bg-white p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          tone === "primary" && "bg-workon-primary-subtle text-workon-primary",
          tone === "copper" && "bg-workon-accent-subtle text-workon-copper",
          tone === "neutral" && "bg-workon-bg-cream text-workon-stone",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-workon-ink">
          {title}
        </span>
        <span className="block truncate text-xs text-workon-muted">
          {detail}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-workon-stone" />
    </Link>
  );
}

function TrustStrip({ labels }: { labels: string[] }) {
  const icons = [ShieldCheck, FileCheck, BadgeCheck];
  return (
    <div className="rounded-[22px] border border-workon-border bg-workon-bg-cream/70 p-3">
      <div className="grid grid-cols-3 gap-2">
        {labels.map((label, index) => {
          const Icon = icons[index] ?? CheckCircle2;
          return (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/60 px-2 py-3 text-center"
            >
              <Icon className="h-4 w-4 text-workon-primary" />
              <span className="text-[10px] font-semibold leading-tight text-workon-stone">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyActionCard({
  mode,
  copy,
}: {
  mode: "pro" | "client";
  copy: { welcomeBanner: string; welcomeCta: string };
}) {
  return (
    <div className="rounded-[22px] border border-workon-border bg-white p-5 text-center shadow-card">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-workon-primary-subtle text-workon-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="font-semibold text-workon-ink">{copy.welcomeBanner}</p>
      <p className="mt-1 text-sm text-workon-muted">
        {mode === "pro"
          ? "Commence par les missions ouvertes ou complete ton profil pour inspirer confiance."
          : "Decris le besoin, compare les pros et garde le paiement protege."}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
        <Link href={mode === "pro" ? "/missions" : "/pros"}>
          {copy.welcomeCta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-workon-copper">
          {eyebrow}
        </p>
        <h2 className="font-heading text-lg font-bold text-workon-ink">
          {title}
        </h2>
      </div>
      {href && action && (
        <Link
          href={href}
          className="shrink-0 text-xs font-bold text-workon-primary hover:text-workon-primary-hover"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function TrustMini({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-2 py-2">
      <Icon className="mb-1 h-3.5 w-3.5 text-workon-gold" />
      <p className="text-[9px] font-bold uppercase tracking-wide text-white/48">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-white">{value}</p>
    </div>
  );
}

function toDisplayWorkers(featured: FeaturedWorker[]): WorkerProfile[] {
  return featured
    .filter((worker) => {
      const first = (worker.firstName ?? "").trim();
      const last = (worker.lastName ?? "").trim();
      if (first.length < 2 || last.length < 2) return false;
      const full = `${first} ${last}`.toLowerCase();
      return !(
        full.startsWith("test") ||
        full.includes("smoke") ||
        full.includes("john doe") ||
        first.toLowerCase() === "release" ||
        last.toLowerCase() === "test"
      );
    })
    .map((worker) => ({
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      city: worker.city,
      photoUrl: worker.photoUrl,
      category: worker.sector ?? undefined,
      jobTitle: worker.jobTitle ?? undefined,
      hourlyRate: worker.hourlyRate ?? undefined,
      bio: worker.bio ?? null,
      skills: worker.skills ?? [],
      availabilityPreview: worker.availabilityPreview ?? [],
      portfolioPhotos: worker.portfolioPhotos ?? [],
      averageRating: worker.ratingAvg,
      reviewCount: worker.ratingCount,
      completionPercentage: 0,
      completedMissions: worker.completedMissions,
      badges: worker.badges,
      trustTier: worker.trustTier,
    }));
}

function formatMoneyFromMissions(missions: MissionResponse[]) {
  const total = missions.reduce((sum, mission) => sum + (mission.price ?? 0), 0);
  if (total <= 0) return "0$";
  if (total >= 1000) return `${Math.round(total / 100) / 10}k$`;
  return `${total}$`;
}
