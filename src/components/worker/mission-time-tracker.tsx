"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import {
  getMissionTimeLogs,
  checkInToMission,
  checkOutFromMission,
} from "@/lib/mission-time-logs-api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  missionId: string;
};

export function MissionTimeTracker({ missionId }: Props) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0); // en minutes
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadTimeLogs = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const logs = await getMissionTimeLogs(token, missionId);
      
      // Calculer la durée totale
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

      // Si le dernier log est un CHECK_IN, le worker est actuellement sur place
      const lastLog = logs[logs.length - 1];
      setIsCheckedIn(lastLog?.type === "CHECK_IN");
      setTotalDuration(Math.round(total));
    } catch (error) {
      console.error("Erreur lors du chargement des time logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimeLogs();
  }, [missionId]);

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentification requise");
        return;
      }

      await checkInToMission(token, missionId);
      setIsCheckedIn(true);
      toast.success("✅ Arrivée enregistrée");
      loadTimeLogs();
    } catch (error) {
      console.error("Erreur lors du check-in:", error);
      toast.error("Impossible d'enregistrer l'arrivée");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("Authentification requise");
        return;
      }

      await checkOutFromMission(token, missionId);
      setIsCheckedIn(false);
      toast.success("✅ Départ enregistré");
      loadTimeLogs();
    } catch (error) {
      console.error("Erreur lors du check-out:", error);
      toast.error("Impossible d'enregistrer le départ");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-16 animate-pulse rounded-lg border border-white/10 bg-neutral-700/50" />
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="rounded-lg border border-white/10 bg-neutral-700/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-white/70">⏱️ Temps de travail</span>
        <span className="text-lg font-bold text-white">
          {formatDuration(totalDuration)}
        </span>
      </div>

      <div className="flex gap-2">
        {!isCheckedIn ? (
          <Button
            onClick={handleCheckIn}
            disabled={isActionLoading}
            className="flex-1 bg-green-600 text-white hover:bg-green-500"
          >
            {isActionLoading ? "..." : "▶️ Démarrer"}
          </Button>
        ) : (
          <Button
            onClick={handleCheckOut}
            disabled={isActionLoading}
            className="flex-1 bg-red-600 text-white hover:bg-red-500"
          >
            {isActionLoading ? "..." : "⏹️ Arrêter"}
          </Button>
        )}
      </div>

      {isCheckedIn && (
        <p className="mt-2 text-center text-xs text-green-400">
          ● En cours...
        </p>
      )}
    </div>
  );
}

