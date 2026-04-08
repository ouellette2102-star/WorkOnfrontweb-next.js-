# archive/

Code preserved for reference but excluded from the build.

This directory holds code that is no longer used by the application but is
intentionally kept in version control "just in case" — so we can grep it,
copy patterns out of it, or revive it if a feature comes back.

## Rules

- Nothing in `archive/` is compiled, type-checked, linted, or shipped.
- Nothing in `src/` may import from `archive/`. If you need a file, restore
  it back into `src/` via `git mv` so the build picks it up.
- `tsconfig.json` `include` is `src/**/*` so this directory is naturally
  excluded from type-checking.
- `.vercelignore` excludes this directory from Vercel deploys.

## Contents

### `legacy/`

Moved here on 2026-04-08 as part of the canonical consolidation
(`chore/dead-code-removal`, PR 1 of the migration described in
`MIGRATION_URL_MAP.md`).

- `legacy/api/` — original API client files (missions-api, notifications-api,
  stripe-api, workon-api). The active shims live in `src/lib/*-api.ts` and
  re-export from `src/lib/api-client.ts`. These archived originals show the
  pre-consolidation shape and may be useful when consolidating shims into
  `api-client.ts` (PR 2 of the migration).
- `legacy/clerk/` — Clerk-based authentication code from before the JWT
  migration (`auth-helpers-clerk`, `get-profile-clerk`, `sign-in-page`,
  `auth-global-bar`, `clerk.config`). Useful as a reference if Clerk ever
  comes back.

## Restoring an archived file

```sh
git mv archive/legacy/some-file.ts src/lib/some-file.ts
```

This restores both the file and its git history at the new location.
