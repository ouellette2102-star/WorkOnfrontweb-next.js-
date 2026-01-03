/**
 * Premium Feature Gating
 */

type PremiumCheckable = {
  isPremium?: boolean;
  completedMissions?: number;
} | null | undefined;

export function isPremiumUser(workerProfile: PremiumCheckable): boolean {
  if (!workerProfile) return false;
  
  if ("isPremium" in workerProfile && workerProfile.isPremium === true) {
    return true;
  }
  
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_PREMIUM_TEST === "true"
  ) {
    return true;
  }
  
  return false;
}

export type PremiumTier = "none" | "starter" | "pro";

export function getPremiumTier(workerProfile: PremiumCheckable): PremiumTier {
  if (!isPremiumUser(workerProfile)) return "none";
  const missions = workerProfile?.completedMissions ?? 0;
  if (missions >= 10) return "pro";
  return "starter";
}

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

export function getPremiumFeatures(tier: PremiumTier) {
  return PREMIUM_FEATURES[tier];
}
