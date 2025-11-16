"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";
import {
  getMissionTimeLogs,
  checkInToMission,
  checkOutFromMission,
} from "@/lib/mission-time-logs-api";
import type { MissionTimeLog } from "@/types/mission-time-log";
import { MissionTimeLogType } from "@/types/mission-time-log";
import type { Mission } from "@/types/mission";
import { Button } from "@/components/ui/button";

type MissionTimeTrackingProps = {
  mission: Mission;
};

export function MissionTimeTracking({ mission }: MissionTimeTrackingProps) {
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<MissionTimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Missions terminées ou annulées : pas de tracking
  if (mission.status === "COMPLETED" || mission.status === "CANCELLED") {
    return null;
  }

  // Si la mission n'est pas réservée, pas de tracking
  if (mission.status === "CREATED") {
    return null;
  }

  const loadLogs = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await getMissionTimeLogs(token, mission.id);
      setLogs(data);
    } catch (err) {
      console.error("Error loading time logs:", err);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id]);

  const handleCheckIn = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Impossible de récupérer le token");
        return;
      }

      await checkInToMission(token, mission.id);
      setSuccessMessage("Arrivée enregistrée avec succès !");
      await loadLogs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Impossible de récupérer le token");
        return;
      }

      await checkOutFromMission(token, mission.id);
      setSuccessMessage("Départ enregistré avec succès !");
      await loadLogs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const canCheckIn = !lastLog || lastLog.type === MissionTimeLogType.CHECK_OUT;
  const canCheckOut = lastLog?.type === MissionTimeLogType.CHECK_IN;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        ⏱️ Suivi du temps
      </h3>

      {/* Messages */}
      {successMessage && (
        <div className="mb-3 rounded-xl bg-green-500/20 p-2 text-xs text-green-300">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-xl bg-red-500/20 p-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Boutons */}
      <div className="mb-3 flex gap-2">
        {canCheckIn && (
          <Button
            onClick={handleCheckIn}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            {isLoading ? "..." : "📍 Enregistrer mon arrivée"}
          </Button>
        )}
        {canCheckOut && (
          <Button
            onClick={handleCheckOut}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            {isLoading ? "..." : "🚪 Enregistrer mon départ"}
          </Button>
        )}
      </div>

      {/* Liste des logs */}
      {logs.length > 0 && (
        <div className="space-y-1">
          <p className="mb-2 text-xs text-white/50">Historique :</p>
          {logs.slice(-3).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1 text-xs"
            >
              <span className="text-white/70">
                {log.type === MissionTimeLogType.CHECK_IN ? "📍 Arrivée" : "🚪 Départ"}
              </span>
              <span className="text-white/50">
                {formatDistanceToNow(new Date(log.createdAt), {
                  addSuffix: true,
                  locale: frCA,
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

