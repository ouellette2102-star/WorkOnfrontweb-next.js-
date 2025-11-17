"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getAvailableMissions, reserveMission } from "@/lib/missions-api";
import type { Mission } from "@/types/mission";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export function AvailableMissionsCard() {
  const { getToken, isLoaded } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const loadMissions = async () => {
    if (!isLoaded) return;

    try {
      const token = await getToken();
      if (!token) return;

      const available = await getAvailableMissions(token);
      // Limiter à 3 pour la version compacte
      setMissions(available.slice(0, 3));
    } catch (error) {
      console.error("Erreur lors du chargement des missions disponibles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, [isLoaded, getToken]);

  const handleReserve = async (missionId: string) => {
    setReservingId(missionId);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentification requise");
        return;
      }

      await reserveMission(token, missionId);
      toast.success("Mission réservée avec succès !");
      loadMissions();
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la réservation"
      );
    } finally {
      setReservingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Missions Disponibles
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Missions Disponibles
          </h2>
          <Link href="/worker/missions">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-neutral-800"
            >
              Voir toutes
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="mb-2 text-4xl">🔍</span>
          <p className="text-white/70">Aucune mission disponible pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Missions Disponibles
        </h2>
        <Link href="/worker/missions">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-neutral-800"
          >
            Voir toutes
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className="group flex items-center justify-between rounded-xl border border-white/10 bg-neutral-800/50 p-4 backdrop-blur transition hover:border-red-500/50"
          >
            <div className="flex-1">
              <h4 className="mb-1 font-semibold text-white">{mission.title}</h4>
              <div className="flex flex-wrap gap-3 text-sm text-white/60">
                {mission.city && <span>📍 {mission.city}</span>}
                {mission.hourlyRate && (
                  <span className="font-semibold text-green-400">
                    💰 {mission.hourlyRate.toFixed(2)} $/h
                  </span>
                )}
                {mission.category && <span>🏷️ {mission.category}</span>}
              </div>
            </div>

            <Button
              onClick={() => handleReserve(mission.id)}
              disabled={reservingId === mission.id}
              className="ml-4 bg-red-600 text-white hover:bg-red-500"
            >
              {reservingId === mission.id ? "..." : "Réserver"}
            </Button>
          </div>
        ))}
      </div>

      {missions.length >= 3 && (
        <Link href="/worker/missions">
          <p className="mt-4 text-center text-sm text-red-400 hover:text-red-300">
            Voir toutes les missions disponibles →
          </p>
        </Link>
      )}
    </div>
  );
}

