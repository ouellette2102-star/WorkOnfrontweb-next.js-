/**
 * Premium Plans Configuration
 * PR-27: Paiement Premium & plans
 *
 * Règles:
 * - Aucune promesse chiffrée (+jobs, +revenus)
 * - Description factuelle des avantages
 * - Prix transparents
 */

export type PremiumPlanId = "monthly" | "yearly";

export type PremiumPlan = {
  id: PremiumPlanId;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  popular?: boolean;
  savings?: string;
};

export const PREMIUM_PLANS: Record<PremiumPlanId, PremiumPlan> = {
  monthly: {
    id: "monthly",
    name: "Premium Mensuel",
    description: "Flexibilité maximale, sans engagement",
    priceCents: 1999, // 19.99 CAD
    currency: "CAD",
    interval: "month",
    features: [
      "Badge Premium sur votre profil",
      "Profil mis en avant dans les résultats",
      "Section Points forts visible",
      "Annulez à tout moment",
    ],
  },
  yearly: {
    id: "yearly",
    name: "Premium Annuel",
    description: "Meilleure valeur, économisez 2 mois",
    priceCents: 19999, // 199.99 CAD (= ~16.67/mois)
    currency: "CAD",
    interval: "year",
    popular: true,
    savings: "Économisez 40$",
    features: [
      "Tous les avantages Premium",
      "Profil prioritaire dans les recherches",
      "Vitrine étendue pour votre portfolio",
      "Support prioritaire",
    ],
  },
};

/**
 * Format price for display
 */
export function formatPrice(priceCents: number, currency: string): string {
  const price = priceCents / 100;
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: PremiumPlanId): PremiumPlan | null {
  return PREMIUM_PLANS[planId] ?? null;
}

/**
 * Get all plans as array
 */
export function getAllPlans(): PremiumPlan[] {
  return Object.values(PREMIUM_PLANS);
}

