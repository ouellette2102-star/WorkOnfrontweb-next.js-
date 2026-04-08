# MIGRATION URL MAP — Canonical Consolidation

**Branch:** `feature/canonical-consolidation`
**Started:** 2026-04-07
**Goal:** Consolidate two parallel route universes (top-level + `(app)/` group) into one canonical mobile-first PWA, then wrap with Capacitor for native iOS/Android.

This file tracks every URL move during the migration. Route groups in Next.js do NOT change the URL — only the file location changes. Where a URL DOES change, a 301 redirect is required in `middleware.ts`.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Already canonical, no move required |
| 🔄 | File moves, URL stays the same (route group reorg) |
| ➡️ | URL changes, requires 301 redirect |
| ❌ | URL is killed, page deleted |
| 🆕 | New URL created |

---

## Public marketing routes → `(public)/`

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/page.tsx` | `src/app/(public)/page.tsx` | `/` → `/` | 🔄 |
| `src/app/pros/page.tsx` | `src/app/(public)/pros/page.tsx` | `/pros` → `/pros` | 🔄 |
| `src/app/employeurs/page.tsx` | `src/app/(public)/employeurs/page.tsx` | `/employeurs` → `/employeurs` | 🔄 |
| `src/app/pricing/page.tsx` | `src/app/(public)/pricing/page.tsx` | `/pricing` → `/pricing` | 🔄 |
| `src/app/faq/page.tsx` | `src/app/(public)/faq/page.tsx` | `/faq` → `/faq` | 🔄 |
| `src/app/legal/privacy/page.tsx` | `src/app/(public)/legal/privacy/page.tsx` | `/legal/privacy` → same | 🔄 |
| `src/app/legal/terms/page.tsx` | `src/app/(public)/legal/terms/page.tsx` | `/legal/terms` → same | 🔄 |
| `src/app/pro/[slug]/page.tsx` | `src/app/(public)/pro/[slug]/page.tsx` | `/pro/[slug]` → same | 🔄 |
| `src/app/p/[slug]/page.tsx` | `src/app/(public)/p/[slug]/page.tsx` | `/p/[slug]` → same | 🔄 |
| `src/app/missions/page.tsx` (public listing 321 lines) | `src/app/(public)/missions/page.tsx` | `/missions` → same | 🔄 |

**Layout:** new `src/app/(public)/layout.tsx` with header (logo + UserNav) + footer. No BottomNav.

---

## Auth routes → `(auth)/`

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/login/page.tsx` | `src/app/(auth)/login/page.tsx` | `/login` → same | 🔄 |
| `src/app/register/page.tsx` | `src/app/(auth)/register/page.tsx` | `/register` → same | 🔄 |
| `src/app/forgot-password/page.tsx` | `src/app/(auth)/forgot-password/page.tsx` | `/forgot-password` → same | 🔄 |

**Layout:** new `src/app/(auth)/layout.tsx` with centered card. No header, no nav.

**DELETED:**
- `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` (Clerk legacy, 9 lines) ❌
- `src/app/sign-up/[[...sign-up]]/page.tsx` (Clerk legacy, 24 lines) ❌
- `src/app/setup/page.tsx` (orphan welcome page) ❌

---

## Onboarding routes → `(onboarding)/`

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/onboarding/page.tsx` | merged into `(onboarding)/role/page.tsx` | `/onboarding` → `/onboarding/role` | ➡️ + 301 |
| `src/app/onboarding/role/page.tsx` | `src/app/(onboarding)/role/page.tsx` | `/onboarding/role` → same | 🔄 |
| `src/app/onboarding/details/page.tsx` | `src/app/(onboarding)/details/page.tsx` | `/onboarding/details` → same | 🔄 |
| `src/app/onboarding/success/page.tsx` | `src/app/(onboarding)/success/page.tsx` | `/onboarding/success` → same | 🔄 |

**Layout:** new `src/app/(onboarding)/layout.tsx` (full-screen, progress bar, no BottomNav).

---

## App routes → `(app)/` (the canonical mobile shell)

### Splash & home

| Current path | New path | URL change | Status |
|---|---|---|---|
| (none) | `src/app/(app)/page.tsx` (splash, redirects to /home) | `/` (in app context) → `/home` | 🆕 |
| `src/app/(app)/home/page.tsx` (130 lines, role-aware) | unchanged | `/home` → same | ✅ |
| `src/app/dashboard/page.tsx` (38 lines, near-empty) | DELETED | `/dashboard` → `/home` | ➡️ + 301 |
| `src/app/worker/dashboard/page.tsx` | widgets ported into `(app)/home`, page deleted | `/worker/dashboard` → `/home` | ➡️ + 301 |
| `src/app/employer/dashboard/page.tsx` | widgets ported into `(app)/home`, page deleted | `/employer/dashboard` → `/home` | ➡️ + 301 |

### Missions (unified under "Mes demandes" — Decision 3)

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/(app)/bookings/page.tsx` | `src/app/(app)/missions/page.tsx?tab=bookings` | URL becomes a tab parameter | ➡️ + 301 |
| `src/app/(app)/offers/page.tsx` | `src/app/(app)/missions/page.tsx?tab=offers` | URL becomes a tab parameter | ➡️ + 301 |
| `src/app/(app)/contracts/page.tsx` | `src/app/(app)/missions/page.tsx?tab=contracts` | URL becomes a tab parameter | ➡️ + 301 |
| `src/app/missions/mine/page.tsx` | merged into `(app)/missions/page.tsx?tab=mine` | URL becomes a tab parameter | ➡️ + 301 |
| `src/app/missions/available/page.tsx` | merged into `(app)/missions/page.tsx?tab=available` | URL becomes a tab parameter | ➡️ + 301 |
| `src/app/worker/missions/page.tsx` (list/swipe/map toggle) | `src/app/(app)/missions/feed/page.tsx` | `/worker/missions` → `/missions/feed` | ➡️ + 301 |
| `src/app/missions/new/page.tsx` | `src/app/(app)/missions/new/page.tsx` | `/missions/new` → same | 🔄 |
| `src/app/missions/[id]/page.tsx` | `src/app/(app)/missions/[id]/page.tsx` | `/missions/[id]` → same | 🔄 |
| `src/app/missions/[id]/pay/page.tsx` | `src/app/(app)/missions/[id]/pay/page.tsx` | same | 🔄 |
| `src/app/missions/[id]/photos/page.tsx` | `src/app/(app)/missions/[id]/photos/page.tsx` | same | 🔄 |
| `src/app/missions/[id]/time/page.tsx` | `src/app/(app)/missions/[id]/time/page.tsx` | same | 🔄 |
| `src/app/missions/[id]/dispute/page.tsx` | `src/app/(app)/missions/[id]/dispute/page.tsx` | same | 🔄 |
| `src/app/missions/[id]/chat/page.tsx` | `src/app/(app)/messages/[missionId]/page.tsx` | `/missions/[id]/chat` → `/messages/[id]` | ➡️ + 301 |

### Map / Search / Discover

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/map/page.tsx` (Leaflet, geoloc, nearby) | `src/app/(app)/map/page.tsx` | `/map` → same | 🔄 |
| `src/app/(app)/search/page.tsx` (workers + missions tabs) | unchanged | `/search` → same | ✅ |
| `src/app/(app)/employer/discover/page.tsx` (swipe candidates) | unchanged | same | ✅ |
| `src/app/(app)/employer/matches/page.tsx` | unchanged | same | ✅ |

### Messages (unified — Decision 2: no BottomNav tab)

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/messages/page.tsx` | `src/app/(app)/messages/page.tsx` | `/messages` → same | 🔄 |
| `src/app/missions/[id]/chat/page.tsx` | merged into `(app)/messages/[missionId]/page.tsx` | `/missions/[id]/chat` → `/messages/[id]` | ➡️ + 301 |
| `src/app/api/missions/[id]/messages/route.ts` (proxy) | DELETED — api-client hits backend directly | n/a | ❌ |

### Profile & settings

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/profile/page.tsx` (own profile editor SSR) | `src/app/(app)/profile/page.tsx` | `/profile` → same | 🔄 |
| `src/app/profile/[id]/page.tsx` (public profile via UUID) | DELETED, consolidated into `(public)/pro/[slug]` | `/profile/[id]` → `/pro/[slug]` | ➡️ + 301 (lookup) |
| `src/app/(app)/profile/verify/page.tsx` | unchanged | `/profile/verify` → same | ✅ |
| (none) | `src/app/(app)/settings/page.tsx` | `/settings` | 🆕 |

### Payments / earnings / Stripe

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/worker/payments/page.tsx` | `src/app/(app)/payments/page.tsx` | `/worker/payments` → `/payments` | ➡️ + 301 |
| `src/app/worker/payments/onboarding/return/page.tsx` | `src/app/(app)/payments/onboarding/return/page.tsx` | URL changes | ➡️ + 301 |
| `src/app/(app)/invoices/page.tsx` | unchanged | `/invoices` → same | ✅ |
| `src/app/(app)/payments/page.tsx` (if exists already) | merged with worker/payments | same | 🔄 |

### Notifications, support, disputes

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/notifications/page.tsx` | `src/app/(app)/notifications/page.tsx` | `/notifications` → same | 🔄 |
| `src/app/(app)/support/page.tsx` | unchanged | `/support` → same | ✅ |
| `src/app/(app)/disputes/page.tsx` | unchanged | `/disputes` → same | ✅ |

### Worker-specific

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/worker/page.tsx` | DELETED (redundant with /home) | `/worker` → `/home` | ➡️ + 301 |
| `src/app/worker/layout.tsx` | DELETED (Sidebar redundant) | n/a | ❌ |
| `src/app/(app)/worker/[id]/page.tsx` | unchanged | `/worker/[id]` → same | ✅ |
| `src/app/(app)/worker/availability/page.tsx` | unchanged | same | ✅ |
| `src/app/(app)/worker/templates/page.tsx` | unchanged | same | ✅ |

### Employer-specific

| Current path | New path | URL change | Status |
|---|---|---|---|
| `src/app/employer/page.tsx` | DELETED (redundant with /home) | `/employer` → `/home` | ➡️ + 301 |
| `src/app/employer/layout.tsx` | DELETED (Sidebar redundant) | n/a | ❌ |
| `src/app/(app)/reserve/[workerId]/page.tsx` | unchanged | same | ✅ |

### Dead routes

| Current path | Action | Status |
|---|---|---|
| `src/app/feed/page.tsx` (371 lines, mock data) | DELETED — half-built feature | ❌ |
| `src/app/setup/page.tsx` | DELETED — orphan | ❌ |
| `src/app/(auth)/sign-in/[[...sign-in]]/` | DELETED — Clerk legacy | ❌ |
| `src/app/sign-up/[[...sign-up]]/` | DELETED — Clerk legacy | ❌ |
| `src/app/dashboard/layout.tsx` | DELETED — Sidebar legacy | ❌ |
| `src/app/profile/layout.tsx` | DELETED — Sidebar legacy | ❌ |

---

## API routes (Next.js proxies — kept)

| Path | Status |
|---|---|
| `src/app/api/auth/{login,logout,me,refresh,register}/route.ts` | ✅ Kept (needed for httpOnly cookie setting) |
| `src/app/api/feed/route.ts` + `feed/like/route.ts` | ❌ Will be deleted with /feed |
| `src/app/api/health/route.ts` | ✅ Kept |
| `src/app/api/payments/create-intent/route.ts` | ✅ Kept |
| `src/app/api/reviews/route.ts` | ✅ Kept |
| `src/app/api/missions/[id]/messages/route.ts` | ❌ Deleted, api-client calls backend directly |

---

## Components consolidation

### MissionCard (3 → 1)

| Current | Action |
|---|---|
| `src/components/mission/mission-card.tsx` | ✅ KEPT — canonical, typed against MissionResponse |
| `src/components/missions/mission-card.tsx` | ❌ DELETED after porting status colors + category icons |
| `src/components/mission-card.tsx` (root orphan) | ❌ DELETED |
| `src/app/missions/page.tsx:39` (inline `MissionCard`) | ❌ DELETED, replaced by import |

### Navigation (Sidebar/BottomNav cleanup)

| Current | Action |
|---|---|
| `src/components/navigation/bottom-nav.tsx` | ✅ KEPT, will be refactored to 4 tabs (Decision 2) |
| `src/components/navigation/sidebar.tsx` | ❌ DELETED (Univers A nav, replaced by BottomNav) |
| `src/components/navigation/user-nav.tsx` | ✅ KEPT for `(public)/` header |
| `src/components/nav-bottom.tsx` (root orphan) | ❌ DELETED |
| `src/components/red-phone-button.tsx` (root orphan) | ❌ DELETED after porting into BottomNav center FAB |

### Profile components

| Current | Action |
|---|---|
| `src/components/profile-header.tsx` (root) | 🔄 MOVED to `src/components/profile/profile-header.tsx` |
| `src/components/portfolio-post.tsx` (root) | 🔄 MOVED to `src/components/profile/portfolio-post.tsx` |
| `src/components/profile/profile-form.tsx` | ✅ KEPT |
| `src/components/profile/profile-roles-card.tsx` | ✅ KEPT |

### Other root orphans

| Current | Action |
|---|---|
| `src/components/carousel-row.tsx` | ❌ DELETED — never imported |
| `src/components/worker-card.tsx` (root) | ❌ DELETED — root orphan, real one is `worker/worker-card.tsx` |
| `src/components/stats-bar.tsx` | ✅ KEPT — used by `(app)/home`, will align labels with Flutter spec |
| `src/components/auth-global-bar.tsx` | ❌ DELETED — Clerk-bound |
| `src/components/consent-modal.tsx`, `consent-provider.tsx` | ⚠️ Audit pending — may be Clerk-bound |

### Messaging (chat vs messages)

| Current | Action |
|---|---|
| `src/components/chat/mission-chat.tsx` | ✅ KEPT — canonical chat UI |
| `src/components/chat/{message-bubble,message-input,message-list}.tsx` | ✅ KEPT |
| `src/components/messages/conversation-list.tsx` | ✅ KEPT, used by `(app)/messages/page.tsx` |
| `src/components/messages/conversation-thread.tsx` | ❌ DELETED, replaced by `chat/mission-chat.tsx` |

---

## API client consolidation

| Current | Action |
|---|---|
| `src/lib/api-client.ts` (566 lines, 43 methods) | ✅ CANONICAL |
| `src/lib/missions-api.ts` (68 lines, marked DEPRECATED, shim) | ❌ DELETED after callers migrated |
| `src/lib/notifications-api.ts` (34 lines) | ❌ DELETED after callers migrated |
| `src/lib/stripe-api.ts` (32 lines) | ❌ DELETED after callers migrated |
| `src/lib/workon-api.ts` (41 lines) | ❌ DELETED after callers migrated |
| `src/lib/mission-chat-api.ts` (139 lines, parallel to api-client) | ❌ DELETED, methods merged into api-client |
| `src/lib/mission-photos-api.ts` (105 lines) | ⚠️ Audit — possibly merged into api-client |
| `src/lib/mission-time-logs-api.ts` (105 lines) | ⚠️ Audit — possibly merged |
| `src/lib/compliance-api.ts` (158 lines) | ⚠️ Audit — possibly merged |
| `src/lib/premium.ts` (59 lines) | ⚠️ Audit — possibly merged |
| `src/lib/public-api.ts` (137 lines, SSR/ISR for marketing) | ✅ KEPT |
| `src/lib/auth.ts` (227 lines) | ✅ KEPT |
| `src/lib/auth-helpers.ts`, `server-auth.ts`, `get-profile.ts` | ✅ KEPT |
| `src/legacy/api/` (4 files, 505 dead lines) | ❌ DELETED |
| `src/legacy/clerk/` (5 files) | ❌ DELETED |

---

## Hooks consolidation

| Current | Action |
|---|---|
| `src/hooks/use-current-profile.ts` (direct fetch) | ❌ MERGED into use-profile.ts |
| `src/hooks/use-profile.ts` | ✅ CANONICAL after merge — calls api.getMyProfile() |
| `src/hooks/use-consent-action.ts` | ✅ KEPT |
| `src/hooks/use-mutation-lock.ts` | ✅ KEPT |
| `src/hooks/use-primary-role.ts` | ✅ KEPT |
| `src/hooks/use-status-notification.ts` | ✅ KEPT |

---

## Disk cleanup (Phase 10)

| Item | Size | Action |
|---|---|---|
| `app_backup_20260213/` (Flutter backup) | 941 MB | ❌ DELETED after Phase 8.5 (Flutter intent ported into BottomNav + Home) |
| `app/build/` (empty Flutter build) | ~0 | ❌ DELETED |
| 30+ PNG screenshots at root | ~few MB | ❌ DELETED |
| `frontend-dev.log`, `frontend-dev.err`, `ui*.xml`, `qa_mission_id.txt` | ~few MB | ❌ DELETED + .gitignore |
| `C:/Users/ouell/workon-backend/` (obsolete clone, 80 PRs behind) | several GB | ❌ DELETED after backing up unmerged audits |
| 11 Claude worktrees in `backend/.claude/worktrees/` | several GB | ❌ `git worktree remove` + `prune` |
| `backend-backup.zip` on Desktop | 210 MB | ⚠️ Verify content first |

---

## Phase tracking

- [x] Phase 0 — Preparation, baseline, this URL map
- [ ] Phase 1 — Dead code removal (Clerk legacy, sign-up, setup, legacy/, auth-global-bar)
- [ ] Phase 2 — API client consolidation (shims → api-client.ts)
- [ ] Phase 3 — Navigation unification (Sidebar deletion, BottomNav role-aware)
- [ ] Phase 4 — MissionCard consolidation (3 → 1)
- [ ] Phase 5 — Route group `(public)/`
- [ ] Phase 6 — Route group `(auth)/`
- [ ] Phase 7 — Route group `(onboarding)/`
- [ ] Phase 8 — Migrate Univers A features into `(app)/`
- [ ] Phase 8.5 — Recover Flutter UX intent (4-tab BottomNav, splash, public home, tagline, "Téléphone rouge" central FAB, "Mes demandes" unified)
- [ ] Phase 9 — Public profile canonical + 301 redirects
- [ ] Phase 10 — Repo + disk cleanup
- [ ] Phase 11 — Capacitor wrap (post-PWA polish)
