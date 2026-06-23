/**
 * Saved missions — a purely client-side "favourites" store backed by
 * localStorage. Ported in spirit from the legacy Flutter app's
 * `saved/saved_missions_store.dart`.
 *
 * We store a *snapshot* of each mission's card data (not just the id) so the
 * /saved page can render without N+1 fetches and keeps working even if the
 * mission later disappears from the feed. No backend, no auth dependency.
 */
"use client";

import type { MissionCardInput } from "@/components/mission/mission-card";

export type SavedMission = MissionCardInput;

const STORAGE_KEY = "workon_saved_missions";

const listeners = new Set<() => void>();

/** Cached snapshot so getSnapshot() returns a stable reference between
 * changes (required by useSyncExternalStore — a fresh array every call would
 * loop forever). We re-parse only when the raw string actually changes. */
let cachedRaw: string | null = null;
let cachedValue: SavedMission[] = [];
const EMPTY: SavedMission[] = [];

function rawFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function isValid(m: unknown): m is SavedMission {
  return (
    !!m &&
    typeof m === "object" &&
    typeof (m as { id?: unknown }).id === "string"
  );
}

/** Stable snapshot of the saved list (safe to use in useSyncExternalStore). */
export function getSavedMissionsSnapshot(): SavedMission[] {
  const raw = rawFromStorage();
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch {
    cachedValue = [];
  }
  return cachedValue;
}

/** Server snapshot — always empty (localStorage is client-only). */
export function getServerSavedMissionsSnapshot(): SavedMission[] {
  return EMPTY;
}

function persist(next: SavedMission[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode — ignore, the feature is best-effort */
  }
  // Refresh the cache immediately so synchronous reads see the new value.
  cachedRaw = JSON.stringify(next);
  cachedValue = next;
  listeners.forEach((fn) => fn());
}

export function isMissionSaved(id: string): boolean {
  return getSavedMissionsSnapshot().some((m) => m.id === id);
}

/** Toggle a mission's saved state. Returns true if it is now saved. */
export function toggleSavedMission(mission: SavedMission): boolean {
  const current = getSavedMissionsSnapshot();
  const exists = current.some((m) => m.id === mission.id);
  const next = exists
    ? current.filter((m) => m.id !== mission.id)
    : [{ ...mission }, ...current];
  persist(next);
  return !exists;
}

export function removeSavedMission(id: string): void {
  const current = getSavedMissionsSnapshot();
  if (!current.some((m) => m.id === id)) return;
  persist(current.filter((m) => m.id !== id));
}

/** Subscribe to changes (same tab via listeners, other tabs via `storage`). */
export function subscribeSavedMissions(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedRaw = null; // force re-parse from the new value
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}
