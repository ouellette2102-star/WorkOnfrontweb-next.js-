import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TrustPill — reusable trust/status pill matching the mockups language
 * ("Fiable", "Ponctuel", "Top Performer", "Nouveau", "Vérifié").
 *
 * Single source of truth so worker cards, profile pages, search cards,
 * mission detail etc. all render the same visual for the same concept.
 */

export type TrustPillVariant =
  | "nouveau"
  | "verified"
  | "trusted"
  | "premium"
  | "fiable";

const VARIANT_CLASSES: Record<TrustPillVariant, string> = {
  // "Nouveau profil" — neutral, honest, no fake stars
  nouveau:
    "bg-white/10 text-white/80 border border-white/15",
  // VERIFIED tier — first trust step
  verified:
    "bg-[#FF4D1C]/10 text-[#FF4D1C] border border-[#FF4D1C]/25",
  // TRUSTED tier — solid track record
  trusted:
    "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25",
  // PREMIUM / top performer
  premium:
    "bg-gradient-to-r from-[#FF4D1C]/20 to-[#FF8C32]/20 text-[#FFA37C] border border-[#FF4D1C]/40",
  // "Fiable" / "Ponctuel" behavioural badge
  fiable:
    "bg-white/5 text-white/70 border border-white/10",
};

const DEFAULT_LABEL: Record<TrustPillVariant, string> = {
  nouveau: "Nouveau profil",
  verified: "Vérifié",
  trusted: "De confiance",
  premium: "Top Performer",
  fiable: "Fiable",
};

export interface TrustPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: TrustPillVariant;
  /** Override the default French label. */
  label?: string;
  /** Optional leading icon (emoji or tiny svg). */
  icon?: React.ReactNode;
}

export function TrustPill({
  variant,
  label,
  icon,
  className,
  ...props
}: TrustPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {label ?? DEFAULT_LABEL[variant]}
    </span>
  );
}
