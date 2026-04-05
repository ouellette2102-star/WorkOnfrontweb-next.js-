"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { getWorkerMissions } from "@/lib/missions-api";
import { getMissionTimeLogs } from "@/lib/mission-time-logs-api";
import { MissionStatus, type Mission } from "@/types/mission";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import { MissionPhotosModal } from "@/components/worker/mission-photos-modal";

export function MissionHistoryCard() {
  const { isLoading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<string, number>>({});

  const loadMissions = async () => {
    if (authLoading) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const allMissions = await getWorkerMissions(token);
      
      // Filtrer pour garder seulement COMPLETED
      const completed = allMissions.filter(
        (m) => m.status === MissionStatus.COMPLETED
      ).slice(0, 5); // Limiter à 5 pour la vue dashboard

      setMissions(completed);

      // Charger les durées pour chaque mission
      const durationMap: Record<string, number> = {};
      await Promise.all(
        completed.map(async (mission) => {
          try {
            const logs = await getMissionTimeLogs(token, mission.id);
            
            let total = 0;
            let lastCheckIn: Date | null = null;

            logs.forEach((log) => {
              if (log.type === "CHECK_IN") {
                lastCheckIn = new Date(log.timestamp);
              } else if (log.type === "CHECK_OUT" && lastCheckIn) {
                const checkOut = new Date(log.timestamp);
                const duration = (checkOut.getTime() - lastCheckIn.getTime()) / 1000 / 60;
                total += duration;
                lastCheckIn = null;
              }
            });

            durationMap[mission.id] = Math.round(total);
          } catch (error) {
            console.error(`Erreur pour mission ${mission.id}:`, error);
            durationMap[mission.id] = 0;
          }
        })
      );

      setDurations(durationMap);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, [authLoading]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const calculateEarnings = (mission: Mission) => {
    if (!mission.hourlyRate) return 0;
    const duration = durations[mission.id] || 0;
    const hours = duration / 60;
    return hours * mission.hourlyRate;
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Historique des Missions
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-white/10 bg-neutral-800/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Historique des Missions
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="mb-2 text-4xl">📋</span>
          <p className="text-white/70">Aucune mission complétée pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Historique des Missions
        </h2>

        <div className="space-y-3">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="group flex items-center justify-between rounded-xl border border-white/10 bg-neutral-800/50 p-4 backdrop-blur"
            >
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="font-semibold text-white">{mission.title}</h4>
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400">
                    ✅ Complétée
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  {mission.city && <span>📍 {mission.city}</span>}
                  
                  {mission.completedAt && (
                    <span>
                      📅 {format(new Date(mission.completedAt), "PP", { locale: frCA })}
                    </span>
                  )}

                  {durations[mission.id] > 0 && (
                    <span className="font-semibold">
                      ⏱️ {formatDuration(durations[mission.id])}
                    </span>
                  )}

                  {mission.hourlyRate && durations[mission.id] > 0 && (
                    <span className="font-semibold text-green-400">
                      💰 {calculateEarnings(mission).toFixed(2)} $
                    </span>
                  )}
                </div>
              </div>

              <div className="ml-4 flex gap-2">
                <Button
                  onClick={() => setSelectedMissionId(mission.id)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-neutral-700"
                  size="sm"
                >
                  📸 Photos
                </Button>
              </div>
            </div>
          ))}
        </div>

        {missions.length >= 5 && (
          <p className="mt-4 text-center text-sm text-white/50">
            Affichage des 5 dernières missions complétées
          </p>
        )}
      </div>

      {/* Modal Photos */}
      {selectedMissionId && (
        <MissionPhotosModal
          missionId={selectedMissionId}
          onClose={() => setSelectedMissionId(null)}
        />
      )}
    </>
  );
}

