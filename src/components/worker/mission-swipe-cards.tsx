"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { frCA, fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { MissionFeedItem } from "@/types/mission";

type Props = {
  missions: MissionFeedItem[];
  onReserve: (missionId: string) => void;
  onReject: (missionId: string) => void;
  onSave: (missionId: string) => void;
};

export function MissionSwipeCards({ missions, onReserve, onReject, onSave }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const currentMission = missions[currentIndex];

  const handleNext = () => {
    if (currentIndex < missions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDirection(null);
    }
  };

  const handleReject = () => {
    setDirection("left");
    onReject(currentMission.id);
    setTimeout(handleNext, 300);
  };

  const handleSave = () => {
    onSave(currentMission.id);
    setTimeout(handleNext, 300);
  };

  const handleReserve = () => {
    setDirection("right");
    onReserve(currentMission.id);
    setTimeout(handleNext, 300);
  };

  if (!currentMission) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
        <div className="mb-4 text-6xl">✅</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Toutes les missions parcourues !
        </h3>
        <p className="text-gray-500">Revenez plus tard pour de nouvelles opportunités</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Indicateur de progression */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
        <span>{currentIndex + 1} / {missions.length}</span>
        <span>{missions.length - currentIndex - 1} restante(s)</span>
      </div>

      {/* Carte principale avec animations */}
      <div className="relative h-[600px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentMission.id}
            initial={{
              opacity: 0,
              scale: 0.8,
              rotateY: -20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateY: 0,
              x: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              x: direction === "left" ? -400 : direction === "right" ? 400 : 0,
              rotateZ: direction === "left" ? -30 : direction === "right" ? 30 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-gray-200 bg-white shadow-2xl"
          >
            {/* Header avec distance */}
            {currentMission.distance !== null && (
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
                <p className="text-center text-lg font-bold text-white">
                  📍 {currentMission.distance} km de vous
                </p>
              </div>
            )}

            <div className="h-full overflow-y-auto p-8">
              {/* Urgency signals */}
              <div className="mb-4 flex flex-wrap gap-2">
                {differenceInHours(new Date(), new Date(currentMission.createdAt)) < 24 && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600 border border-green-500/30">
                    Nouveau
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                  Publiee {formatDistanceToNow(new Date(currentMission.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>

              {/* Titre et employeur */}
              <div className="mb-6">
                <h2 className="mb-2 text-3xl font-bold text-gray-900">
                  {currentMission.title}
                </h2>
                <p className="text-lg text-gray-500">
                  par {currentMission.employerName || "Employeur"}
                </p>
              </div>

              {/* Description */}
              {currentMission.description && (
                <div className="mb-6">
                  <p className="text-gray-600">{currentMission.description}</p>
                </div>
              )}

              {/* Infos détaillées */}
              <div className="mb-8 space-y-4">
                {currentMission.category && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <p className="text-sm text-gray-400">Catégorie</p>
                      <p className="font-semibold text-gray-900">{currentMission.category}</p>
                    </div>
                  </div>
                )}

                {currentMission.city && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-sm text-gray-400">Lieu</p>
                      <p className="font-semibold text-gray-900">{currentMission.city}</p>
                    </div>
                  </div>
                )}

                {currentMission.hourlyRate && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-sm text-gray-400">Rémunération</p>
                      <p className="text-xl font-bold text-green-600">
                        {currentMission.hourlyRate.toFixed(2)} $ / heure
                      </p>
                    </div>
                  </div>
                )}

                {currentMission.startsAt && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm text-gray-400">Date de début</p>
                      <p className="font-semibold text-gray-900">
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation secondaire */}
      {currentIndex > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="text-sm text-gray-400 hover:text-gray-900"
          >
            ← Mission précédente
          </button>
        </div>
      )}
    </div>
  );
}
