import { CheckCircle2, ShieldCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TrustTierBadge — compact icon + label badge that mirrors the
 * backend `LocalUser.trustTier` enum. Designed to sit as an overlay on
 * a worker card photo (top-right corner).
 *
 * BASIC    → no badge rendered (nothing to show off)
 * VERIFIED → ✓ Vérifié       (terracotta)
 * TRUSTED  → 🛡 De confiance (green)
 * PREMIUM  → 👑 Top Performer (gold)
 */

export type TrustTier = "BASIC" | "VERIFIED" | "TRUSTED" | "PREMIUM";

const TIER_CONFIG: Record<
  Exclude<TrustTier, "BASIC">,
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  VERIFIED: {
    icon: CheckCircle2,
    label: "Vérifié",
    className: "bg-workon-accent text-white",
  },
  TRUSTED: {
    icon: ShieldCheck,
    label: "De confiance",
    className: "bg-workon-trust-green text-white",
  },
  PREMIUM: {
    icon: Crown,
    label: "Top Performer",
    className: "bg-gradient-to-r from-[#D4922A] to-[#B8771F] text-white",
  },
};

export function TrustTierBadge({
  tier,
  compact = false,
  className,
}: {
  tier?: TrustTier;
  compact?: boolean;
  className?: string;
}) {
  if (!tier || tier === "BASIC") return null;
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
