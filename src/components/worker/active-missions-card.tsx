"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { MissionStatus, missionResponseToMission, type Mission } from "@/types/mission";
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
      const raw = await api.getMyAssignments();
      const allMissions = raw.map(missionResponseToMission);

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
          <span className="rounded-full bg-[#D4922A]/10 px-3 py-1 text-xs font-semibold text-[#D4922A]">
            📌 Réservée
          </span>
        );
      case MissionStatus.IN_PROGRESS:
        return (
          <span className="rounded-full bg-workon-primary/10 px-3 py-1 text-xs font-semibold text-workon-primary">
            🔄 En cours
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-workon-border rounded-3xl p-5 shadow-card">
        <h2 className="mb-4 font-heading font-bold text-2xl text-workon-ink">
          Mes Missions Actives
        </h2>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-workon-border bg-workon-bg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="bg-white border border-workon-border rounded-3xl p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading font-bold text-2xl text-workon-ink">
            Mes Missions Actives
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 text-6xl">📭</span>
          <p className="mb-2 text-lg font-semibold text-workon-ink">
            Aucune mission active
          </p>
          <p className="text-workon-gray">
            Commence par réserver une mission disponible
          </p>
          <Link href="/worker/missions">
            <Button className="mt-4 rounded-xl bg-workon-primary px-6 py-2 font-semibold text-white hover:bg-workon-primary-hover">
              Voir les missions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-workon-border rounded-3xl p-5 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading font-bold text-2xl text-workon-ink">
          Mes Missions Actives
        </h2>
        <span className="text-[10px] text-workon-gray uppercase tracking-wider">
          {missions.length} mission{missions.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="group overflow-hidden bg-white border border-workon-border rounded-2xl transition hover:shadow-soft"
          >
            <div className="px-4 py-3.5">
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 text-xl font-bold text-workon-ink">
                    {mission.title}
                  </h3>
                  {mission.city && (
                    <p className="text-sm text-workon-gray">📍 {mission.city}</p>
                  )}
                </div>
                {getStatusBadge(mission.status)}
              </div>

              {/* Infos */}
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                {mission.hourlyRate && (
                  <div className="flex items-center gap-2">
                    <span className="text-workon-gray">💰</span>
                    <span className="font-semibold text-[#2D8B55]">
                      {mission.hourlyRate.toFixed(2)} $ / heure
                    </span>
                  </div>
                )}

                {mission.startsAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-workon-gray">📅</span>
                    <span className="text-sm text-workon-ink">
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
                    className="border-workon-border text-workon-ink hover:bg-workon-bg"
                  >
                    Voir détails
                  </Button>
                </Link>

                {mission.status === MissionStatus.RESERVED && (
                  <Button className="bg-workon-primary text-white hover:bg-workon-primary-hover">
                    ▶️ Démarrer la mission
                  </Button>
                )}

                {mission.status === MissionStatus.IN_PROGRESS && (
                  <Button className="bg-workon-accent text-white hover:bg-workon-accent-hover">
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

