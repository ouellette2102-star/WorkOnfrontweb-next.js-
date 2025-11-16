"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getMyMissions } from "@/lib/missions-api";
import type { Mission } from "@/types/mission";
import { MissionCard } from "@/components/missions/mission-card";
import { MissionStatusActions } from "@/components/missions/mission-status-actions";
import { MissionActions } from "@/components/missions/mission-actions";
import { MissionTimeView } from "@/components/missions/mission-time-view";
import { MissionPhotos } from "@/components/missions/mission-photos";
import { Button } from "@/components/ui/button";

export default function MyMissionsPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMissions = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        setError("Impossible de récupérer le token");
        return;
      }

      const data = await getMyMissions(token);
      setMissions(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de tes missions",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setError("Tu dois être connecté pour voir tes missions");
      setIsLoading(false);
      return;
    }

    loadMissions();
  }, [isLoaded, isSignedIn, loadMissions]);

  const handleStatusUpdateSuccess = (updatedMission: Mission) => {
    // Mise à jour optimiste de la liste
    setMissions((prev) =>
      prev.map((m) => (m.id === updatedMission.id ? updatedMission : m)),
    );
  };

  return (
    <div className="min-h-screen bg-neutral-900 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header avec bouton créer */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">Mes missions</h1>
            <p className="text-white/70">
              Gère toutes les missions que tu as publiées
            </p>
          </div>
          <Button
            onClick={() => router.push("/missions/new")}
            className="rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500"
          >
            + Créer une mission
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
              <p className="text-white/70">Chargement de tes missions...</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Liste vide */}
        {!isLoading && !error && missions.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="mb-4 text-5xl">📝</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucune mission publiée
            </h3>
            <p className="mb-6 text-white/70">
              Crée ta première mission pour trouver des travailleurs qualifiés
            </p>
            <Button
              onClick={() => router.push("/missions/new")}
              className="rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              Créer ma première mission
            </Button>
          </div>
        )}

        {/* Liste des missions */}
        {!isLoading && !error && missions.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur"
              >
                <MissionCard mission={mission} />
                <MissionActions mission={mission} />
                <MissionTimeView mission={mission} />
                <MissionPhotos mission={mission} />
                <MissionStatusActions
                  mission={mission}
                  onSuccess={handleStatusUpdateSuccess}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

