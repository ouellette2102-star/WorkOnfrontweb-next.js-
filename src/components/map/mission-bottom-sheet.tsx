"use client";

import Link from "next/link";
import {
  MapPin,
  Navigation,
  DollarSign,
  X,
  ArrowRight,
  Tag,
} from "lucide-react";
import type { MissionResponse } from "@/lib/api-client";
import { missionStatusLabel, missionStatusColor } from "@/lib/i18n-labels";

/**
 * Bottom sheet shown when a map pin is tapped. Mobile-first (slides
 * up from bottom), dismissable by backdrop tap or close button.
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
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-workon-bg-cream"
        >
          <X className="h-4 w-4 text-workon-muted" />
        </button>

        <div className="px-5 pb-6 pt-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-workon-ink truncate">
                {mission.title}
              </h3>
              <p className="text-xs text-workon-muted mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {mission.city}
                {mission.distanceKm != null && (
                  <>
                    {" · "}
                    <Navigation className="h-3 w-3 shrink-0" />
                    <span>{mission.distanceKm.toFixed(1)} km</span>
                  </>
                )}
              </p>
            </div>
            <span
              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${missionStatusColor(mission.status)}`}
            >
              {missionStatusLabel(mission.status)}
            </span>
          </div>

          {/* Price + Category */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-workon-primary text-white text-sm font-bold">
              <DollarSign className="h-3.5 w-3.5" />
              {mission.price}
            </span>
            {mission.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-workon-primary-subtle text-workon-primary text-xs font-medium">
                <Tag className="h-3 w-3" />
                {mission.category}
              </span>
            )}
          </div>

          {/* Description preview */}
          {mission.description && (
            <p className="text-sm text-workon-gray leading-relaxed line-clamp-3 mb-4">
              {mission.description}
            </p>
          )}

          {/* CTA */}
          <Link
            href={`/missions/${mission.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-workon-primary text-white font-semibold text-sm hover:bg-workon-primary/90 transition-colors"
          >
            Voir les détails
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
