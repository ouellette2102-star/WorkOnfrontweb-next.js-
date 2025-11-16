"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getAvailableMissions } from "@/lib/missions-api";
import type { Mission } from "@/types/mission";
import { MissionCard } from "@/components/missions/mission-card";

export default function AvailableMissionsPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setError("Tu dois être connecté pour voir les missions");
      setIsLoading(false);
      return;
    }

    const loadMissions = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
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
    };

    loadMissions();
  }, [isLoaded, isSignedIn, getToken]);

  const handleSelectMission = (mission: Mission) => {
    console.log("Mission sélectionnée:", mission);
    // TODO: Navigation vers la page de détails
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
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
              <p className="text-white/70">Chargement des missions...</p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Liste des missions */}
        {!isLoading && !error && missions.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="mb-4 text-5xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Aucune mission disponible
            </h3>
            <p className="text-white/70">
              Les nouvelles missions apparaîtront ici dès qu'elles seront publiées
            </p>
          </div>
        )}

        {!isLoading && !error && missions.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onSelect={handleSelectMission}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

