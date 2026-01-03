/**
 * Premium Upgrade CTA Component
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";

const BENEFITS = [
  "Badge Premium visible sur votre profil",
  "Profil mis en avant dans les résultats",
  "Vitrine étendue pour vos réalisations",
];

type PremiumUpgradeCtaProps = {
  variant?: "inline" | "card";
  className?: string;
};

export function PremiumUpgradeCta({
  variant = "card",
  className = "",
}: PremiumUpgradeCtaProps) {
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center justify-between gap-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <span className="text-sm text-white/80">
            Amplifie votre visibilité
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled
          className="border-amber-500/30 text-amber-400"
        >
          Bientôt disponible
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
            <p className="text-sm text-white/60">
              Amplifie votre visibilité
            </p>
          </div>
        </div>

        <ul className="space-y-2 mb-6">
          {BENEFITS.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-white/70">
              <Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <Button
          disabled
          className="w-full bg-gradient-to-r from-amber-500/50 to-yellow-500/50 text-black/50"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Bientôt disponible
        </Button>
      </CardContent>
    </Card>
  );
}
