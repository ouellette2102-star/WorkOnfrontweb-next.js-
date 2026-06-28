/**
 * Canonical site origin — single source of truth for everything SEO
 * (canonical URLs, Open Graph, sitemap, robots).
 *
 * The brand domain workonapp.ca is live on Vercel and the apex redirects
 * to www, so `www.workonapp.ca` is the canonical host. Three stale domains
 * used to be hard-coded across the app — `workon.app` (never owned),
 * `workon.ca` (wrong) and the bare Vercel origin — which pointed canonical
 * tags at domains we don't control. Everything now derives from here.
 *
 * Override per-environment with NEXT_PUBLIC_SITE_URL (e.g. a preview origin)
 * — trailing slash stripped so `${SITE_URL}/path` is always well-formed.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workonapp.ca"
).replace(/\/+$/, "");
