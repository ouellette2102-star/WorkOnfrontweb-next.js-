/**
 * Lightweight analytics wrapper.
 *
 * Sends custom product events through Sentry (already initialised at the
 * app root). No extra dependency, no extra SDK to load at boot. When we
 * eventually add a dedicated product-analytics tool (PostHog, Amplitude),
 * only this file changes — callers stay the same.
 *
 * Failure mode: any throw inside Sentry is swallowed. Analytics is best-
 * effort and must never break a user-facing flow.
 */

import * as Sentry from "@sentry/nextjs";

export type MissionCardVariant = "pro" | "client";

/** Where the tracked click happened — helps segment CTR by surface. */
export type MissionCardSource =
  | "public_feed"
  | "mine"
  | "employer_dashboard"
  | "map_list"
  | "map_pin"
  | "other";

export interface MissionCardClickPayload {
  missionId: string;
  variant: MissionCardVariant;
  source: MissionCardSource;
  /** `true` when the card had a real photo hero, `false` for the gradient placeholder. */
  hasPhoto: boolean;
  /** `true` when the click came from the inline CTA button, `false` for the card body. */
  viaCTA: boolean;
}

/**
 * Record a mission-card click. Fire-and-forget — never rejects, never throws.
 * Callers may still `await` but there is nothing to wait on.
 */
export function trackMissionCardClick(payload: MissionCardClickPayload): void {
  try {
    Sentry.addBreadcrumb({
      category: "mission_card",
      level: "info",
      message: "mission_card_click",
      data: payload,
    });
    Sentry.captureMessage("mission_card_click", {
      level: "info",
      tags: {
        event: "mission_card_click",
        variant: payload.variant,
        source: payload.source,
        hasPhoto: String(payload.hasPhoto),
        viaCTA: String(payload.viaCTA),
      },
      extra: { missionId: payload.missionId },
    });
  } catch {
    // Analytics failures must never surface to users.
  }
}
