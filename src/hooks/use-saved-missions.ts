"use client";

import { useSyncExternalStore } from "react";
import {
  getSavedMissionsSnapshot,
  getServerSavedMissionsSnapshot,
  subscribeSavedMissions,
  toggleSavedMission,
  type SavedMission,
} from "@/lib/saved-missions";

/**
 * Reactive view of the saved-missions store. Re-renders on save/unsave in
 * this tab and across tabs. SSR-safe (server snapshot is empty).
 */
export function useSavedMissions() {
  const saved = useSyncExternalStore(
    subscribeSavedMissions,
    getSavedMissionsSnapshot,
    getServerSavedMissionsSnapshot,
  );

  return {
    saved,
    count: saved.length,
    isSaved: (id: string) => saved.some((m: SavedMission) => m.id === id),
    toggle: toggleSavedMission,
  };
}
