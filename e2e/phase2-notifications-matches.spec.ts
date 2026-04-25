/**
 * E2E proof for Phase 2 — Notifications & Matchs (#7 #8 #9).
 *
 * Three things must hold for a notification/badge to be trustworthy:
 *   - Badge > 0 → click leads to a real, visible item.
 *   - Item viewed → badge drops.
 *   - Notification deep-link → destination object exists.
 *
 * Flow:
 *   1. Create two fresh accounts (worker A, employer B) via /api/v1/auth/register.
 *   2. A LIKEs B; B LIKEs A → mutual match.
 *   3. As A: GET /notifications/unread-count?type=swipe_match → expect ≥ 1.
 *      Open /swipe → assert "Matchs [N]" badge with N ≥ 1.
 *   4. Click the badge → /matches.
 *   5. Assert at least one match card with B's first name (NOT
 *      "Aucun match" — bug #8 fix).
 *   6. After 1s, GET /notifications/unread-count?type=swipe_match → expect 0
 *      (bug #9 fix: /matches mount calls read-all by type).
 *   7. /swipe page badge no longer shows the count (re-poll).
 *
 * #7 contracts cannot be exercised here without an existing local
 * contract (mission acceptance flow). The bug is covered at the
 * service level by the access-check unit tests in workon-backend#297;
 * see the rapport for the curl-based proof. Flagged as residual risk
 * to add a full E2E once the mission acceptance path is automated.
 *
 * Run:
 *   BASE_URL=https://workonapp.vercel.app \
 *     npx playwright test --config=playwright.phase2.config.ts
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_BASE =
  process.env.API_BASE ??
  "https://workon-backend-production-8908.up.railway.app/api/v1";

test.setTimeout(60_000);

async function registerWorker(
  page: import("@playwright/test").Page,
  role: "worker" | "employer",
) {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const email = `phase2-${role}-${ts}@workon.test`;
  const password = "Test1234!";
  const res = await page.request.post(`${API_BASE}/auth/register`, {
    data: {
      email,
      password,
      firstName: `Phase2${role[0].toUpperCase()}`,
      lastName: role === "worker" ? "Pro" : "Client",
      role,
    },
  });
  expect(res.status(), `register ${role}`).toBeLessThan(300);
  const body = await res.json();
  return {
    email,
    password,
    token: body.accessToken as string,
    id: body.user.id as string,
  };
}

async function recordSwipe(
  page: import("@playwright/test").Page,
  token: string,
  candidateId: string,
) {
  const res = await page.request.post(`${API_BASE}/swipe/action`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { candidateId, action: "LIKE" },
  });
  return res.json();
}

test.describe("Phase 2 — notifications & matchs end-to-end", () => {
  test("mutual match → badge → /matches → badge clears (#8 #9)", async ({
    page,
  }) => {
    // ── 1. Two fresh accounts ───────────────────────────────
    const A = await registerWorker(page, "worker");
    const B = await registerWorker(page, "employer");

    // ── 2. Mutual LIKE → match ──────────────────────────────
    const a2b = await recordSwipe(page, A.token, B.id);
    expect(a2b.matched).toBe(false);
    const b2a = await recordSwipe(page, B.token, A.id);
    expect(b2a.matched, "second LIKE must produce a match").toBe(true);
    expect(b2a.matchId).toBeTruthy();

    // ── 3. As A: badge unread count via API (BE truth) ──────
    const unreadRes = await page.request.get(
      `${API_BASE}/notifications/unread-count?type=swipe_match`,
      { headers: { Authorization: `Bearer ${A.token}` } },
    );
    expect(unreadRes.ok()).toBe(true);
    const unreadBefore = (await unreadRes.json()).count;
    expect(
      unreadBefore,
      "A must have ≥ 1 unread swipe_match after a fresh mutual like",
    ).toBeGreaterThanOrEqual(1);

    // ── 4. Log in as A in the browser, navigate to /swipe ──
    await page.goto(`${BASE_URL}/`);
    const login = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: A.email, password: A.password },
    });
    expect(login.status(), "FE proxy login").toBe(200);
    const lb = await login.json();
    await page.evaluate(
      ({ token, refresh, user }) => {
        localStorage.setItem("workon_access_token", token);
        if (refresh) localStorage.setItem("workon_refresh_token", refresh);
        if (user) localStorage.setItem("workon_user", JSON.stringify(user));
      },
      { token: lb.accessToken, refresh: lb.refreshToken, user: lb.user },
    );

    await page.goto(`${BASE_URL}/swipe`, { waitUntil: "domcontentloaded" });
    // The "Matchs" pill is always visible; the red bubble appears only
    // when the typed unread count is > 0. Wait up to 15s for the badge
    // to materialize (React Query polls every 20s; first paint is sync).
    const matchPill = page.getByRole("link", { name: /Matchs/ });
    await expect(matchPill).toBeVisible({ timeout: 10_000 });
    // Bubble = a span containing the digit, child of the link.
    const bubble = matchPill.locator("span").last();
    await expect(bubble).toBeVisible({ timeout: 15_000 });
    await expect(bubble).toContainText(/\d/);

    // ── 5. Click → /matches → real card visible ────────────
    await matchPill.click();
    await page.waitForURL(/\/matches$/, { timeout: 10_000 });
    // Bug #8 fix: B's first name appears as a card. Old code rendered
    // "Aucun match pour le moment" because the case-mismatched filter
    // dropped every row.
    await expect(page.getByText(/^Phase2E/)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Aucun match pour le moment/ }),
    ).toHaveCount(0);

    // ── 6. Badge cleared on backend after /matches mount ────
    // Give the read-all mutation 2s to land.
    await page.waitForTimeout(2_000);
    const unreadAfter = await page.request
      .get(`${API_BASE}/notifications/unread-count?type=swipe_match`, {
        headers: { Authorization: `Bearer ${A.token}` },
      })
      .then((r) => r.json());
    expect(
      unreadAfter.count,
      "swipe_match unread should be 0 after /matches mounted (#9)",
    ).toBe(0);

    // ── 7. /swipe badge bubble no longer renders ───────────
    await page.goto(`${BASE_URL}/swipe`, { waitUntil: "domcontentloaded" });
    const matchPill2 = page.getByRole("link", { name: /Matchs/ });
    await expect(matchPill2).toBeVisible({ timeout: 10_000 });
    // Bubble should be hidden — the link should now have no child <span>
    // containing a digit. Allow up to 5s for the React Query refetch.
    await expect
      .poll(
        async () =>
          await matchPill2
            .locator("span")
            .filter({ hasText: /^\d+$/ })
            .count(),
        { timeout: 8_000 },
      )
      .toBe(0);
  });
});
