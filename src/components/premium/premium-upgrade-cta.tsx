/**
 * Premium Upgrade CTA Component
 * PR-26: Premium v1 - CTA sobre et factuel
 *
 * Règles:
 * - Aucune promesse chiffrée
 * - Copy factuelle uniquement
 * - Pas de manipulation
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { PREMIUM_COPY } from "@/lib/premium";

type PremiumUpgradeCtaProps = {
  variant?: "inline" | "card";
  className?: string;
};

export function PremiumUpgradeCta({
  variant = "card",
  className = "",
}: PremiumUpgradeCtaProps) {
  // In PR-26, we don't implement payment - just show the CTA
  // PR-27 will handle actual subscription flow

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center justify-between gap-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <span className="text-sm text-white/80">{PREMIUM_COPY.tagline}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          disabled
          title="Bientôt disponible"
        >
          {PREMIUM_COPY.cta.upgrade}
        </Button>
      </div>
    );
  }

  return (
    <Card className={`border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-amber-500/20">
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">WorkOn Premium</h3>
            <p className="text-sm text-white/60">{PREMIUM_COPY.tagline}</p>
          </div>
        </div>

        <ul className="space-y-2 mb-6">
          {PREMIUM_COPY.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-white/70">
              <Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-400 hover:to-yellow-400"
          disabled
          title="Bientôt disponible"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {PREMIUM_COPY.cta.upgrade}
        </Button>

        <p className="text-center text-xs text-white/40 mt-3">
          Bientôt disponible
        </p>
      </CardContent>
    </Card>
  );
}

