import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // React strict mode for better development warnings
  reactStrictMode: true,

  // Pin Turbopack workspace root to this directory. Without this,
  // Next 16 walks up looking for a `package.json` and may pick up
  // a residual one in the user's home (e.g. `C:\Users\ouell\package.json`
  // with stray Prisma deps), then fails to resolve `tailwindcss` because
  // it's looking in the wrong node_modules tree. Pinning the root makes
  // the build robust against any unrelated package.json above us.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Hide X-Powered-By header for security
  poweredByHeader: false,

  // Logging configuration (verbose in dev only)
  logging: {
    fetches: {
      fullUrl: !isProd,
    },
  },

  // Permanent aliases for legacy / conventional URL paths so external links
  // (emails, old marketing copy, SEO inbound) don't hit a 404.
  async redirects() {
    return [
      { source: "/signin", destination: "/login", permanent: true },
      { source: "/sign-in", destination: "/login", permanent: true },
      { source: "/signup", destination: "/register", permanent: true },
      { source: "/sign-up", destination: "/register", permanent: true },
      { source: "/logout", destination: "/", permanent: false },
      { source: "/help", destination: "/faq", permanent: true },
      { source: "/contact", destination: "/about#contact", permanent: true },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS header only in production
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

// Sentry wraps the final config. When SENTRY_DSN is not set, the
// runtime stays dormant (see sentry.*.config.ts) but the build plugin
// still runs harmlessly. When SENTRY_AUTH_TOKEN is set on Vercel the
// plugin uploads source maps and creates a release automatically.
const sentryBuildOptions = {
  // Silence the SDK telemetry in CI logs.
  silent: !process.env.CI,

  // Only upload source maps when we actually have an auth token; local
  // `npm run build` on a developer laptop should not try to upload.
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Don't fail the build on source-map upload errors — networking
  // hiccups between Vercel and Sentry must not block a deploy.
  errorHandler: (err: unknown) => {
    // eslint-disable-next-line no-console
    console.warn("[sentry] source-map upload failed (non-fatal):", err);
  },

  // Route browser Sentry requests through a Next.js rewrite so
  // adblockers don't block them.
  tunnelRoute: "/monitoring",

  // Hide source maps from production browser bundles.
  hideSourceMaps: true,

  // Tree-shake Sentry debug helpers from the prod bundle.
  // (replaces the deprecated `disableLogger: true` option from
  // @sentry/nextjs ≥ 9.x — same effect, recommended config.)
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
};

export default withSentryConfig(nextConfig, sentryBuildOptions);
