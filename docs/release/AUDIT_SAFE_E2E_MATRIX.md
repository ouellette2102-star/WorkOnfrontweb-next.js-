# WorkOn Audit-Safe E2E Matrix

Status for P1-9 release-readiness proof.

## Runnable Safe Suite

Command:

```bash
BASE_URL=https://workonapp.vercel.app \
API_BASE=https://workon-backend-production-8908.up.railway.app/api/v1 \
npm run test:e2e:audit-safe
```

The suite creates `audit-e2e-*` users with `acceptTerms: true`, exercises real UI actions, verifies backend reads, and cleans up the audit accounts through `DELETE /api/v1/auth/account`.

When `BASE_URL` is `localhost` or `127.0.0.1`, the suite installs a Playwright transport bridge for browser-origin CORS only. It still sends real requests to `API_BASE` and does not mock backend data or responses.

For Vercel preview deployments whose branch alias is not present in backend CORS allowlists, set `BRIDGE_BACKEND_CORS=true` to install the same transport bridge explicitly. Use this only to validate preview branch UI against the real backend; production release proof must still run without the bridge on `https://workonapp.vercel.app`.

## Covered Chains

| Flow | Proof |
| --- | --- |
| Auth + consent | Frontend proxy registration returns tokens; backend `/compliance/status` is complete. |
| Client mission creation | UI `/missions/new` submits `POST /missions-local`; backend read returns the created mission; UI detail page renders it. |
| Worker mission status | Audit worker accepts by API setup, then UI starts the mission via `POST /missions-local/:id/start`; backend read returns `in_progress`. |
| Mission chat | UI sends a message through `POST /messages-local`; backend thread read contains it; worker and client UI both render it. |

## Sensitive Or Gated Chains

| Flow | Gate |
| --- | --- |
| Stripe subscription checkout | Test-mode Stripe credential required. Do not run against prod live keys. |
| Boost payment setup | Test-mode Stripe credential required. Do not create live PaymentIntents in audit. |
| Offer lifecycle | Worker offer creation is gated by verified identity and Stripe payout readiness. Requires an explicit audit fixture or admin-approved test user. |
| Admin verify-express queue | Requires explicit admin fixture/token. Do not seed or approve admin review records without separate confirmation. |
