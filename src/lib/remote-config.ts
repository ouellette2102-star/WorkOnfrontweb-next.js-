/**
 * Remote runtime config — kill-switches, maintenance mode, feature flags.
 *
 * Ported in spirit from the legacy Flutter app's `RemoteConfigSnapshot`
 * (`workon-frontend/lib/services/remote_config`). Lets a solo founder flip
 * behaviour (disable a broken feature, show a maintenance screen, gate a
 * rollout) WITHOUT shipping code.
 *
 * Source of truth (server-side, in order):
 *   1. `REMOTE_CONFIG` env var — a JSON object matching {@link RemoteConfig}.
 *   2. Otherwise {@link DEFAULT_REMOTE_CONFIG}.
 *
 * **Safety contract:** defaults = everything ENABLED, maintenance OFF. An
 * absent, empty, or malformed config therefore NEVER changes behaviour —
 * the app runs exactly as if this layer did not exist.
 *
 * Upgrade paths (no API change — same shape):
 *   - Back it with **Vercel Edge Config** for instant flips with no redeploy.
 *   - Or set `REMOTE_CONFIG_URL` and fetch a hosted JSON (the Flutter app's
 *     approach) so the JSON can change without redeploying the web.
 */

export interface RemoteConfig {
  /** Show a full-screen maintenance notice instead of the app. */
  maintenanceMode: boolean;
  /** Optional message rendered on the maintenance screen. */
  maintenanceMessage: string | null;
  /** Kill-switch: hide/disable auth entry points. */
  disableAuth: boolean;
  /** Kill-switch: hide/disable payment actions. */
  disablePayments: boolean;
  /** Minimum web build the client should be on (forced-refresh hint). */
  minVersion: string | null;
  /** Named feature flags. Unknown names fall back to the caller's default. */
  features: Record<string, boolean>;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  maintenanceMode: false,
  maintenanceMessage: null,
  disableAuth: false,
  disablePayments: false,
  minVersion: null,
  features: {},
};

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asFlags(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, boolean> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "boolean") out[key] = raw;
    else if (typeof raw === "string") {
      if (raw.toLowerCase() === "true") out[key] = true;
      else if (raw.toLowerCase() === "false") out[key] = false;
    }
  }
  return out;
}

/**
 * Coerce an untrusted partial object into a complete {@link RemoteConfig},
 * filling every missing/invalid field from {@link DEFAULT_REMOTE_CONFIG}.
 * Never throws.
 */
export function parseRemoteConfig(raw: unknown): RemoteConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_REMOTE_CONFIG };
  }
  const obj = raw as Record<string, unknown>;
  return {
    maintenanceMode: asBool(obj.maintenanceMode, DEFAULT_REMOTE_CONFIG.maintenanceMode),
    maintenanceMessage: asStringOrNull(obj.maintenanceMessage),
    disableAuth: asBool(obj.disableAuth, DEFAULT_REMOTE_CONFIG.disableAuth),
    disablePayments: asBool(obj.disablePayments, DEFAULT_REMOTE_CONFIG.disablePayments),
    minVersion: asStringOrNull(obj.minVersion),
    features: asFlags(obj.features),
  };
}

/**
 * Read the config server-side. Reads `process.env.REMOTE_CONFIG` (JSON);
 * on any problem returns safe defaults. Call this from server components and
 * route handlers only.
 */
export function getRemoteConfig(): RemoteConfig {
  const rawEnv = process.env.REMOTE_CONFIG;
  if (!rawEnv) return { ...DEFAULT_REMOTE_CONFIG };
  try {
    return parseRemoteConfig(JSON.parse(rawEnv));
  } catch {
    return { ...DEFAULT_REMOTE_CONFIG };
  }
}

/**
 * Whether a named feature is on. Unknown flags return `fallback` (default
 * `true`) so adding a `useFeatureFlag("x")` call before "x" exists in config
 * keeps the feature visible.
 */
export function isFeatureEnabled(
  config: RemoteConfig,
  name: string,
  fallback = true,
): boolean {
  const value = config.features[name];
  return typeof value === "boolean" ? value : fallback;
}
