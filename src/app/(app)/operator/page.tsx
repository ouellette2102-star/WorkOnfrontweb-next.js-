"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { safeLocalStorage } from "@/lib/safe-storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Zap,
  MapPin,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle,
  Loader2,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";

/**
 * /operator — CEO Operations Dashboard
 *
 * Shows open missions + available workers side by side.
 * Allows manual matching: assign a worker to a mission in 1 click.
 * This is how Uber started — manual dispatch before algorithm.
 */
export default function OperatorPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [matchingId, setMatchingId] = useState<string | null>(null);

  // Fetch open missions
  const { data: missions, isLoading: loadingMissions } = useQuery({
    queryKey: ["operator-missions"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/missions-local/nearby?latitude=45.5&longitude=-73.5&radiusKm=100`,
        {
          headers: {
            Authorization: `Bearer ${safeLocalStorage.getItem("workon_token") ?? ""}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to load missions");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  // Fetch available workers
  const { data: workers, isLoading: loadingWorkers } = useQuery({
    queryKey: ["operator-workers"],
    queryFn: () => api.getSwipeCandidates({ role: "worker" }),
    refetchInterval: 30_000,
  });

  const openMissions = (missions || []).filter(
    (m: any) => m.status === "open" && !m.assignedToUserId
  );
  const activeMissions = (missions || []).filter(
    (m: any) => m.status !== "open" && m.status !== "cancelled"
  );

  // Category color mapping
  const catColors: Record<string, string> = {
    entretien: "bg-blue-100 text-blue-700",
    reparation: "bg-orange-100 text-orange-700",
    "construction-legere": "bg-amber-100 text-amber-700",
    paysagement: "bg-green-100 text-green-700",
    cleaning: "bg-cyan-100 text-cyan-700",
    other: "bg-gray-100 text-gray-700",
  };

  // Find best worker match for a mission category
  const getBestMatch = (category: string) => {
    if (!workers?.length) return null;
    // Prefer workers with matching category, then by rating
    const matched = workers.filter(
      (w: any) => w.category === category || !w.category
    );
    return matched.length > 0 ? matched[0] : workers[0];
  };

  if (loadingMissions || loadingWorkers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-workon-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-workon-bg pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#134021] to-[#1A5C2E] px-4 py-6 text-white">
        <h1 className="text-2xl font-bold">Centre de commande</h1>
        <p className="text-sm text-white/70">Pilotage marketplace en temps réel</p>

        {/* KPI bar */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <div className="text-2xl font-bold">{openMissions.length}</div>
            <div className="text-[10px] text-white/60">En attente</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <div className="text-2xl font-bold">{activeMissions.length}</div>
            <div className="text-[10px] text-white/60">Actives</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <div className="text-2xl font-bold">{workers?.length || 0}</div>
            <div className="text-[10px] text-white/60">Workers</div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-center">
            <div className="text-2xl font-bold">
              {openMissions.length > 0 && workers?.length
                ? Math.round(
                    (Math.min(openMissions.length, workers.length) /
                      Math.max(openMissions.length, 1)) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-[10px] text-white/60">Match rate</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Open missions needing workers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-workon-accent" />
            <h2 className="text-lg font-bold text-workon-ink">
              Missions en attente ({openMissions.length})
            </h2>
          </div>

          {openMissions.length === 0 ? (
            <div className="rounded-2xl border border-workon-border bg-white p-8 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2" />
              <p className="text-workon-muted">Toutes les missions sont assignées</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openMissions.slice(0, 10).map((mission: any) => {
                const bestWorker = getBestMatch(mission.category);
                const isMatching = matchingId === mission.id;

                return (
                  <div
                    key={mission.id}
                    className="rounded-2xl border border-workon-border bg-white p-4 shadow-sm"
                  >
                    {/* Mission info */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-workon-ink text-sm truncate">
                          {mission.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              catColors[mission.category] || catColors.other
                            }`}
                          >
                            {mission.category}
                          </span>
                          {mission.city && (
                            <span className="text-xs text-workon-muted flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {mission.city}
                            </span>
                          )}
                          {mission.price > 0 && (
                            <span className="text-xs text-workon-muted flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />
                              {mission.price}$
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-workon-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(mission.createdAt).toLocaleDateString("fr-CA")}
                      </div>
                    </div>

                    {/* Best match suggestion */}
                    {bestWorker && (
                      <div className="flex items-center gap-3 rounded-xl bg-workon-bg p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-workon-primary/10">
                          <Users className="h-4 w-4 text-workon-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-workon-ink">
                            {bestWorker.firstName} {bestWorker.lastName}
                          </p>
                          <p className="text-[10px] text-workon-muted">
                            {bestWorker.city || "Montreal"} · {bestWorker.avgRating > 0 ? `${bestWorker.avgRating}★` : "Nouveau"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-workon-primary text-white text-xs h-8 px-3"
                          disabled={isMatching}
                          onClick={async () => {
                            setMatchingId(mission.id);
                            try {
                              // Swipe LIKE on behalf of the operator
                              await api.recordSwipe({
                                candidateId: bestWorker.id,
                                action: "SUPERLIKE",
                              });
                              toast.success(
                                `${bestWorker.firstName} notifié pour "${mission.title.substring(0, 30)}"`
                              );
                              queryClient.invalidateQueries({
                                queryKey: ["operator-missions"],
                              });
                            } catch {
                              toast.error("Erreur lors du matching");
                            } finally {
                              setMatchingId(null);
                            }
                          }}
                        >
                          {isMatching ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Matcher
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active missions */}
        {activeMissions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-bold text-workon-ink">
                Missions actives ({activeMissions.length})
              </h2>
            </div>
            <div className="space-y-2">
              {activeMissions.slice(0, 5).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-workon-border bg-white p-3"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      m.status === "completed"
                        ? "bg-green-500"
                        : m.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-workon-ink truncate">
                      {m.title}
                    </p>
                  </div>
                  <span className="text-[10px] rounded-full bg-workon-bg px-2 py-0.5 text-workon-muted capitalize">
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick stats footer */}
        <div className="rounded-2xl border border-dashed border-workon-border p-4 text-center">
          <p className="text-xs text-workon-muted">
            Données live · Rafraîchissement auto 30s · {new Date().toLocaleString("fr-CA")}
          </p>
        </div>
      </div>
    </div>
  );
}
