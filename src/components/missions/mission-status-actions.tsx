"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { updateMissionStatus } from "@/lib/missions-api";
import type { Mission } from "@/types/mission";
import { MissionStatus } from "@/types/mission";
import { Button } from "@/components/ui/button";

type MissionStatusActionsProps = {
  mission: Mission;
  onSuccess?: (updatedMission: Mission) => void;
};

export function MissionStatusActions({
  mission,
  onSuccess,
}: MissionStatusActionsProps) {
  const { isLoading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<MissionStatus | null>(null);

  const handleStatusChange = (newStatus: MissionStatus) => {
    // Demander confirmation pour les actions destructives
    if (newStatus === MissionStatus.CANCELLED) {
      setShowConfirm(newStatus);
      return;
    }

    executeStatusChange(newStatus);
  };

  const executeStatusChange = (newStatus: MissionStatus) => {
    setError(null);
    setShowConfirm(null);

    startTransition(async () => {
      try {
        if (authLoading) {
          setError("Authentification en cours...");
          return;
        }

        const token = getAccessToken();
        if (!token) {
          setError("Impossible de récupérer le token. Reconnecte-toi.");
          return;
        }

        const updatedMission = await updateMissionStatus(token, mission.id, {
          status: newStatus,
        });
        onSuccess?.(updatedMission);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors de la mise à jour",
        );
      }
    });
  };

  // Définir les actions disponibles selon le statut actuel
  const getAvailableActions = () => {
    switch (mission.status) {
      case MissionStatus.CREATED:
        return [
          {
            label: "Annuler",
            status: MissionStatus.CANCELLED,
            variant: "destructive" as const,
          },
        ];

      case MissionStatus.RESERVED:
        return [
          {
            label: "Démarrer la mission",
            status: MissionStatus.IN_PROGRESS,
            variant: "primary" as const,
          },
          {
            label: "Annuler",
            status: MissionStatus.CANCELLED,
            variant: "destructive" as const,
          },
        ];

      case MissionStatus.IN_PROGRESS:
        return [
          {
            label: "Marquer comme terminée",
            status: MissionStatus.COMPLETED,
            variant: "success" as const,
          },
        ];

      case MissionStatus.COMPLETED:
      case MissionStatus.CANCELLED:
        return [];

      default:
        return [];
    }
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  if (showConfirm) {
    return (
      <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
        <p className="text-sm font-semibold text-white">
          Es-tu sûr de vouloir annuler cette mission ?
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => executeStatusChange(showConfirm)}
            disabled={isPending}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            {isPending ? "Annulation..." : "Oui, annuler"}
          </Button>
          <Button
            onClick={() => setShowConfirm(null)}
            disabled={isPending}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Non, garder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            onClick={() => handleStatusChange(action.status)}
            disabled={isPending}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              action.variant === "primary"
                ? "bg-red-600 text-white hover:bg-red-500"
                : action.variant === "success"
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : action.variant === "destructive"
                    ? "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            } disabled:opacity-50`}
          >
            {isPending ? "..." : action.label}
          </Button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

