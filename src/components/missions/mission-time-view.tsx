"use client";

import { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import { getMissionTimeLogs } from "@/lib/mission-time-logs-api";
import type { MissionTimeLog } from "@/types/mission-time-log";
import { MissionTimeLogType } from "@/types/mission-time-log";
import type { Mission } from "@/types/mission";

type MissionTimeViewProps = {
  mission: Mission;
};

export function MissionTimeView({ mission }: MissionTimeViewProps) {
  const [logs, setLogs] = useState<MissionTimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const token = getAccessToken();
        if (!token) return;

        const data = await getMissionTimeLogs(token, mission.id);
        setLogs(data);
      } catch (err) {
        console.error("Error loading time logs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, [mission.id]);

  // Calculer la durée totale
  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    let lastCheckIn: Date | null = null;

    for (const log of logs) {
      if (log.type === MissionTimeLogType.CHECK_IN) {
        lastCheckIn = new Date(log.createdAt);
      } else if (log.type === MissionTimeLogType.CHECK_OUT && lastCheckIn) {
        const checkOut = new Date(log.createdAt);
        const diffMs = checkOut.getTime() - lastCheckIn.getTime();
        totalMinutes += Math.floor(diffMs / 60000);
        lastCheckIn = null;
      }
    }

    if (totalMinutes === 0) {
      return null;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    }
    return `${minutes} min`;
  };

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const isCurrentlyWorking =
    lastLog?.type === MissionTimeLogType.CHECK_IN;
  const totalDuration = calculateTotalDuration();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        ⏱️ Temps enregistré
      </h3>

      {/* Statut actuel */}
      {isCurrentlyWorking && (
        <div className="mb-3 rounded-xl bg-green-500/20 p-2 text-xs text-green-300">
          🟢 Le travailleur est actuellement sur place
        </div>
      )}

      {/* Durée totale */}
      {totalDuration && (
        <div className="mb-3 rounded-xl bg-blue-500/20 p-3">
          <p className="text-xs text-blue-300">Durée totale</p>
          <p className="text-lg font-bold text-white">{totalDuration}</p>
        </div>
      )}

      {/* Timeline des événements */}
      <div className="space-y-2">
        <p className="mb-2 text-xs text-white/50">Historique :</p>
        {logs.map((log, index) => {
          const formattedTime = format(new Date(log.createdAt), "HH:mm", {
            locale: frCA,
          });
          const formattedDate = format(new Date(log.createdAt), "d MMM", {
            locale: frCA,
          });

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">
                {log.type === MissionTimeLogType.CHECK_IN ? "📍" : "🚪"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {log.type === MissionTimeLogType.CHECK_IN
                    ? "Arrivée enregistrée"
                    : "Départ enregistré"}
                </p>
                <p className="text-xs text-white/50">
                  {formattedDate} à {formattedTime}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

