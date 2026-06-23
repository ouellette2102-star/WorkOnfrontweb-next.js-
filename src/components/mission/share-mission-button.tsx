"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { shareMission } from "@/lib/share-mission";

/**
 * Share a mission via the native share sheet (mobile) or by copying the link
 * (desktop). Safe to place on a clickable card — it stops propagation so it
 * never triggers the card's navigation.
 */
export function ShareMissionButton({
  mission,
  className,
}: {
  mission: { id: string; title?: string };
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Partager la mission"
      title="Partager la mission"
      data-testid="share-mission-button"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const result = await shareMission(mission);
        if (result === "copied") toast.success("Lien copié dans le presse-papiers");
        else if (result === "failed") toast.error("Partage indisponible sur cet appareil");
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-workon-border bg-white/90 text-workon-stone shadow-sm backdrop-blur transition-colors hover:text-workon-primary",
        className,
      )}
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
