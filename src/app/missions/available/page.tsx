"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { getAvailableMissions } from "@/lib/missions-api";
import type { Mission } from "@/types/mission";
import { MissionCard } from "@/components/missions/mission-card";
import { ReserveMissionButton } from "@/components/missions/reserve-mission-button";
import { MissionActions } from "@/components/missions/mission-actions";
import { MissionTimeTracking } from "@/components/missions/mission-time-tracking";
import { MissionPhotos } from "@/components/missions/mission-photos";
import { RequireWorkerClient } from "@/components/auth/require-worker-client";

export default function AvailableMissionsPage() {
  return (
    <RequireWorkerClient>
      <AvailableMissionsContent />
    </RequireWorkerClient>
  );
}

function AvailableMissionsContent() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMissions = useCallback(async () => {
    if (authLoading || !isAuthenticated) return;

    try {
      setIsLoading(true);
      const token = getAccessToken();
      if (!token) {
        setError("Impossible de récupérer le token");
        return;
      }

      const data = await getAvailableMissions(token);
      setMissions(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des missions",
      );
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setError("Tu dois être connecté pour voir les missions");
      setIsLoading(false);
      return;
    }

    loadMissions();
  }, [authLoading, isAuthenticated, loadMissions]);

  const handleReservationSuccess = (updatedMission: Mission) => {
    // Mise à jour optimiste de la liste
    setMissions((prev) =>
      prev.map((m) => (m.id === updatedMission.id ? updatedMission : m)),
    );
  };

  return (
    <div className="min-h-screen bg-neutral-900 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Missions disponibles
          </h1>
          <p className="text-white/70">
            Trouve des missions qui correspondent à tes compétences
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#FF4D1C] border-t-transparent"></div>
              <p className="text-white/70">Chargement des missions...</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && !isLoading && (
          <div className="rounded-3xl border border-[#FF4D1C]/30 bg-[#FF4D1C]/5 p-6 text-center shadow-lg shadow-black/20">
            <p className="text-[#FF4D1C]">{error}</p>
          </div>
        )}

        {/* Liste des missions */}
        {!isLoading && !error && missions.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center shadow-lg shadow-black/20">
            <div className="mb-4 text-5xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucune mission disponible
            </h3>
            <p className="text-white/70">
              Les nouvelles missions apparaîtront ici dès qu&apos;elles seront publiées
            </p>
          </div>
        )}

        {!isLoading && !error && missions.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-neutral-800/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20 transition-all hover:border-[#FF4D1C]/30 hover:shadow-xl hover:shadow-[#FF4D1C]/10"
              >
                <MissionCard mission={mission} />
                <MissionActions mission={mission} />
                <MissionTimeTracking mission={mission} />
                <MissionPhotos mission={mission} />
                <ReserveMissionButton
                  mission={mission}
                  onSuccess={handleReservationSuccess}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

