# WorkOn — État actuel et prochaines étapes

> Cette fiche reflète **l'état réel du frontend Next.js**.
> Elle remplace une version antérieure qui décrivait un stack abandonné
> (Clerk + Mapbox + Inngest + UploadThing-only). À jour 2026-04-29.

## Stack effectif

| Domaine | Choix | Notes |
|---|---|---|
| Framework | **Next.js 16** (Turbopack, app router) | React 19.2, TypeScript 5 |
| Auth | **JWT natif via backend NestJS** | Clerk a été désactivé puis retiré du module backend (PR #278) |
| Carte | **Leaflet + react-leaflet** | OpenStreetMap tiles, pas de Mapbox |
| Données | **TanStack Query** + `lib/api-client.ts` | Backend Railway `workon-backend-production-8908` |
| Paiements | **Stripe Connect Express** + Subscriptions + Boosts | clés Live actives |
| Upload | **UploadThing** + `lib/upload-thing` | photo profile + portfolio |
| Email | **Resend** (transactionnels frontend) + SendGrid côté backend | reset password = backend SendGrid |
| Push | **Firebase FCM** côté backend (creds à set en prod) | non câblé service-worker frontend pour l'instant |
| Real-time | **Socket.IO client** (`socket.io-client`) | chat mission live, fallback polling |
| State | React Context (`auth-context`, `mode-context`) | pas de Redux, pas de Zustand |
| Tests | **Playwright** (E2E) + **Vitest** (unit) | suites partielles, à étendre |
| Monitoring | Sentry (`@sentry/nextjs`) | DSN injecté en build Vercel |
| Analytics | non-décidé | PostHog pressenti, pas câblé |

## Ce qui est implémenté côté frontend

- Auth complet : `/register`, `/login`, `/forgot-password`, `/reset-password`, cookies httpOnly + localStorage
- Onboarding : `/onboarding/role`, `/details`, `/employer`, `/success`
- Découverte : `/swipe`, `/map`, `/missions`, `/pros` (à refondre — voir backlog QA)
- Mission lifecycle : `/missions/new`, `/missions/[id]`, `/missions/mine`
- Réservation : `/reserve/[workerId]` avec Stripe Checkout
- Paiements : `/payments/success`, `/payments/cancel`, `/invoices/[id]/review` (acceptation bilatérale)
- Chat : `/messages`, `/messages/[missionId]` (Socket.IO + polling fallback)
- Premium : `/settings/subscription` avec 3 plans + 3 boosts
- Compliance : `/legal/privacy` (Loi 25 v2.0), `/legal/terms`, `/legal/conformite-loi-25`
- Admin : `/admin` (gating role=admin)

## Backlog QA actif (Sprint 1-2-3)

Voir le rapport QA dans `C:/Users/ouell/.claude-server-commander/workon_extract/`
et la checklist exécutable dans la PR `qa-sprint-1`.

Sprint 1 (en cours) — fondations : encodage UTF-8, cleanup repo, DataLoader,
copy mode-aware, format-date helpers, backend timingSafeEqual, durations CSS,
migration middleware → proxy, next-intl.

Sprint 2 — bugs critiques : `/map` Leaflet crash, backend `GET /pros` +
`/pros/{slug}`, refonte UI `/pros` (vraie liste browsable), `/swipe` =
découverte de pros, `/map` = pins de missions, `/home` role-aware,
`POST /boosts/checkout`, `/api/og` dynamique.

Sprint 3 — polish : Trust Badge visible, profile édition, `/express`
branding "Numéro Rouge", catégories normalisées, FAQ enrichie, tests E2E.

## Variables d'environnement requises

Voir `.env.example` à la racine. Les vars critiques en prod :
- `NEXT_PUBLIC_API_URL` (Vercel) → backend Railway `/api/v1`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Vercel) → Stripe Live
- `NEXT_PUBLIC_SENTRY_DSN` (Vercel build) → Sentry projet WorkOn
- 6× Firebase publishable keys (Vercel) → projet `workonv1`
- `UPLOADTHING_TOKEN` (Vercel) → UploadThing app

Côté backend Railway : `SENDGRID_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`,
`STRIPE_SECRET_KEY`, `JWT_SECRET`, `ADMIN_SECRET`, `DATABASE_URL`.

## Liens utiles

- [Next.js 16 docs](https://nextjs.org/docs)
- [Stripe Connect Express](https://stripe.com/docs/connect/express-accounts)
- [Loi 25 — CAI Québec](https://www.cai.gouv.qc.ca/)
- [Tailwind v4](https://tailwindcss.com/docs)
