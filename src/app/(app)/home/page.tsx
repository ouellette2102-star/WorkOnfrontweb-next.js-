"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { WorkerCardFeed } from "@/components/worker/worker-card-feed";
import { Button } from "@/components/ui/button";
import { MissionProgressBar } from "@/components/mission/mission-progress-bar";
import { SkeletonWorkerCard } from "@/components/ui/skeleton";
import { getFeaturedWorkers, type FeaturedWorker } from "@/lib/public-api";
import type { WorkerProfile } from "@/lib/api-client";
import {
  ArrowRight,
  Inbox,
  Crown,
  ShieldCheck,
  FileCheck,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { missionStatusLabel, missionStatusColor } from "@/lib/i18n-labels";

/**
 * Home v2 — dashboard contextuel.
 *
 * Principe: pas de CTA dupliqué (le RedPhone FAB de la BottomNav est
 * la seule action primaire). La home raconte à l'utilisateur ce qui
 * se passe dans son univers et propose 3 sections dynamiques qui ne
 * s'affichent QUE si elles ont du contenu utile.
 *
 * 1. Greeting + stats live (toujours)
 * 2. À TRAITER — notifs actionnables (leads, contrats, reviews)
 * 3. MISSIONS EN COURS — avec timeline visuelle
 * 4. AUTOUR DE TOI — carousel 3 pros recommandés
 * 5. Trust footer compact
 *
 * Conçue pour être lue comme un feed: scroll, reconnaissance visuelle,
 * tap sur ce qui intéresse.
 */
export default function HomePage() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: () => api.getHomeStats(),
    staleTime: 60_000,
  });

  const { data: featured, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ["featured-workers-public"],
    // Over-fetch: the client-side blacklist below can drop a handful of
    // results, and the backend now ranks real profiles first via a
    // jobTitle/category filter. 24 keeps ~8 real cards reachable even if
    // seed/test accounts slip through.
    queryFn: () => getFeaturedWorkers(24),
    staleTime: 60_000,
  });

  // Adapt public FeaturedWorker to the WorkerProfile shape used by
  // WorkerCard. Fields absent from the public DTO become undefined /
  // zero — WorkerCard renders conditionally on each.
  const realWorkers: WorkerProfile[] = (featured ?? [])
    .filter((w: FeaturedWorker) => {
      const first = (w.firstName ?? "").trim();
      const last = (w.lastName ?? "").trim();
      if (first.length < 2 || last.length < 2) return false;
      const full = `${first} ${last}`.toLowerCase();
      if (
        full.startsWith("test") ||
        full.includes("smoke") ||
        full.includes("john doe") ||
        first.toLowerCase() === "release" ||
        last.toLowerCase() === "test"
      )
        return false;
      return true;
    })
    .map((w: FeaturedWorker) => ({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      city: w.city,
      photoUrl: w.photoUrl,
      category: w.sector ?? undefined,
      jobTitle: w.jobTitle ?? undefined,
      hourlyRate: w.hourlyRate ?? undefined,
      bio: w.bio ?? null,
      skills: w.skills ?? [],
      availabilityPreview: w.availabilityPreview ?? [],
      portfolioPhotos: w.portfolioPhotos ?? [],
      averageRating: w.ratingAvg,
      reviewCount: w.ratingCount,
      completionPercentage: 0,
      completedMissions: w.completedMissions,
      badges: w.badges,
      trustTier: w.trustTier,
    }));

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

  // Union: home shows both so a user with mixed activity sees everything.
  const myMissions = [
    ...(myClientMissions ?? []),
    ...(myProMissions ?? []),
  ];
  const activeMissions = myMissions.filter(
    (m) =>
      m.status === "open" ||
      m.status === "assigned" ||
      m.status === "in_progress",
  );

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

  const pendingLeads =
    leadsData?.deliveries?.filter(
      (d) => !d.acceptedAt && !d.declinedAt,
    ) ?? [];

  const todayLabel = new Date().toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const proCount = stats?.activeWorkers ?? realWorkers.length;
  const missionsThisMonth = stats?.openServiceCalls ?? 0;

  return (
    <div className="space-y-5 px-4 py-5 pb-24">
      {/* ── 1. Greeting ─────────────────────────────────────────── */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-workon-ink">
          Bonjour {user?.firstName || ""} 👋
        </h1>
        <p className="text-xs text-workon-muted capitalize">
          {todayLabel}
          {user?.city ? ` · ${user.city}` : ""}
        </p>
      </header>

      {/* Live stats — une ligne dense */}
      {proCount > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-workon-border bg-white px-4 py-2.5 shadow-card text-xs text-workon-gray">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span>
            <strong className="text-workon-ink">{proCount}</strong> pros
            actifs
            {missionsThisMonth > 0 ? (
              <>
                {" · "}
                <strong className="text-workon-ink">
                  {missionsThisMonth}
                </strong>{" "}
                missions ouvertes
              </>
            ) : null}
          </span>
        </div>
      )}

      {/* ── 2. À TRAITER ────────────────────────────────────────── */}
      <ToDoSection
        pendingLeads={pendingLeads.length}
        quotaExceeded={
          quota && quota.limit !== null && quota.used >= quota.limit
        }
      />

      {/* ── 3. MISSIONS EN COURS ────────────────────────────────── */}
      {activeMissions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-workon-ink uppercase tracking-wide">
              Missions en cours
            </h2>
            <Link
              href="/missions/mine"
              className="text-xs text-workon-primary hover:underline font-medium"
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {activeMissions.slice(0, 3).map((m) => (
              <Link
                key={m.id}
                href={`/missions/${m.id}`}
                className="block rounded-2xl bg-white border border-workon-border p-4 shadow-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-workon-ink truncate">
                      {m.title}
                    </p>
                    <p className="text-xs text-workon-muted mt-0.5">
                      {m.category}
                      {m.city ? ` · ${m.city}` : ""}
                      {m.price ? ` · ${m.price}$` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${missionStatusColor(m.status)}`}
                  >
                    {missionStatusLabel(m.status)}
                  </span>
                </div>
                <MissionProgressBar status={m.status} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. AUTOUR DE TOI ────────────────────────────────────── */}
      {(isLoadingWorkers || realWorkers.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-workon-ink uppercase tracking-wide">
              Autour de toi
            </h2>
            <Link
              href="/swipe"
              className="text-xs text-workon-primary hover:underline font-medium"
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-4 max-w-[520px] mx-auto">
            {isLoadingWorkers
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonWorkerCard key={`skel-${i}`} />
                ))
              : realWorkers.slice(0, 8).map((w) => (
                  <WorkerCardFeed key={w.id} worker={w} />
                ))}
          </div>
        </section>
      )}

      {/* Empty state — tout neuf, aucune mission, aucun pro */}
      {activeMissions.length === 0 &&
        realWorkers.length === 0 &&
        pendingLeads.length === 0 && (
          <div className="rounded-2xl bg-white border border-workon-border p-6 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-workon-primary/10">
              <Sparkles className="h-5 w-5 text-workon-primary" />
            </div>
            <p className="text-sm font-semibold text-workon-ink">
              Bienvenue sur WorkOn
            </p>
            <p className="text-xs text-workon-muted mt-1">
              Commence en appelant un pro — le bouton rouge en bas.
            </p>
          </div>
        )}

      {/* ── 5. Trust footer compact ─────────────────────────────── */}
      <div className="rounded-2xl bg-workon-bg-cream/60 border border-workon-border p-3">
        <div className="grid grid-cols-3 gap-2 text-[11px] text-workon-gray">
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-workon-primary" />
            <span>Paiement Stripe</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <FileCheck className="h-3.5 w-3.5 text-workon-primary" />
            <span>Contrat auto</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <BadgeCheck className="h-3.5 w-3.5 text-workon-primary" />
            <span>Pros vérifiés</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Actionable cards — shown in priority order. Section hidden entirely
 * if nothing to show.
 */
function ToDoSection({
  pendingLeads,
  quotaExceeded,
}: {
  pendingLeads: number;
  quotaExceeded: boolean | null | undefined;
}) {
  const cards: Array<{
    key: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    href: string;
    cta: string;
    accent?: "primary" | "amber" | "violet";
  }> = [];

  if (pendingLeads > 0) {
    cards.push({
      key: "leads",
      icon: <Inbox className="h-5 w-5" />,
      title: `${pendingLeads} nouvelle${pendingLeads > 1 ? "s" : ""} demande${pendingLeads > 1 ? "s" : ""}`,
      subtitle: "Dans ta zone · à accepter ou décliner",
      href: "/leads/mine",
      cta: "Voir",
      accent: "primary",
    });
  }

  if (quotaExceeded) {
    cards.push({
      key: "paywall",
      icon: <Crown className="h-5 w-5" />,
      title: "Limite gratuite atteinte",
      subtitle: "Passe Pro pour publier en illimité",
      href: "/pricing",
      cta: "Upgrader",
      accent: "amber",
    });
  }

  // Note: leads upsell moved to /leads/mine where it's contextually relevant
  // (the page showing leads usage + plan gating).

  if (cards.length === 0) return null;

  const accentClasses: Record<string, string> = {
    primary:
      "bg-workon-primary-subtle border-workon-primary/25 text-workon-primary",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    violet: "bg-violet-50 border-violet-200 text-violet-800",
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-workon-ink uppercase tracking-wide">
        À traiter
      </h2>
      <div className="space-y-2">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className={`flex items-center gap-3 rounded-2xl border p-3 shadow-card hover:shadow-md transition-shadow ${
              accentClasses[c.accent ?? "primary"]
            }`}
          >
            <div className="shrink-0">{c.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{c.title}</p>
              <p className="text-xs opacity-80 truncate">{c.subtitle}</p>
            </div>
            <Button
              variant="ghost"
              className="shrink-0 h-8 px-2 text-xs hover:bg-transparent"
            >
              {c.cta}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        ))}
      </div>
    </section>
  );
}
