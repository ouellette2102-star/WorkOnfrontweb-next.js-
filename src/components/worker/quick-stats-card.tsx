"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { MissionStatus, missionResponseToMission } from "@/types/mission";

export function QuickStatsCard() {
  const { isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
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

        // Calcul approximatif des gains (à améliorer avec le time tracking réel)
        const totalEarnings = missions
          .filter((m) => m.status === MissionStatus.COMPLETED)
          .reduce((sum, m) => sum + (m.priceCents / 100), 0);

        setStats({ active, completed, totalEarnings });
      } catch (error) {
        console.error("Erreur lors du chargement des stats:", error);
        const errorMessage = error instanceof Error ? error.message : "Impossible de charger les statistiques";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [authLoading]);

  if (isLoading) {
    return (
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-3xl border border-gray-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
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

  return (
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      {/* Missions actives */}
      <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-3xl">🔥</span>
          <span className="text-3xl font-bold text-orange-600">{stats.active}</span>
        </div>
        <h4 className="text-lg font-semibold text-gray-900">Missions actives</h4>
        <p className="text-sm text-gray-500">En cours ou réservées</p>
      </div>

      {/* Missions complétées */}
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-3xl">✅</span>
          <span className="text-3xl font-bold text-green-600">{stats.completed}</span>
        </div>
        <h4 className="text-lg font-semibold text-gray-900">Complétées</h4>
        <p className="text-sm text-gray-500">Missions terminées</p>
      </div>

      {/* Gains totaux */}
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-3xl">💰</span>
          <span className="text-3xl font-bold text-amber-600">
            {stats.totalEarnings.toFixed(0)}$
          </span>
        </div>
        <h4 className="text-lg font-semibold text-gray-900">Gains estimés</h4>
        <p className="text-sm text-gray-500">Missions complétées</p>
      </div>
    </div>
  );
}

