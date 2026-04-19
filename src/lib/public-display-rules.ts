/**
 * Public display rules for marketing pages.
 *
 * Raw public API data (`public-api.ts`) is deliberately unfiltered — these
 * helpers are the single source of truth for what is safe to show on
 * unauthenticated marketing surfaces.
 *
 * Two concerns covered:
 *  1. Low-volume stats look worse than round fallbacks (showing "14 missions"
 *     signals amateur; "500+" signals momentum without lying).
 *  2. Test/seed reviews must never surface publicly.
 */

import type { FeaturedReview, PublicStats } from "./public-api";

/**
 * Minimum count required to surface a numerical stat publicly.
 * Below these thresholds the stat card renders a rounded fallback.
 */
export const PUBLIC_STAT_THRESHOLDS = {
  activeWorkers: 50,
  completedMissions: 50,
  openMissions: 10,
  activeCities: 5,
  sectorCount: 3,
} as const;

/** Substrings that disqualify a review from public display (case-insensitive). */
const REVIEW_BLOCKLIST = [
  "test",
  "smoke",
  "pro, rapide",
  "final",
  "seed",
  "demo",
  "lorem",
];

const MIN_REVIEW_COMMENT_LENGTH = 20;

export function isDisplayableReview(review: FeaturedReview): boolean {
  if (!review.authorName || review.authorName.trim().length === 0) return false;

  const comment = review.comment?.trim() ?? "";
  if (comment.length < MIN_REVIEW_COMMENT_LENGTH) return false;

  const lower = comment.toLowerCase();
  if (REVIEW_BLOCKLIST.some((kw) => lower.includes(kw))) return false;

  return true;
}

export function filterDisplayableReviews(
  reviews: FeaturedReview[],
): FeaturedReview[] {
  return reviews.filter(isDisplayableReview);
}

type StatKey = keyof typeof PUBLIC_STAT_THRESHOLDS;

export function shouldDisplayStat(
  value: number | undefined | null,
  key: StatKey,
): boolean {
  if (typeof value !== "number") return false;
  return value >= PUBLIC_STAT_THRESHOLDS[key];
}

/**
 * Localized stat value if above threshold, otherwise the provided fallback.
 * Use round-figure fallbacks (e.g. "100+", "500+") for the live values that
 * undershoot thresholds.
 */
export function displayStatOrFallback(
  value: number | undefined | null,
  key: StatKey,
  fallback: string,
): string {
  if (shouldDisplayStat(value, key)) {
    return (value as number).toLocaleString("fr-CA");
  }
  return fallback;
}

/** True when at least one stat on the homepage has real signal. */
export function hasAnyDisplayableStat(stats: PublicStats | null): boolean {
  if (!stats) return false;
  return (
    shouldDisplayStat(stats.activeWorkers, "activeWorkers") ||
    shouldDisplayStat(stats.completedMissions, "completedMissions") ||
    shouldDisplayStat(stats.openMissions, "openMissions") ||
    shouldDisplayStat(stats.activeCities, "activeCities")
  );
}
