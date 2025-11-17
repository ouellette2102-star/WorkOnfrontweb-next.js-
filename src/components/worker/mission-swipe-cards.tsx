"use client";

import { useState } from "react";
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
  onReject: (missionId: string) => void;
  onSave: (missionId: string) => void;
};

export function MissionSwipeCards({ missions, onReserve, onReject, onSave }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentMission = missions[currentIndex];

  const handleNext = () => {
    if (currentIndex < missions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleReject = () => {
    onReject(currentMission.id);
    handleNext();
  };

  const handleSave = () => {
    onSave(currentMission.id);
    handleNext();
  };

  const handleReserve = () => {
    onReserve(currentMission.id);
  };

  if (!currentMission) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-neutral-900/70 p-12">
        <div className="mb-4 text-6xl">✅</div>
        <h3 className="mb-2 text-xl font-semibold text-white">
          Toutes les missions parcourues !
        </h3>
        <p className="text-white/70">Revenez plus tard pour de nouvelles opportunités</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Indicateur de progression */}
      <div className="mb-4 flex items-center justify-between text-sm text-white/70">
        <span>{currentIndex + 1} / {missions.length}</span>
        <span>{missions.length - currentIndex - 1} restante(s)</span>
      </div>

      {/* Carte principale */}
      <div className="overflow-hidden rounded-3xl border-2 border-white/10 bg-neutral-900 shadow-2xl">
        {/* Header avec distance */}
        {currentMission.distance !== null && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
            <p className="text-center text-lg font-bold text-white">
              📍 {currentMission.distance} km de vous
            </p>
          </div>
        )}

        <div className="p-8">
          {/* Titre et employeur */}
          <div className="mb-6">
            <h2 className="mb-2 text-3xl font-bold text-white">
              {currentMission.title}
            </h2>
            <p className="text-lg text-white/60">
              par {currentMission.employerName || "Employeur"}
            </p>
          </div>

          {/* Description */}
          {currentMission.description && (
            <div className="mb-6">
              <p className="text-white/80">{currentMission.description}</p>
            </div>
          )}

          {/* Infos détaillées */}
          <div className="mb-8 space-y-4">
            {currentMission.category && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                <div>
                  <p className="text-sm text-white/50">Catégorie</p>
                  <p className="font-semibold text-white">{currentMission.category}</p>
                </div>
              </div>
            )}

            {currentMission.city && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-sm text-white/50">Lieu</p>
                  <p className="font-semibold text-white">{currentMission.city}</p>
                </div>
              </div>
            )}

            {currentMission.hourlyRate && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm text-white/50">Rémunération</p>
                  <p className="text-xl font-bold text-green-400">
                    {currentMission.hourlyRate.toFixed(2)} $ / heure
                  </p>
                </div>
              </div>
            )}

            {currentMission.startsAt && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-sm text-white/50">Date de début</p>
                  <p className="font-semibold text-white">
                    {format(new Date(currentMission.startsAt), "PPP", { locale: frCA })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions principales */}
          <div className="flex gap-4">
            <Button
              onClick={handleReject}
              className="flex-1 rounded-xl border-2 border-red-500 bg-transparent py-6 text-lg font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
            >
              ❌ Passer
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 rounded-xl border-2 border-yellow-500 bg-transparent py-6 text-lg font-bold text-yellow-500 transition hover:bg-yellow-500 hover:text-white"
            >
              ⭐ Sauvegarder
            </Button>
            <Button
              onClick={handleReserve}
              className="flex-1 rounded-xl bg-green-600 py-6 text-lg font-bold text-white transition hover:bg-green-500"
            >
              ✅ Réserver
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation secondaire */}
      {currentIndex > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="text-sm text-white/50 hover:text-white"
          >
            ← Mission précédente
          </button>
        </div>
      )}
    </div>
  );
}

