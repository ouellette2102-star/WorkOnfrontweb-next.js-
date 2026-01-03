/**
 * Premium Feature Gating
 * PR-26: Premium v1 - Amplification de signaux réels
 *
 * Règles:
 * - En DEV: isPremium contrôlable via flag
 * - En PROD: isPremium = false par défaut si non configuré
 * - Aucune promesse chiffrée
 * - Amplification basée sur signaux existants uniquement
 */

/**
 * Check if premium features are enabled for a user
 * For now, this is based on workerProfile flags
 * In production, this would come from subscription status
 */
export function isPremiumUser(workerProfile: {
  isPremium?: boolean;
  completedMissions?: number;
  verified?: boolean;
} | null | undefined): boolean {
  if (!workerProfile) return false;

  // Explicit premium flag from backend
  if (workerProfile.isPremium === true) return true;

  // Dev mode: allow testing via env
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_PREMIUM_TEST === "true"
  ) {
    return true;
  }

  return false;
}

/**
 * Premium tier based on real signals (no fake promises)
 */
export type PremiumTier = "none" | "starter" | "pro";

export function getPremiumTier(workerProfile: {
  isPremium?: boolean;
  completedMissions?: number;
} | null | undefined): PremiumTier {
  if (!isPremiumUser(workerProfile)) return "none";

  const missions = workerProfile?.completedMissions ?? 0;

  // Pro tier: 10+ missions completed
  if (missions >= 10) return "pro";

  // Starter tier: has premium, building track record
  return "starter";
}

/**
 * Premium features available per tier
 */
export const PREMIUM_FEATURES = {
  none: {
    badge: false,
    highlightedProfile: false,
    extendedShowcase: false,
    priorityListing: false,
  },
  starter: {
    badge: true,
    highlightedProfile: true,
    extendedShowcase: false,
    priorityListing: false,
  },
  pro: {
    badge: true,
    highlightedProfile: true,
    extendedShowcase: true,
    priorityListing: true,
  },
} as const;

/**
 * Get features for a premium tier
 */
export function getPremiumFeatures(tier: PremiumTier) {
  return PREMIUM_FEATURES[tier];
}

/**
 * Premium copy - factual, no promises
 */
export const PREMIUM_COPY = {
  badge: {
    starter: "Premium",
    pro: "Premium Pro",
  },
  tagline: "Amplifie votre visibilité basée sur vos performances",
  cta: {
    upgrade: "Débloquer Premium",
    learnMore: "En savoir plus",
  },
  benefits: [
    "Badge Premium visible sur votre profil",
    "Profil mis en avant dans les résultats",
    "Vitrine étendue pour vos réalisations",
  ],
} as const;

