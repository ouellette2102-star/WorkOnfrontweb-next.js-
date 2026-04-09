"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { missionResponseToMission, MissionStatus, type Mission } from "@/types/mission";
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

        // Map the target status to the dedicated backend endpoint.
        // The canonical api-client exposes action verbs rather than
        // a single PATCH /status — this keeps state transitions
        // explicit server-side.
        let raw;
        if (newStatus === MissionStatus.IN_PROGRESS) {
          raw = await api.startMission(mission.id);
        } else if (newStatus === MissionStatus.COMPLETED) {
          raw = await api.completeMission(mission.id);
        } else if (newStatus === MissionStatus.CANCELLED) {
          raw = await api.cancelMission(mission.id);
        } else {
          setError("Transition non supportée");
          return;
        }

        onSuccess?.(missionResponseToMission(raw));
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
      <div className="space-y-3 rounded-2xl border border-[#FF4D1C]/30 bg-[#FF4D1C]/5 p-4">
        <p className="text-sm font-semibold text-white">
          Es-tu sûr de vouloir annuler cette mission ?
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => executeStatusChange(showConfirm)}
            disabled={isPending}
            variant="hero"
            size="sm"
            className="flex-1"
          >
            {isPending ? "Annulation..." : "Oui, annuler"}
          </Button>
          <Button
            onClick={() => setShowConfirm(null)}
            disabled={isPending}
            variant="outline"
            size="sm"
            className="flex-1"
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
            variant={
              action.variant === "destructive" ? "outline" : "hero"
            }
            size="sm"
          >
            {isPending ? "..." : action.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs text-[#FF4D1C]">{error}</p>}
    </div>
  );
}

