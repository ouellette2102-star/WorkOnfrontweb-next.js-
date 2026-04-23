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
  // "Nouveau profil" — neutral, honest
  nouveau:
    "bg-workon-bg-cream text-workon-gray border border-workon-border",
  // VERIFIED tier — first trust step (terracotta)
  verified:
    "bg-workon-accent/10 text-workon-accent border border-workon-accent/25",
  // TRUSTED tier — solid track record (green)
  trusted:
    "bg-workon-trust-green/10 text-workon-trust-green border border-workon-trust-green/25",
  // PREMIUM / top performer (gold — intentional off-brand tier color, no token)
  premium:
    "bg-gradient-to-r from-[#D4922A]/15 to-[#D4922A]/10 text-[#D4922A] border border-[#D4922A]/30",
  // "Fiable" / "Ponctuel" behavioural badge
  fiable:
    "bg-workon-bg text-workon-gray border border-workon-border",
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
