# Backend pipeline contract

> **One-page reference. The full rationale lives in `MIGRATION_URL_MAP.md`
> under "Backend pipeline contract — `*-local` is canonical".**

## Rule

This frontend (`workonapp/`, the WorkOn Next.js web app and its future
Capacitor mobile wrap) calls the **`*-local` API pipeline only**.

| Domain    | ✅ Use                              | ❌ Do not use                  |
|-----------|-------------------------------------|--------------------------------|
| Missions  | `/api/v1/missions-local/*`          | `/api/v1/missions/*`           |
| Messages  | `/api/v1/messages-local/*`          | `/api/v1/messages/*`           |
| Payments  | `/api/v1/payments-local/*`          | `/api/v1/payments/*`           |
| Auth      | `/api/v1/auth/*` (single pipeline)  | —                              |
| Profile   | `/api/v1/users/me`, `/api/v1/profile/me` (shared) | — |
| Stripe Connect | `/api/v1/payments/connect/*` (permanent exception) | — |

## Why

Not for cleanliness. For product capability:

- **Map view** (`/missions-local/map`, `/missions-local/nearby`) —
  not exposed by the Clerk-era controller. No `*-local`, no map.
- **Granular mission lifecycle** (`accept`, `start`, `complete`,
  `cancel`) — only on `*-local`.
- **Trust score, swipe→mission, recurring missions** — recent backend
  features built against `LocalUser` / `LocalMission`.
- **Capacitor mobile wrap** — same JWT custom auth + same `*-local`
  endpoints means web and mobile ship from one codebase.
- **GHL marketing webhooks** — feed `LocalUser` accounts directly.

If a feature you want to add is not on `*-local`, the action is to
**ask the backend to add it**, not to call the Clerk-era pipeline.

## How it is enforced in code

`src/lib/api-client.ts` — every canonical method targets `*-local`. The
Clerk-era endpoints are isolated under the `api.legacy.*` namespace and
explicitly labeled. New code never imports from `api.legacy`.

`src/lib/missions-api.ts` — deprecated shim. Currently still alive
because 10 files in the legacy route universe (`src/app/missions/*`,
`src/app/worker/*`) import it. **Do not import from this file in any
new code.** It will be deleted in PR 9 (Phase 8 of the route group
migration), at the same time as its last callers.

## Exceptions

- **Stripe Connect** (`/payments/connect/*`) — permanent. Stripe is
  account-level, not user-pipeline-level. There will be no `*-local`
  version.
- **`/payments/worker/history`** — temporary. The local equivalent
  doesn't ship yet on the backend. To be migrated when it does.
- **`/missions/:id/events`** — temporary. Same reason.

## Source of truth

The backend's `WorkOn Product Canon v2.0` (in the backend repo at
`docs/product/WORKON_PRODUCT_CANON.md`, introduced via backend PR #173)
declares the dual-system architecture as intentional. Any change to this
frontend contract must first be negotiated against that document. The
frontend cannot unilaterally change the pipeline contract.

## When this contract changes

When (if) the backend converges `User` and `LocalUser` into a single
model, this document gets a new "Convergence" section explaining the
new pipeline. Until then, the rule above is the law for this repo.
