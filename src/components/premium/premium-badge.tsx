/**
 * Premium Badge Component
 * PR-26: Premium v1 - Badge discret pour profils premium
 */

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { type PremiumTier, PREMIUM_COPY } from "@/lib/premium";

type PremiumBadgeProps = {
  tier: PremiumTier;
  size?: "sm" | "md";
  className?: string;
};

export function PremiumBadge({ tier, size = "sm", className = "" }: PremiumBadgeProps) {
  if (tier === "none") return null;

  const label = tier === "pro" ? PREMIUM_COPY.badge.pro : PREMIUM_COPY.badge.starter;
  const isSmall = size === "sm";

  return (
    <Badge
      variant="outline"
      className={`bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400 ${
        isSmall ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      } ${className}`}
    >
      <Sparkles className={`${isSmall ? "h-3 w-3" : "h-4 w-4"} mr-1`} />
      {label}
    </Badge>
  );
}

