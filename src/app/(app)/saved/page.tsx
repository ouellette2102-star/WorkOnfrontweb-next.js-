"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { useSavedMissions } from "@/hooks/use-saved-missions";
import { MissionCard } from "@/components/mission/mission-card";

/**
 * "Mes favoris" — missions the user saved (localStorage). Renders the saved
 * snapshots directly, so it works offline and never N+1-fetches.
 */
export default function SavedMissionsPage() {
  const { saved, count } = useSavedMissions();

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-28 pt-4">
      <header className="workon-dark-panel overflow-hidden rounded-[24px] p-5 shadow-[0_18px_40px_rgba(8,34,25,0.18)]">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/78">
          <Heart className="h-3.5 w-3.5 text-workon-gold" />
          Favoris
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white">
          Mes missions sauvegardées
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/72">
          {count > 0
            ? `${count} mission${count > 1 ? "s" : ""} gardée${count > 1 ? "s" : ""} sous la main.`
            : "Garde les missions intéressantes ici pour y revenir."}
        </p>
      </header>

      {saved.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-workon-border bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-workon-bg-cream text-workon-stone">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-workon-ink">
            Aucune mission sauvegardée
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-workon-muted">
            Touche le cœur sur une mission pour la retrouver ici.
          </p>
          <Link
            href="/missions"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-workon-primary px-4 text-sm font-bold text-white hover:bg-workon-primary-hover"
          >
            Parcourir les missions
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="saved-missions-grid"
        >
          {saved.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              variant="pro"
              showSaveButton
            />
          ))}
        </div>
      )}
    </div>
  );
}
