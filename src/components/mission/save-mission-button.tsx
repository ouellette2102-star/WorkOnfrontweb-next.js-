"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedMissions } from "@/hooks/use-saved-missions";
import type { MissionCardInput } from "@/components/mission/mission-card";

/**
 * Heart toggle to save/unsave a mission. Designed to live on top of a
 * clickable mission card: it stops click propagation + default so tapping it
 * never triggers the card's navigation.
 */
export function SaveMissionButton({
  mission,
  className,
}: {
  mission: MissionCardInput;
  className?: string;
}) {
  const { isSaved, toggle } = useSavedMissions();
  const saved = isSaved(mission.id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      data-testid="save-mission-button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(mission);
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 shadow-sm backdrop-blur transition-colors",
        saved
          ? "border-workon-accent/30 text-workon-accent"
          : "border-workon-border text-workon-stone hover:text-workon-accent",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} />
    </button>
  );
}
