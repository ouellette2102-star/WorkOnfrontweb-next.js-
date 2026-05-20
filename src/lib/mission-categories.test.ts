// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  MISSION_CATEGORY_OPTIONS,
  MISSION_CATEGORY_VALUES,
  getMissionCategoryLabel,
  isMissionCategory,
} from "./mission-categories";

describe("mission categories", () => {
  it("matches the documented /missions-local category enum", () => {
    expect(MISSION_CATEGORY_VALUES).toEqual([
      "cleaning",
      "snow_removal",
      "moving",
      "handyman",
      "gardening",
      "painting",
      "delivery",
      "other",
    ]);
  });

  it("rejects catalog labels and legacy categories as create-mission payloads", () => {
    expect(isMissionCategory("Entretien")).toBe(false);
    expect(isMissionCategory("plumbing")).toBe(false);
    expect(isMissionCategory("cleaning")).toBe(true);
    expect(isMissionCategory("snow_removal")).toBe(true);
  });

  it("keeps every UI option backed by an official payload value", () => {
    expect(MISSION_CATEGORY_OPTIONS.every((option) => isMissionCategory(option.value))).toBe(true);
    expect(getMissionCategoryLabel("snow_removal")).toBe("Déneigement");
  });
});
