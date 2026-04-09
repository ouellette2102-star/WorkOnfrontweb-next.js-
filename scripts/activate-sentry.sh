#!/usr/bin/env bash
#
# scripts/activate-sentry.sh
#
# One-shot Sentry activation for the WorkOn frontend on Vercel.
#
# PR #94 wired @sentry/nextjs into the app with all config files
# guarded on the presence of SENTRY_DSN — zero overhead until you
# set the env var. This script flips those env vars on Vercel for
# production + preview, then redeploys so Sentry starts capturing
# events immediately.
#
# Usage:
#   SENTRY_DSN='https://xxx@o123.ingest.sentry.io/456' \
#   SENTRY_AUTH_TOKEN='sntrys_...' \
#   bash scripts/activate-sentry.sh
#
# Optional overrides:
#   SENTRY_ORG      (default: workon)
#   SENTRY_PROJECT  (default: workonapp-web)
#
# What you need from the Sentry dashboard (2 minutes of clicks):
#
#   1. Project DSN
#      https://workon.sentry.io/settings/projects/workonapp-web/keys/
#      → copy "DSN"
#      → if the project doesn't exist yet, create it first at:
#        https://workon.sentry.io/projects/new/?t=nextjs
#        (choose platform Next.js, name it `workonapp-web`)
#
#   2. Org Auth Token (for source-map upload during build)
#      https://workon.sentry.io/settings/auth-tokens/
#      → click "Create New Token"
#      → copy the shown token (starts with sntrys_...)
#      → it is only shown once — save it before closing the modal
#
# The script sets these on Vercel (production + preview scopes):
#
#   NEXT_PUBLIC_SENTRY_DSN       = $SENTRY_DSN
#   SENTRY_DSN                   = $SENTRY_DSN
#   SENTRY_AUTH_TOKEN            = $SENTRY_AUTH_TOKEN
#   SENTRY_ORG                   = $SENTRY_ORG
#   SENTRY_PROJECT               = $SENTRY_PROJECT
#
# and then runs `vercel --prod --yes` to deploy.

set -euo pipefail

# ─── Input validation ──────────────────────────────────────────────────────
if [[ -z "${SENTRY_DSN:-}" ]]; then
  echo "❌ SENTRY_DSN is required. Example:" >&2
  echo "   SENTRY_DSN='https://xxx@o123.ingest.sentry.io/456' \\" >&2
  echo "   SENTRY_AUTH_TOKEN='sntrys_...' \\" >&2
  echo "   bash scripts/activate-sentry.sh" >&2
  exit 1
fi

if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
  echo "❌ SENTRY_AUTH_TOKEN is required." >&2
  exit 1
fi

SENTRY_ORG="${SENTRY_ORG:-workon}"
SENTRY_PROJECT="${SENTRY_PROJECT:-workonapp-web}"

echo "🛰️  Activating Sentry for the WorkOn frontend"
echo "    org:     $SENTRY_ORG"
echo "    project: $SENTRY_PROJECT"
echo

# ─── Verify Vercel CLI is authenticated ────────────────────────────────────
if ! vercel whoami >/dev/null 2>&1; then
  echo "❌ Vercel CLI not authenticated. Run: vercel login" >&2
  exit 1
fi

# ─── Helper: idempotent env var set for prod + preview ─────────────────────
set_env() {
  local name="$1"
  local value="$2"

  for target in production preview; do
    # Remove existing if present (idempotent re-runs). Swallow "not found".
    printf 'y\n' | vercel env rm "$name" "$target" >/dev/null 2>&1 || true

    # Pipe the value into `vercel env add` (reads from stdin).
    printf '%s\n' "$value" | vercel env add "$name" "$target" >/dev/null
    echo "  ✅ $name ($target)"
  done
}

echo "📝 Writing env vars to Vercel (production + preview)..."
set_env "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"
set_env "SENTRY_DSN"             "$SENTRY_DSN"
set_env "SENTRY_AUTH_TOKEN"      "$SENTRY_AUTH_TOKEN"
set_env "SENTRY_ORG"             "$SENTRY_ORG"
set_env "SENTRY_PROJECT"         "$SENTRY_PROJECT"
echo

# ─── Redeploy production so the env vars take effect ───────────────────────
echo "🚀 Redeploying production with Sentry active..."
vercel --prod --yes
echo

# ─── Guidance for the final validation step ────────────────────────────────
cat <<'NEXT'
✅ Done. Next steps:

  1. Wait ~60 seconds for the deploy to go live.
  2. Open https://workonapp.vercel.app in a private window and
     navigate normally. Any client-side error should now flow
     into the Sentry dashboard.
  3. To generate a test error, open the browser devtools console
     and run:
         throw new Error("sentry test from workonapp")
     It should land in Sentry within a few seconds.
  4. Check your dashboard:
     https://workon.sentry.io/issues/

If source-map upload fails during the build (check Vercel build
logs), double-check that SENTRY_AUTH_TOKEN has `project:releases`
and `project:write` scopes. Org auth tokens from
/settings/auth-tokens/ have the right scopes by default.
NEXT
