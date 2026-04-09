/**
 * Sentry browser-side initialization.
 *
 * Loaded via `instrumentation-client.ts` on the client. Only initializes
 * if NEXT_PUBLIC_SENTRY_DSN is set on the build — otherwise the SDK
 * stays dormant so local dev and PR previews without the env var are
 * a no-op. Production environment on Vercel sets the DSN.
 *
 * Note on scope: we only capture ERRORS and UNHANDLED REJECTIONS by
 * default (no performance / replay / profiling) to keep the free tier
 * event budget reasonable. Traces and replay can be added later via
 * env vars without touching this file.
 */

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,

    // Low traces rate by default; override via
    // NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE if you want more.
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.05",
    ),

    // Release tag — Vercel injects VERCEL_GIT_COMMIT_SHA in build-time env.
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // Environment tag so Sentry splits dev / preview / prod.
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",

    // Filter out noisy errors that aren't actionable.
    ignoreErrors: [
      // Cross-origin <script> errors we can't see into.
      "Script error.",
      // Chrome extensions injecting broken code.
      /chrome-extension:\/\//,
      // ResizeObserver loop warning — benign, browser-level.
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Known user navigation cancellation from Next.js router.
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
    ],

    // Scrub potentially sensitive URL params before they leave the client.
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          u.searchParams.delete("token");
          u.searchParams.delete("access_token");
          u.searchParams.delete("refresh_token");
          event.request.url = u.toString();
        } catch {
          // URL parse failed, leave as-is
        }
      }
      return event;
    },
  });
}
