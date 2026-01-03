/**
 * Premium Badge Component
 */

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

type PremiumBadgeProps = {
  tier?: "none" | "starter" | "pro";
  size?: "sm" | "md";
  className?: string;
};

export function PremiumBadge({
  tier = "starter",
  size = "sm",
  className = "",
}: PremiumBadgeProps) {
  const label = tier === "pro" ? "Premium Pro" : "Premium";
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <Badge
      className={`bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold border-0 ${sizeClasses} ${className}`}
    >
      <Sparkles className={size === "sm" ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1.5"} />
      {label}
    </Badge>
  );
}
