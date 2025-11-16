"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { reserveMission } from "@/lib/missions-api";
import type { Mission } from "@/types/mission";
import { MissionStatus } from "@/types/mission";
import { Button } from "@/components/ui/button";

type ReserveMissionButtonProps = {
  mission: Mission;
  onSuccess?: (updatedMission: Mission) => void;
};

export function ReserveMissionButton({
  mission,
  onSuccess,
}: ReserveMissionButtonProps) {
  const { getToken, isLoaded } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canReserve = mission.status === MissionStatus.CREATED;

  const handleReserve = () => {
    setError(null);

    startTransition(async () => {
      try {
        if (!isLoaded) {
          setError("Authentification en cours...");
          return;
        }

        const token = await getToken();
        if (!token) {
          setError("Impossible de récupérer le token. Reconnecte-toi.");
          return;
        }

        const updatedMission = await reserveMission(token, mission.id);
        onSuccess?.(updatedMission);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de la réservation",
        );
      }
    });
  };

  if (!canReserve) {
    return (
      <Button
        disabled
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white/50"
      >
        {mission.status === MissionStatus.RESERVED
          ? "Déjà réservée"
          : mission.status === MissionStatus.IN_PROGRESS
            ? "En cours"
            : mission.status === MissionStatus.COMPLETED
              ? "Terminée"
              : "Non disponible"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleReserve}
        disabled={isPending}
        className="w-full rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-500 disabled:opacity-70"
      >
        {isPending ? "Réservation..." : "✓ Réserver cette mission"}
      </Button>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

