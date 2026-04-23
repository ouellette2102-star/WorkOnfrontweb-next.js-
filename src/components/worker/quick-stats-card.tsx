"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { MissionStatus, missionResponseToMission } from "@/types/mission";
import { TrustScoreRing } from "./trust-score-ring";

export function QuickStatsCard() {
  const { isLoading: authLoading } = useAuth();
  const [missionStats, setMissionStats] = useState({ active: 0, completed: 0 });
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real earnings from API
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ["earnings-summary"],
    queryFn: () => api.getEarningsSummary(),
    enabled: !authLoading,
  });

  useEffect(() => {
    const loadMissions = async () => {
      if (authLoading) return;

      try {
        setError(null);
        const raw = await api.getMyAssignments();
        const missions = raw.map(missionResponseToMission);

        const active = missions.filter(
          (m) => m.status === MissionStatus.RESERVED || m.status === MissionStatus.IN_PROGRESS
        ).length;

        const completed = missions.filter(
          (m) => m.status === MissionStatus.COMPLETED
        ).length;

        setMissionStats({ active, completed });
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
        const errorMessage = error instanceof Error ? error.message : "Impossible de charger les statistiques";
        setError(errorMessage);
      } finally {
        setMissionsLoading(false);
      }
    };

    loadMissions();
  }, [authLoading]);

  const isLoading = missionsLoading || earningsLoading;

  if (isLoading) {
    return (
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-3xl border border-workon-border bg-white shadow-card"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">!</span>
          <div>
            <h4 className="text-lg font-semibold text-orange-600">Erreur de chargement</h4>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalNet = earnings?.totalNet ?? 0;
  const totalPending = earnings?.totalPending ?? 0;

  return (
    <div className="mb-8 grid gap-4 md:grid-cols-4">
      {/* Missions actives */}
      <div className="border border-workon-border rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl text-workon-accent">*</span>
          <span className="font-heading font-bold text-lg text-workon-ink">{missionStats.active}</span>
        </div>
        <p className="text-[10px] text-workon-gray uppercase tracking-wider">Missions actives</p>
        <p className="text-xs text-workon-gray mt-1">En cours ou reservees</p>
      </div>

      {/* Missions completees */}
      <div className="border border-workon-border rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl text-[#2D8B55]">V</span>
          <span className="font-heading font-bold text-lg text-workon-ink">{missionStats.completed}</span>
        </div>
        <p className="text-[10px] text-workon-gray uppercase tracking-wider">Completees</p>
        <p className="text-xs text-workon-gray mt-1">Missions terminees</p>
      </div>

      {/* Gains nets (real earnings API) */}
      <div className="border border-workon-border rounded-3xl bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl text-[#D4922A]">$</span>
          <span className="font-heading font-bold text-lg text-workon-ink">
            {(totalNet / 100).toFixed(0)}$
          </span>
        </div>
        <p className="text-[10px] text-workon-gray uppercase tracking-wider">Gains nets</p>
        <p className="text-xs text-workon-gray mt-1">
          {totalPending > 0 ? `${(totalPending / 100).toFixed(0)}$ en attente` : "Via Stripe Connect"}
        </p>
      </div>

      {/* Score de confiance */}
      <div className="border border-workon-border rounded-3xl bg-white p-5 shadow-card flex flex-col items-center justify-center">
        <TrustScoreRing size={64} compact />
        <p className="text-[10px] text-workon-gray uppercase tracking-wider mt-2">Score de confiance</p>
      </div>
    </div>
  );
}

