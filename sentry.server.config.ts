/**
 * Sentry server-side initialization (Node runtime).
 *
 * Catches errors thrown in RSCs, route handlers, server actions and
 * the Next.js fetch layer. Only initializes if SENTRY_DSN is set —
 * prefers the server-side env var, falls back to the public one so a
 * single Vercel env var can power both if desired.
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
