"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { getWorkerMissions } from "@/lib/missions-api";
import { MissionStatus, type Mission } from "@/types/mission";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import Link from "next/link";
import { MissionTimeTracker } from "@/components/worker/mission-time-tracker";
import { toast } from "sonner";

export function ActiveMissionsCard() {
  const { isLoading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMissions = async () => {
    if (authLoading) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const allMissions = await getWorkerMissions(token);
      
      // Filtrer pour garder seulement RESERVED et IN_PROGRESS
      const active = allMissions.filter(
        (m) => m.status === MissionStatus.RESERVED || m.status === MissionStatus.IN_PROGRESS
      );

      setMissions(active);
    } catch (error) {
      console.error("Erreur lors du chargement des missions actives:", error);
      toast.error("Impossible de charger les missions actives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, [authLoading]);

  const getStatusBadge = (status: MissionStatus) => {
    switch (status) {
      case MissionStatus.RESERVED:
        return (
          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-400">
            📌 Réservée
          </span>
        );
      case MissionStatus.IN_PROGRESS:
        return (
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
            🔄 En cours
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Mes Missions Actives
        </h2>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-white/10 bg-neutral-800/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Mes Missions Actives
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 text-6xl">📭</span>
          <p className="mb-2 text-lg font-semibold text-white">
            Aucune mission active
          </p>
          <p className="text-white/70">
            Commence par réserver une mission disponible
          </p>
          <Link href="/worker/missions">
            <Button className="mt-4 rounded-xl bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-500">
              Voir les missions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Mes Missions Actives
        </h2>
        <span className="text-sm text-white/50">
          {missions.length} mission{missions.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="group overflow-hidden rounded-xl border border-white/10 bg-neutral-800/50 backdrop-blur transition hover:border-red-500/50"
          >
            <div className="p-6">
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-xl font-bold text-white">
                    {mission.title}
                  </h3>
                  {mission.city && (
                    <p className="text-sm text-white/60">📍 {mission.city}</p>
                  )}
                </div>
                {getStatusBadge(mission.status)}
              </div>

              {/* Infos */}
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                {mission.hourlyRate && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">💰</span>
                    <span className="font-semibold text-green-400">
                      {mission.hourlyRate.toFixed(2)} $ / heure
                    </span>
                  </div>
                )}
                
                {mission.startsAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">📅</span>
                    <span className="text-sm text-white">
                      {format(new Date(mission.startsAt), "PPP", { locale: frCA })}
                    </span>
                  </div>
                )}
              </div>

              {/* Time Tracker pour IN_PROGRESS */}
              {mission.status === MissionStatus.IN_PROGRESS && (
                <div className="mb-4">
                  <MissionTimeTracker missionId={mission.id} />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Link href={`/missions/${mission.id}`}>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-neutral-700"
                  >
                    Voir détails
                  </Button>
                </Link>

                {mission.status === MissionStatus.RESERVED && (
                  <Button className="bg-green-600 text-white hover:bg-green-500">
                    ▶️ Démarrer la mission
                  </Button>
                )}

                {mission.status === MissionStatus.IN_PROGRESS && (
                  <Button className="bg-red-600 text-white hover:bg-red-500">
                    ⏹️ Terminer la mission
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

