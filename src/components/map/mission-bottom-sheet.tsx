"use client";

import { X } from "lucide-react";
import type { MissionResponse } from "@/lib/api-client";
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
  mission: MissionResponse | null;
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

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl bg-white shadow-xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-workon-border" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-workon-bg-cream"
        >
          <X className="h-4 w-4 text-workon-muted" />
        </button>

        <div className="px-4 pb-5 pt-2">
          <MissionCard
            mission={mission}
            variant="pro"
            source="map_pin"
            className="border-0 shadow-none hover:translate-y-0 hover:shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
