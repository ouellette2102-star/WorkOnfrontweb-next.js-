"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { missionResponseToMission, MissionStatus, type Mission } from "@/types/mission";
import { Button } from "@/components/ui/button";

type ReserveMissionButtonProps = {
  mission: Mission;
  onSuccess?: (updatedMission: Mission) => void;
};

export function ReserveMissionButton({
  mission,
  onSuccess,
}: ReserveMissionButtonProps) {
  const { isLoading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canReserve = mission.status === MissionStatus.CREATED;

  const handleReserve = () => {
    setError(null);

    startTransition(async () => {
      try {
        if (authLoading) {
          setError("Authentification en cours...");
          return;
        }

        const raw = await api.acceptMission(mission.id);
        onSuccess?.(missionResponseToMission(raw));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de la réservation",
        );
      }
    });
  };

  if (!canReserve) {
    return (
      <Button
        disabled
        variant="outline"
        size="hero"
        className="w-full"
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
        variant="hero"
        size="hero"
        className="w-full"
      >
        {isPending ? "Réservation..." : "✓ Réserver cette mission"}
      </Button>
      {error && <p className="text-xs text-[#B5382A]">{error}</p>}
    </div>
  );
}
