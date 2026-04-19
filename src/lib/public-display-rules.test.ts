// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { FeaturedReview, PublicStats } from "./public-api";
import {
  displayStatOrFallback,
  filterDisplayableReviews,
  hasAnyDisplayableStat,
  isDisplayableReview,
  shouldDisplayStat,
} from "./public-display-rules";

function review(over: Partial<FeaturedReview> = {}): FeaturedReview {
  return {
    id: "r1",
    rating: 5,
    comment:
      "Service impeccable, à l'heure et très professionnel. Je recommande sans hésiter.",
    authorName: "Marie L.",
    workerName: "Julien P.",
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("isDisplayableReview", () => {
  it("accepts a real review with author + long comment", () => {
    expect(isDisplayableReview(review())).toBe(true);
  });

  it("rejects reviews with no author name", () => {
    expect(isDisplayableReview(review({ authorName: undefined }))).toBe(false);
    expect(isDisplayableReview(review({ authorName: "" }))).toBe(false);
    expect(isDisplayableReview(review({ authorName: "   " }))).toBe(false);
  });

  it("rejects short comments", () => {
    expect(isDisplayableReview(review({ comment: "ok" }))).toBe(false);
    expect(isDisplayableReview(review({ comment: "Pro, rapide" }))).toBe(false);
  });

  it("rejects smoke/seed/test keywords (case-insensitive)", () => {
    const blocked = [
      "Smoke test OK before launch, ignore this review please",
      "Final smoke test — platform verification entry",
      "This is a test comment with enough length to pass",
      "Seed review created during migration 2026-04-17 00:00",
      "Demo content for the landing page hero section only",
    ];
    for (const comment of blocked) {
      expect(isDisplayableReview(review({ comment }))).toBe(false);
    }
  });

  it("filters a live prod payload to zero when all are seed reviews", () => {
    const prodSnapshot: FeaturedReview[] = [
      review({ comment: "Pro, rapide", authorName: null as unknown as string }),
      review({ comment: "Smoke test OK", authorName: null as unknown as string }),
      review({ comment: "Final smoke test", authorName: null as unknown as string }),
    ];
    expect(filterDisplayableReviews(prodSnapshot)).toEqual([]);
  });
});

describe("shouldDisplayStat", () => {
  it("rejects undefined/null", () => {
    expect(shouldDisplayStat(undefined, "activeWorkers")).toBe(false);
    expect(shouldDisplayStat(null, "activeWorkers")).toBe(false);
  });

  it("rejects below threshold", () => {
    expect(shouldDisplayStat(14, "completedMissions")).toBe(false); // prod: 14
    expect(shouldDisplayStat(49, "activeWorkers")).toBe(false); // prod: 49
    expect(shouldDisplayStat(4, "activeCities")).toBe(false); // prod: 4
  });

  it("accepts at or above threshold", () => {
    expect(shouldDisplayStat(50, "completedMissions")).toBe(true);
    expect(shouldDisplayStat(100, "activeWorkers")).toBe(true);
  });
});

describe("displayStatOrFallback", () => {
  it("returns fallback below threshold", () => {
    expect(displayStatOrFallback(14, "completedMissions", "500+")).toBe("500+");
    expect(displayStatOrFallback(undefined, "activeWorkers", "100+")).toBe("100+");
  });

  it("returns localized value at threshold", () => {
    // fr-CA uses non-breaking space as thousands separator
    expect(displayStatOrFallback(1500, "completedMissions", "500+")).toMatch(
      /1.500/,
    );
  });
});

describe("hasAnyDisplayableStat", () => {
  it("false for null", () => {
    expect(hasAnyDisplayableStat(null)).toBe(false);
  });

  it("false when every stat is under its threshold", () => {
    const snapshot: PublicStats = {
      activeWorkers: 10, // threshold 50
      completedMissions: 5, // threshold 50
      openMissions: 2, // threshold 10
      sectorCount: 1,
      activeCities: 1, // threshold 5
      averagePlatformRating: 5,
    };
    expect(hasAnyDisplayableStat(snapshot)).toBe(false);
  });

  it("true when at least one stat above threshold (live prod: openMissions=34 ≥ 10)", () => {
    const snapshot: PublicStats = {
      activeWorkers: 49, // < 50 threshold
      completedMissions: 14, // < 50 threshold
      openMissions: 34, // ≥ 10 threshold — real live signal
      sectorCount: 2,
      activeCities: 4, // < 5 threshold
      averagePlatformRating: 5,
    };
    expect(hasAnyDisplayableStat(snapshot)).toBe(true);
  });
});
