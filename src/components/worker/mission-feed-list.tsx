"use client";

import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { MissionFeedItem } from "@/types/mission";

type Props = {
  missions: MissionFeedItem[];
  onReserve: (missionId: string) => void;
  userLocation: { lat: number; lng: number } | null;
};

export function MissionFeedList({ missions, onReserve }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {missions.map((mission) => (
        <div
          key={mission.id}
          className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:border-blue-500/50 hover:bg-white"
        >
          {/* Badge de distance */}
          {mission.distance !== null && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2">
              <p className="text-center text-sm font-semibold text-white">
                📍 {mission.distance} km
              </p>
            </div>
          )}

          <div className="p-6">
            {/* Titre et employeur */}
            <div className="mb-4">
              <h3 className="mb-1 text-xl font-bold text-gray-900 line-clamp-2">
                {mission.title}
              </h3>
              <p className="text-sm text-gray-400">
                par {mission.employerName || "Employeur"}
              </p>
            </div>

            {/* Description */}
            {mission.description && (
              <p className="mb-4 text-sm text-gray-500 line-clamp-3">
                {mission.description}
              </p>
            )}

            {/* Infos */}
            <div className="mb-4 space-y-2">
              {mission.category && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🏷️</span>
                  <span className="text-sm text-gray-900">{mission.category}</span>
                </div>
              )}

              {mission.city && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📍</span>
                  <span className="text-sm text-gray-900">{mission.city}</span>
                </div>
              )}

              {mission.hourlyRate && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">💰</span>
                  <span className="text-sm font-semibold text-green-600">
                    {mission.hourlyRate.toFixed(2)} $ / heure
                  </span>
                </div>
              )}

              {mission.startsAt && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">📅</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(mission.startsAt), "PPP", { locale: frCA })}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => onReserve(mission.id)}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500"
              >
                Réserver
              </Button>
              <Button
                onClick={() => {
                  // TODO: Link to mission detail
                  alert("Voir détails (à implémenter)");
                }}
                className="rounded-xl border border-gray-300 bg-transparent px-4 py-2 text-gray-900 transition hover:bg-gray-100"
              >
                Détails
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
