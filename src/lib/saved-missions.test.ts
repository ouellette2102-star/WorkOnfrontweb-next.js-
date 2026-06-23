import { describe, it, expect, beforeEach } from "vitest";
import {
  getSavedMissionsSnapshot,
  isMissionSaved,
  removeSavedMission,
  toggleSavedMission,
  type SavedMission,
} from "./saved-missions";

const mission = (id: string): SavedMission => ({
  id,
  title: `Mission ${id}`,
  category: "menage",
  createdAt: new Date().toISOString(),
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("saved-missions store", () => {
  it("starts empty", () => {
    expect(getSavedMissionsSnapshot()).toEqual([]);
    expect(isMissionSaved("1")).toBe(false);
  });

  it("toggle adds then removes, and reports the new state", () => {
    expect(toggleSavedMission(mission("1"))).toBe(true);
    expect(isMissionSaved("1")).toBe(true);
    expect(getSavedMissionsSnapshot().map((m) => m.id)).toEqual(["1"]);

    expect(toggleSavedMission(mission("1"))).toBe(false);
    expect(isMissionSaved("1")).toBe(false);
    expect(getSavedMissionsSnapshot()).toEqual([]);
  });

  it("prepends newest first and never duplicates an id", () => {
    toggleSavedMission(mission("1"));
    toggleSavedMission(mission("2"));
    toggleSavedMission(mission("2")); // toggling 2 off
    toggleSavedMission(mission("2")); // and back on
    expect(getSavedMissionsSnapshot().map((m) => m.id)).toEqual(["2", "1"]);
  });

  it("removeSavedMission removes by id", () => {
    toggleSavedMission(mission("1"));
    removeSavedMission("1");
    expect(isMissionSaved("1")).toBe(false);
  });

  it("ignores malformed storage instead of throwing", () => {
    window.localStorage.setItem("workon_saved_missions", "{not json");
    expect(getSavedMissionsSnapshot()).toEqual([]);
  });
});
