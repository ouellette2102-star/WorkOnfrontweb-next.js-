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
          className="group relative overflow-hidden rounded-2xl border border-workon-border bg-white p-4 transition-all hover:shadow-soft"
        >
          {/* Badge de distance */}
          {mission.distance !== null && (
            <div className="mb-3 flex items-center gap-1.5">
              <span className="text-workon-accent">📍</span>
              <p className="text-sm text-workon-gray">
                {mission.distance} km
              </p>
            </div>
          )}

          {/* Titre et client */}
          <div className="mb-3">
            <h3 className="font-heading mb-1 text-base font-bold text-workon-ink line-clamp-2">
              {mission.title}
            </h3>
            <p className="text-sm text-workon-gray">
              par {mission.employerName || "Client"}
            </p>
          </div>

          {/* Description */}
          {mission.description && (
            <p className="mb-3 text-sm text-workon-gray line-clamp-3">
              {mission.description}
            </p>
          )}

          {/* Infos */}
          <div className="mb-4 space-y-2">
            {mission.category && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-xl bg-workon-primary/8 px-2.5 py-1 text-xs text-workon-primary">
                  {mission.category}
                </span>
              </div>
            )}

            {mission.city && (
              <div className="flex items-center gap-2">
                <span className="text-workon-accent">📍</span>
                <span className="text-sm text-workon-gray">{mission.city}</span>
              </div>
            )}

            {mission.hourlyRate && (
              <div className="flex items-center gap-2">
                <span className="text-workon-gray">💰</span>
                <span className="text-sm font-semibold text-workon-primary">
                  {mission.hourlyRate.toFixed(2)} $ / heure
                </span>
              </div>
            )}

            {mission.startsAt && (
              <div className="flex items-center gap-2">
                <span className="text-workon-gray">📅</span>
                <span className="text-sm text-workon-ink">
                  {format(new Date(mission.startsAt), "PPP", { locale: frCA })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => onReserve(mission.id)}
              className="flex-1 rounded-xl bg-workon-primary px-4 py-2 font-semibold text-white transition hover:bg-workon-primary-hover"
            >
              Réserver
            </Button>
            <Button
              onClick={() => {
                // TODO: Link to mission detail
                alert("Voir détails (à implémenter)");
              }}
              className="rounded-xl border border-workon-border bg-transparent px-4 py-2 text-workon-ink transition hover:bg-workon-bg"
            >
              Détails
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
