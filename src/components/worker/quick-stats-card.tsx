"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getWorkerMissions } from "@/lib/missions-api";
import { MissionStatus } from "@/types/mission";

export function QuickStatsCard() {
  const { getToken, isLoaded } = useAuth();
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!isLoaded) return;

      try {
        const token = await getToken();
        if (!token) return;

        const missions = await getWorkerMissions(token);
        
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
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [isLoaded, getToken]);

  if (isLoading) {
    return (
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-3xl border border-white/10 bg-neutral-900/70"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      {/* Missions actives */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-red-900/20 to-neutral-900/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-3xl">🔥</span>
          <span className="text-3xl font-bold text-red-400">{stats.active}</span>
        </div>
        <h4 className="text-lg font-semibold text-white">Missions actives</h4>
        <p className="text-sm text-white/60">En cours ou réservées</p>
      </div>

      {/* Missions complétées */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-green-900/20 to-neutral-900/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-3xl">✅</span>
          <span className="text-3xl font-bold text-green-400">{stats.completed}</span>
        </div>
        <h4 className="text-lg font-semibold text-white">Complétées</h4>
        <p className="text-sm text-white/60">Missions terminées</p>
      </div>

      {/* Gains totaux */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-yellow-900/20 to-neutral-900/70 p-6 backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-3xl">💰</span>
          <span className="text-3xl font-bold text-yellow-400">
            {stats.totalEarnings.toFixed(0)}$
          </span>
        </div>
        <h4 className="text-lg font-semibold text-white">Gains estimés</h4>
        <p className="text-sm text-white/60">Missions complétées</p>
      </div>
    </div>
  );
}

