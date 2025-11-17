"use client";

import { format } from "date-fns";
import { frCA } from "date-fns/locale";
import { Button } from "@/components/ui/button";

type MissionFeed = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  hourlyRate: number | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  employerId: string;
  employerName: string | null;
  priceCents: number;
  currency: string;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

type Props = {
  missions: MissionFeed[];
  onReserve: (missionId: string) => void;
  userLocation: { lat: number; lng: number } | null;
};

export function MissionFeedList({ missions, onReserve, userLocation }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {missions.map((mission) => (
        <div
          key={mission.id}
          className="group overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/70 backdrop-blur transition hover:border-blue-500/50 hover:bg-neutral-900"
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
              <h3 className="mb-1 text-xl font-bold text-white line-clamp-2">
                {mission.title}
              </h3>
              <p className="text-sm text-white/50">
                par {mission.employerName || "Employeur"}
              </p>
            </div>

            {/* Description */}
            {mission.description && (
              <p className="mb-4 text-sm text-white/70 line-clamp-3">
                {mission.description}
              </p>
            )}

            {/* Infos */}
            <div className="mb-4 space-y-2">
              {mission.category && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">🏷️</span>
                  <span className="text-sm text-white">{mission.category}</span>
                </div>
              )}

              {mission.city && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">📍</span>
                  <span className="text-sm text-white">{mission.city}</span>
                </div>
              )}

              {mission.hourlyRate && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">💰</span>
                  <span className="text-sm font-semibold text-green-400">
                    {mission.hourlyRate.toFixed(2)} $ / heure
                  </span>
                </div>
              )}

              {mission.startsAt && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50">📅</span>
                  <span className="text-sm text-white">
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
                className="rounded-xl border border-white/20 bg-transparent px-4 py-2 text-white transition hover:bg-white/10"
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

