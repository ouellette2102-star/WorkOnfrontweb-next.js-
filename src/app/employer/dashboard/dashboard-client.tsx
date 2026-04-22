"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { SwipeMatch } from "@/lib/api-client";
import { MissionCard } from "@/components/mission/mission-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";

export function EmployerDashboardClient() {
  const { data: missions, isLoading: missionsLoading } = useQuery({
    queryKey: ["my-missions"],
    queryFn: () => api.getMyMissions(),
  });

  const { data: offers } = useQuery({
    queryKey: ["my-offers"],
    queryFn: () => api.getMyOffers(),
  });

  const { data: matches } = useQuery({
    queryKey: ["swipe-matches"],
    queryFn: () => api.getMatches(),
  });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: () => api.getHomeStats(),
  });

  const totalMissions = missions?.length ?? 0;
  const activeMissions =
    missions?.filter(
      (m) =>
        m.status === "open" ||
        m.status === "assigned" ||
        m.status === "in_progress",
    ) ?? [];
  const completedMissions =
    missions?.filter(
      (m) => m.status === "completed" || m.status === "paid",
    ).length ?? 0;
  const pendingOffers =
    offers?.filter((o) => o.status === "PENDING").length ?? 0;
  const activeMatches =
    matches?.filter((m: SwipeMatch) => m.status === "ACTIVE") ?? [];

  // Skeleton placeholder for loading state
  const StatSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 w-16 rounded bg-gray-200" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          {missionsLoading ? (
            <StatSkeleton />
          ) : (
            <p className="text-3xl font-bold text-workon-ink">
              {totalMissions}
            </p>
          )}
          <p className="mt-1 text-sm text-workon-muted">Missions creees</p>
        </div>

        <div className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          {missionsLoading ? (
            <StatSkeleton />
          ) : (
            <p className="text-3xl font-bold text-workon-ink">
              {pendingOffers}
            </p>
          )}
          <p className="mt-1 text-sm text-workon-muted">Offres en attente</p>
        </div>

        <div className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Briefcase className="h-5 w-5 text-emerald-600" />
          </div>
          {missionsLoading ? (
            <StatSkeleton />
          ) : (
            <p className="text-3xl font-bold text-workon-ink">
              {activeMissions.length}
            </p>
          )}
          <p className="mt-1 text-sm text-workon-muted">Missions actives</p>
        </div>

        <div className="rounded-2xl border border-workon-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          {missionsLoading ? (
            <StatSkeleton />
          ) : (
            <p className="text-3xl font-bold text-workon-ink">
              {completedMissions}
            </p>
          )}
          <p className="mt-1 text-sm text-workon-muted">Completees</p>
        </div>
      </div>

      {/* Two-column layout: Active Missions + Recent Matches */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Missions */}
        <div className="rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-workon-ink">
              <Briefcase className="h-5 w-5 text-workon-primary" />
              Missions actives
            </h2>
            <Link
              href="/missions/mine"
              className="text-xs font-medium text-workon-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {activeMissions.length > 0 ? (
            <div className="space-y-3">
              {activeMissions.slice(0, 4).map((m) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  variant="client"
                  showCTA={false}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-workon-primary/10">
                <Briefcase className="h-5 w-5 text-workon-primary" />
              </div>
              <p className="text-sm font-medium text-workon-ink">
                Aucune mission active
              </p>
              <p className="mt-1 text-xs text-workon-muted">
                Publiez votre premiere mission pour trouver un pro.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 bg-workon-primary text-white hover:bg-workon-primary/90"
              >
                <Link href="/missions/new">
                  Creer une mission
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="rounded-2xl border border-workon-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-workon-ink">
              <Users className="h-5 w-5 text-workon-primary" />
              Matches recents
            </h2>
            <Link
              href="/matches"
              className="text-xs font-medium text-workon-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {activeMatches.length > 0 ? (
            <div className="space-y-3">
              {activeMatches.slice(0, 5).map((match: SwipeMatch) => (
                <Link
                  key={match.id}
                  href={`/workers/${match.matchedUserId}`}
                  className="flex items-center gap-3 rounded-xl border border-workon-border p-3 transition-all hover:border-workon-primary/30 hover:bg-workon-bg/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-workon-primary/10 text-sm font-bold text-workon-primary">
                    {match.matchedUser?.firstName?.[0] ?? "?"}
                    {match.matchedUser?.lastName?.[0] ?? ""}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-workon-ink">
                      {match.matchedUser?.firstName}{" "}
                      {match.matchedUser?.lastName}
                    </p>
                    {match.matchedUser?.city && (
                      <p className="truncate text-xs text-workon-muted">
                        {match.matchedUser.city}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-workon-muted" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-workon-primary/10">
                <Users className="h-5 w-5 text-workon-primary" />
              </div>
              <p className="text-sm font-medium text-workon-ink">
                Aucun match pour le moment
              </p>
              <p className="mt-1 text-xs text-workon-muted">
                Swipez des profils pour trouver votre prochain pro.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 bg-workon-primary text-white hover:bg-workon-primary/90"
              >
                <Link href="/pros">
                  Decouvrir des pros
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Platform stats (from backend) */}
      {stats && (
        <div className="rounded-2xl border border-workon-border bg-gradient-to-r from-workon-primary/5 to-transparent p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-workon-muted">
            Plateforme WorkOn
          </p>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-bold text-workon-ink">
                {stats.activeWorkers}
              </p>
              <p className="text-xs text-workon-muted">Pros actifs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-workon-ink">
                {stats.completedContracts}
              </p>
              <p className="text-xs text-workon-muted">Contrats completes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-workon-ink">
                {stats.openServiceCalls}
              </p>
              <p className="text-xs text-workon-muted">Missions ouvertes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
