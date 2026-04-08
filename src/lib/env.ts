/**
 * Centralized, validated environment access.
 *
 * The contract for `NEXT_PUBLIC_API_URL` is the FULL backend base URL,
 * including the `/api/v1` prefix (e.g.
 * `https://workon-backend-production-8908.up.railway.app/api/v1`).
 *
 * Historically this was confused with the bare host (without `/api/v1`),
 * which silently turned every backend call into a 404. We now validate
 * the value at module load and trim accidental whitespace / newlines
 * (which previously crept in via copy-pasted Vercel env vars).
 */

const FALLBACK_API_URL = "http://localhost:3001/api/v1";

function readApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return FALLBACK_API_URL;

  // Strip a single trailing slash so callers can safely concatenate
  // `${API_URL}/auth/login` without producing a double slash.
  const trimmed = raw.replace(/\/+$/, "");

  // Soft-validate: if the URL doesn't end with `/api/v1` (or any
  // versioned API segment) we still let it through, but log a loud
  // warning at boot. We never throw because we don't want to break the
  // build over an env mistake — the runtime call will surface a 404
  // and the validation in lib/env.assertApiUrl can be called explicitly
  // by callers that want a hard guarantee.
  if (!/\/api\/v\d+$/.test(trimmed)) {
    if (typeof window === "undefined") {
      // Server-side only to avoid spamming the browser console.
      // eslint-disable-next-line no-console
      console.warn(
        `[env] NEXT_PUBLIC_API_URL does not end with /api/vN — got "${trimmed}". ` +
          `This is almost certainly wrong; backend calls will return 404. ` +
          `Expected format: https://host/api/v1`,
      );
    }
  }

  return trimmed;
}

export const env = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000",
  NEXT_PUBLIC_API_URL: readApiUrl(),
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};

/**
 * Hard assertion for callers that absolutely need a valid API URL.
 * Throws a descriptive error if the contract is violated.
 */
export function assertApiUrl(): string {
  const url = env.NEXT_PUBLIC_API_URL;
  if (!/^https?:\/\/.+\/api\/v\d+$/.test(url)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_API_URL: "${url}". ` +
        `Expected format: https://host/api/vN (e.g. https://api.example.com/api/v1)`,
    );
  }
  return url;
}
