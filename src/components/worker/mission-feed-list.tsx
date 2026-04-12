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
          className="group relative overflow-hidden rounded-2xl border border-[#EAE6DF] bg-white p-4 transition-all hover:shadow-soft"
        >
          {/* Badge de distance */}
          {mission.distance !== null && (
            <div className="mb-3 flex items-center gap-1.5">
              <span className="text-workon-accent">📍</span>
              <p className="text-sm text-[#706E6A]">
                {mission.distance} km
              </p>
            </div>
          )}

          {/* Titre et employeur */}
          <div className="mb-3">
            <h3 className="font-heading mb-1 text-base font-bold text-[#1B1A18] line-clamp-2">
              {mission.title}
            </h3>
            <p className="text-sm text-[#706E6A]">
              par {mission.employerName || "Employeur"}
            </p>
          </div>

          {/* Description */}
          {mission.description && (
            <p className="mb-3 text-sm text-[#706E6A] line-clamp-3">
              {mission.description}
            </p>
          )}

          {/* Infos */}
          <div className="mb-4 space-y-2">
            {mission.category && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-xl bg-[#134021]/8 px-2.5 py-1 text-xs text-[#134021]">
                  {mission.category}
                </span>
              </div>
            )}

            {mission.city && (
              <div className="flex items-center gap-2">
                <span className="text-workon-accent">📍</span>
                <span className="text-sm text-[#706E6A]">{mission.city}</span>
              </div>
            )}

            {mission.hourlyRate && (
              <div className="flex items-center gap-2">
                <span className="text-[#706E6A]">💰</span>
                <span className="text-sm font-semibold text-[#134021]">
                  {mission.hourlyRate.toFixed(2)} $ / heure
                </span>
              </div>
            )}

            {mission.startsAt && (
              <div className="flex items-center gap-2">
                <span className="text-[#706E6A]">📅</span>
                <span className="text-sm text-[#1B1A18]">
                  {format(new Date(mission.startsAt), "PPP", { locale: frCA })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => onReserve(mission.id)}
              className="flex-1 rounded-xl bg-[#134021] px-4 py-2 font-semibold text-white transition hover:bg-[#0F3319]"
            >
              Réserver
            </Button>
            <Button
              onClick={() => {
                // TODO: Link to mission detail
                alert("Voir détails (à implémenter)");
              }}
              className="rounded-xl border border-[#EAE6DF] bg-transparent px-4 py-2 text-[#1B1A18] transition hover:bg-[#F9F8F5]"
            >
              Détails
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
