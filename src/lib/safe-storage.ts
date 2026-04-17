/**
 * Safe wrappers around Web Storage APIs.
 *
 * Facebook Messenger / Instagram in-app WebViews (and to a lesser extent
 * Safari Private Mode, tracking-prevention modes, browser extensions that
 * sandbox storage) can throw `SecurityError` or `QuotaExceededError` on
 * any `localStorage` / `sessionStorage` access.
 *
 * When that happens inside an unguarded React effect — e.g. at app boot
 * in AuthProvider or ModeProvider — the exception bubbles up, React marks
 * the subtree as errored, and the page renders our generic error boundary
 * ("Quelque chose s'est mal passé"). The user has no way to recover.
 *
 * This module replaces raw `localStorage.*` calls with fail-safe wrappers:
 *   - SSR-safe (returns null / no-op when `window` is undefined)
 *   - Never throws — access failures are logged and treated as missing value
 *   - Drop-in API (same method names as the native Storage interface)
 *
 * USAGE:
 *   import { safeLocalStorage } from "@/lib/safe-storage";
 *   const token = safeLocalStorage.getItem("key");
 *   safeLocalStorage.setItem("key", "value");
 *
 * DO NOT access `window.localStorage` directly in boot-critical paths.
 */

type StorageKind = "local" | "session";

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    // Some WebViews throw even accessing the property.
    return null;
  }
}

function warn(op: string, key: string, err: unknown) {
  // Keep warnings but avoid noisy stack traces in production consoles.
  // Surfacing via console.warn (not .error) to avoid tripping error
  // boundaries that may watch for console errors.
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[safe-storage] ${op}("${key}") failed:`, message);
  }
}

function makeWrapper(kind: StorageKind) {
  return {
    getItem(key: string): string | null {
      const storage = getStorage(kind);
      if (!storage) return null;
      try {
        return storage.getItem(key);
      } catch (err) {
        warn("getItem", key, err);
        return null;
      }
    },
    setItem(key: string, value: string): void {
      const storage = getStorage(kind);
      if (!storage) return;
      try {
        storage.setItem(key, value);
      } catch (err) {
        warn("setItem", key, err);
      }
    },
    removeItem(key: string): void {
      const storage = getStorage(kind);
      if (!storage) return;
      try {
        storage.removeItem(key);
      } catch (err) {
        warn("removeItem", key, err);
      }
    },
    /**
     * Returns true when the underlying storage is reachable AND usable
     * (read + write round-trip succeeds). Use this to decide whether
     * to show a "Connecte-toi depuis Safari/Chrome" hint in in-app
     * browsers that disabled storage.
     */
    isAvailable(): boolean {
      const storage = getStorage(kind);
      if (!storage) return false;
      const probe = `__safe_probe_${Date.now()}__`;
      try {
        storage.setItem(probe, "1");
        storage.removeItem(probe);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const safeLocalStorage = makeWrapper("local");
export const safeSessionStorage = makeWrapper("session");
