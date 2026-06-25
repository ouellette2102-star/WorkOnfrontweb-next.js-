import { AlertCircle, CheckCircle2, ShieldCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TrustTierBadge — compact icon + label badge that mirrors the
 * backend `LocalUser.trustTier` enum. Designed to sit as an overlay on
 * a worker card photo (top-right corner).
 *
 * BASIC    → hidden by default. Pass `showBasic` to render a muted
 *            "À vérifier" pill — used on the user's OWN profile so they
 *            see they haven't completed phone OTP yet. Never surface
 *            BASIC publicly (stigmatizes unverified users).
 * VERIFIED → Vérifié      (bleu)
 * TRUSTED  → De confiance (vert)
 * PREMIUM  → Top Performer (marine) — rouge réservé à l'action
 */

export type TrustTier = "BASIC" | "VERIFIED" | "TRUSTED" | "PREMIUM";

const TIER_CONFIG: Record<
  TrustTier,
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  BASIC: {
    icon: AlertCircle,
    label: "À vérifier",
    className: "bg-workon-bg text-workon-muted border border-workon-border",
  },
  VERIFIED: {
    icon: CheckCircle2,
    label: "Vérifié",
    className: "bg-[#2E7DFF] text-white",
  },
  TRUSTED: {
    icon: ShieldCheck,
    label: "De confiance",
    className: "bg-workon-trust-green text-white",
  },
  PREMIUM: {
    icon: Crown,
    label: "Top Performer",
    className: "bg-[#0E1B2A] text-white",
  },
};

export function TrustTierBadge({
  tier,
  compact = false,
  showBasic = false,
  className,
}: {
  tier?: TrustTier;
  compact?: boolean;
  showBasic?: boolean;
  className?: string;
}) {
  if (!tier) return null;
  if (tier === "BASIC" && !showBasic) return null;
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium shadow-sm backdrop-blur-sm",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        config.className,
        className,
      )}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.5} />
      {!compact && <span>{config.label}</span>}
    </span>
  );
}
