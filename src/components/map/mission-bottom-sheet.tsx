"use client";

import { MapPin, ShieldCheck, X } from "lucide-react";
import type { MissionMapItem } from "@/lib/api-client";
import { MissionCard } from "@/components/mission/mission-card";

/**
 * Bottom sheet shown when a map pin is tapped. Mobile-first (slides
 * up from bottom), dismissable by backdrop tap or close button.
 *
 * Wraps the shared <MissionCard> so the pin-popup, the map list and
 * the public feed all share a single visual source of truth.
 */
export function MissionBottomSheet({
  mission,
  onClose,
}: {
  mission: MissionMapItem | null;
  onClose: () => void;
}) {
  if (!mission) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />

      <div
        className="relative w-full max-w-lg rounded-t-[32px] border border-white/70 bg-workon-surface shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1.5 w-12 rounded-full bg-workon-stone-subtle" />
        </div>

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 rounded-full border border-workon-border bg-white p-2 shadow-sm hover:bg-workon-bg-cream"
        >
          <X className="h-4 w-4 text-workon-stone" />
        </button>

        <div className="px-4 pb-5 pt-2">
          <div className="mb-3 pr-12">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-workon-primary-subtle px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-workon-primary">
              <MapPin className="h-3.5 w-3.5" />
              Opportunite selectionnee
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold leading-tight text-workon-ink">
              Verifie le potentiel avant de postuler.
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-workon-stone">
              <ShieldCheck className="h-3.5 w-3.5 text-workon-trust-green" />
              Paiement securise, contrat protege, suivi WorkOn.
            </p>
          </div>

          <MissionCard
            mission={mission}
            variant="pro"
            source="map_pin"
            className="border-workon-border shadow-card hover:translate-y-0 hover:shadow-card"
          />
        </div>
      </div>
    </div>
  );
}
