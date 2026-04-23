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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-workon-border bg-white p-12">
        <div className="mb-4 text-6xl">✅</div>
        <h3 className="mb-2 text-xl font-semibold text-workon-ink">
          Toutes les missions parcourues !
        </h3>
        <p className="text-sm text-workon-gray">Revenez plus tard pour de nouvelles opportunités</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Indicateur de progression */}
      <div className="mb-4 flex items-center justify-between text-sm text-workon-gray">
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
            className="absolute inset-0 overflow-hidden rounded-2xl border border-workon-border bg-white shadow-soft"
          >
            {/* Header avec distance */}
            {currentMission.distance !== null && (
              <div className="flex items-center justify-center gap-2 bg-workon-primary px-6 py-3">
                <span className="text-white">📍</span>
                <p className="text-center text-lg font-bold text-white">
                  {currentMission.distance} km de vous
                </p>
              </div>
            )}

            <div className="h-full overflow-y-auto p-8">
              {/* Urgency signals */}
              <div className="mb-4 flex flex-wrap gap-2">
                {differenceInHours(new Date(), new Date(currentMission.createdAt)) < 24 && (
                  <span className="inline-flex items-center rounded-xl bg-workon-primary/8 px-2.5 py-1 text-xs font-semibold text-workon-primary">
                    Nouveau
                  </span>
                )}
                <span className="inline-flex items-center rounded-xl bg-workon-bg px-2.5 py-1 text-xs text-workon-gray">
                  Publiee {formatDistanceToNow(new Date(currentMission.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>

              {/* Titre et client */}
              <div className="mb-6">
                <h2 className="font-heading mb-2 text-3xl font-bold text-workon-ink">
                  {currentMission.title}
                </h2>
                <p className="text-lg text-workon-gray">
                  par {currentMission.employerName || "Client"}
                </p>
              </div>

              {/* Description */}
              {currentMission.description && (
                <div className="mb-6">
                  <p className="text-sm text-workon-gray">{currentMission.description}</p>
                </div>
              )}

              {/* Infos détaillées */}
              <div className="mb-8 space-y-4">
                {currentMission.category && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <p className="text-sm text-workon-gray">Catégorie</p>
                      <p className="font-semibold text-workon-ink">{currentMission.category}</p>
                    </div>
                  </div>
                )}

                {currentMission.city && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-sm text-workon-gray">Lieu</p>
                      <p className="font-semibold text-workon-ink">{currentMission.city}</p>
                    </div>
                  </div>
                )}

                {currentMission.hourlyRate && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-sm text-workon-gray">Rémunération</p>
                      <p className="text-xl font-bold text-[#2D8B55]">
                        {currentMission.hourlyRate.toFixed(2)} $ / heure
                      </p>
                    </div>
                  </div>
                )}

                {currentMission.startsAt && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm text-workon-gray">Date de début</p>
                      <p className="font-semibold text-workon-ink">
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
                  className="flex-1 rounded-xl border-2 border-workon-border bg-transparent py-6 text-lg font-bold text-workon-gray transition hover:bg-workon-bg hover:text-workon-ink"
                >
                  ❌ Passer
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 rounded-xl border-2 border-[#D4922A] bg-transparent py-6 text-lg font-bold text-[#D4922A] transition hover:bg-[#D4922A]/10"
                >
                  ⭐ Sauvegarder
                </Button>
                <Button
                  onClick={handleReserve}
                  className="flex-1 rounded-xl bg-workon-primary py-6 text-lg font-bold text-white transition hover:bg-workon-primary-hover"
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
            className="text-sm text-workon-gray hover:text-workon-ink"
          >
            ← Mission précédente
          </button>
        </div>
      )}
    </div>
  );
}
