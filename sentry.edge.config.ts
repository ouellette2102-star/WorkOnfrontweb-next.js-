/**
 * Sentry edge-runtime initialization.
 *
 * Catches errors thrown inside middleware and edge route handlers.
 * Mirrors `sentry.server.config.ts` but runs in the edge runtime
 * (smaller API surface — no Node builtins).
 */

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,

    tracesSampleRate: Number(
      process.env.SENTRY_TRACES_SAMPLE_RATE ??
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
        "0.05",
    ),

    release: process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    environment:
      process.env.VERCEL_ENV ??
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",

    ignoreErrors: [
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
    ],
  });
}
