"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { frCA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import type { MissionFeedItem } from "@/types/mission";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MapPin,
  ShieldCheck,
  Star,
  WalletCards,
  X,
} from "lucide-react";

type Props = {
  missions: MissionFeedItem[];
  onReserve: (missionId: string) => void;
  onReject: (missionId: string) => void;
  onSave: (missionId: string) => void;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function MissionSwipeCards({ missions, onReserve, onReject, onSave }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const currentMission = missions[currentIndex];
  const remaining = Math.max(missions.length - currentIndex - 1, 0);

  const handleNext = () => {
    if (currentIndex < missions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDirection(null);
    } else {
      setCurrentIndex(missions.length);
    }
  };

  const handleReject = () => {
    if (!currentMission) return;
    setDirection("left");
    onReject(currentMission.id);
    setTimeout(handleNext, 260);
  };

  const handleSave = () => {
    if (!currentMission) return;
    onSave(currentMission.id);
    setTimeout(handleNext, 220);
  };

  const handleReserve = () => {
    if (!currentMission) return;
    setDirection("right");
    onReserve(currentMission.id);
    setTimeout(handleNext, 260);
  };

  if (!currentMission) {
    return (
      <div className="rounded-[28px] border border-workon-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-workon-trust-green/12 text-workon-trust-green">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-heading text-2xl font-black text-workon-ink">
          Toutes les missions ont été triées
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-workon-muted">
          Reviens plus tard ou élargis les filtres pour ouvrir de nouvelles
          opportunités.
        </p>
      </div>
    );
  }

  const isNew = differenceInHours(new Date(), new Date(currentMission.createdAt)) < 24;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-workon-border bg-white px-4 py-3 text-sm text-workon-muted">
        <span className="font-bold text-workon-ink">
          {currentIndex + 1} / {missions.length}
        </span>
        <span>{remaining} mission{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</span>
      </div>

      <div className="relative min-h-[620px]">
        <AnimatePresence initial={false}>
          <motion.article
            key={currentMission.id}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{
              opacity: 0,
              scale: 0.94,
              x: direction === "left" ? -280 : direction === "right" ? 280 : 0,
              rotateZ: direction === "left" ? -8 : direction === "right" ? 8 : 0,
            }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col overflow-hidden rounded-[30px] border border-workon-border bg-workon-surface shadow-[0_22px_55px_rgba(27,26,24,0.14)]"
          >
            <div className="workon-dark-panel p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-workon-gold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Match mission
                  </span>
                  <h2 className="mt-4 font-heading text-3xl font-black leading-tight">
                    {currentMission.title}
                  </h2>
                </div>
                <div className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                    Budget
                  </p>
                  <p className="text-2xl font-black text-workon-gold">
                    {formatMoney(currentMission.priceCents)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <SwipeSignal
                  icon={MapPin}
                  label={currentMission.distance !== null ? `${currentMission.distance} km` : "Zone"}
                  detail={currentMission.city || "À confirmer"}
                />
                <SwipeSignal
                  icon={Clock3}
                  label={isNew ? "Nouveau" : "Publié"}
                  detail={formatDistanceToNow(new Date(currentMission.createdAt), {
                    addSuffix: true,
                    locale: frCA,
                  })}
                />
                <SwipeSignal
                  icon={FileCheck2}
                  label="Protégé"
                  detail="Contrat"
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap gap-2">
                {currentMission.category && (
                  <span className="rounded-full bg-workon-primary-subtle px-3 py-1 text-xs font-black text-workon-primary">
                    {currentMission.category}
                  </span>
                )}
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-workon-stone">
                  Client WorkOn vérifié
                </span>
              </div>

              {currentMission.description && (
                <p className="mt-4 line-clamp-5 text-sm leading-6 text-workon-gray">
                  {currentMission.description}
                </p>
              )}

              <div className="mt-5 rounded-2xl border border-workon-border bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-workon-stone">
                  Pourquoi ce match est utile
                </p>
                <div className="mt-3 space-y-2 text-sm text-workon-gray">
                  <p className="flex gap-2">
                    <WalletCards className="mt-0.5 h-4 w-4 shrink-0 text-workon-copper" />
                    Budget visible avant de t’engager.
                  </p>
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-workon-copper" />
                    Distance et ville affichées pour décider vite.
                  </p>
                  <p className="flex gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-workon-trust-green" />
                    La mission bascule vers contrat et paiement protégés après acceptation.
                  </p>
                </div>
              </div>

              <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-3">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="h-12 rounded-2xl border-workon-border bg-white font-bold text-workon-muted hover:bg-workon-bg-cream hover:text-workon-ink"
                >
                  <X className="mr-2 h-4 w-4" />
                  Passer
                </Button>
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="h-12 rounded-2xl border-workon-gold/45 bg-workon-gold/10 font-bold text-workon-copper hover:bg-workon-gold/18"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Garder
                </Button>
                <Button
                  onClick={handleReserve}
                  className="h-12 rounded-2xl bg-workon-primary font-black text-white hover:bg-workon-primary-hover"
                >
                  Réserver
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {currentIndex > 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-workon-muted hover:bg-white hover:text-workon-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Revoir la mission précédente
          </button>
        </div>
      )}

      <div className="mt-2 text-center">
        <Link
          href={`/missions/${currentMission.id}`}
          className="text-xs font-bold text-workon-primary hover:underline"
        >
          Ouvrir la fiche complète
        </Link>
      </div>
    </div>
  );
}

function SwipeSignal({
  icon: Icon,
  label,
  detail,
}: {
  icon: typeof MapPin;
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <Icon className="mb-2 h-4 w-4 text-workon-gold" />
      <p className="line-clamp-1 text-sm font-black">{label}</p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-white/58">{detail}</p>
    </div>
  );
}
