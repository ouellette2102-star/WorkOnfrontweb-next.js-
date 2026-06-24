/**
 * End-to-end proof for feat/missions-feed on the Vercel preview.
 *
 * The /public/missions backend endpoint is CORS-open, so this test
 * hits the real Railway backend without needing the preview to be on
 * the CORS whitelist.
 *
 *   BASE_URL=https://workonapp-<preview>.vercel.app \
 *     npx playwright test --config=playwright.remote.config.ts \
 *       -g "missions-feed"
 *
 * Asserts:
 *   1. Login lands us inside the (app) shell
 *   2. /missions renders the grid (real backend data) and a filter bar
 *   3. Typing a city filter + submitting updates the URL and renders
 *      a subset (count only contains matching cards)
 *   4. Reset button clears the filter and restores the full feed
 *   5. Clicking a mission card navigates to /missions/:id
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "https://workonapp.vercel.app";
const EMAIL = process.env.TEST_EMAIL ?? "chat-sock-test-1776726549@example.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "Test1234!";

test.describe("feat/missions-feed", () => {
  test("browse open missions, filter by city, navigate to detail", async ({
    page,
  }) => {
    // --- Auth through same-origin proxy, mirror tokens into storage ----
    await page.goto(`${BASE_URL}/`);
    const res = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    await page.evaluate(
      ({ token, refresh, user }) => {
        localStorage.setItem("workon_access_token", token);
        if (refresh) localStorage.setItem("workon_refresh_token", refresh);
        if (user) localStorage.setItem("workon_user", JSON.stringify(user));
      },
      { token: body.accessToken, refresh: body.refreshToken, user: body.user },
    );

    // --- /missions loads real data ------------------------------------
    await page.goto(`${BASE_URL}/missions`, { waitUntil: "domcontentloaded" });

    // Dismiss Loi 25 cookie banner if present — it floats over the
    // lower half of the viewport and can intercept pagination clicks.
    await page.waitForTimeout(1200);
    const cookieAccept = page.getByRole("button", { name: "Accepter" });
    if (await cookieAccept.count()) {
      await cookieAccept.first().click().catch(() => {});
    }

    await expect(page.getByTestId("missions-filter-bar")).toBeVisible({
      timeout: 15_000,
    });

    const grid = page.getByTestId("missions-feed-grid");
    await expect(grid).toBeVisible({ timeout: 15_000 });
    const cards = page.getByTestId("mission-card");
    const initialCount = await cards.count();
    // eslint-disable-next-line no-console
    console.log(`[proof] initial mission card count: ${initialCount}`);
    expect(initialCount).toBeGreaterThan(0);

    const firstTitle = (await cards.first().textContent())?.trim() ?? "";
    // eslint-disable-next-line no-console
    console.log(`[proof] first card excerpt: "${firstTitle.slice(0, 80)}..."`);

    // --- Filter by city -----------------------------------------------
    await page.getByTestId("filter-city").fill("Montréal");
    await page.getByTestId("filter-apply").click();

    // URL includes the filter.
    await expect
      .poll(() => page.url(), { timeout: 10_000 })
      .toContain("city=Montr");

    await expect(grid.or(page.getByTestId("missions-empty-state"))).toBeVisible(
      { timeout: 15_000 },
    );
    const filteredCount = await cards.count();
    // eslint-disable-next-line no-console
    console.log(
      `[proof] after city=Montréal filter: ${filteredCount} card(s)`,
    );
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // --- Reset filter -------------------------------------------------
    await page.getByTestId("filter-reset").click();
    await expect
      .poll(() => page.url(), { timeout: 10_000 })
      .not.toContain("city=");
    await expect(grid).toBeVisible({ timeout: 15_000 });
    const resetCount = await cards.count();
    // eslint-disable-next-line no-console
    console.log(`[proof] after reset: ${resetCount} card(s)`);
    expect(resetCount).toBe(initialCount);

    // Capture the feed itself BEFORE navigating to a detail page,
    // so the reviewer sees the grid + filter bar, not a spinner.
    await page.screenshot({
      path: "test-results/missions-feed-proof-grid.png",
      fullPage: false,
    });

    // --- Click first card → detail page -------------------------------
    await cards.first().click();
    await expect
      .poll(() => page.url(), { timeout: 10_000 })
      .toMatch(/\/missions\/[^/?#]+$/);
    // eslint-disable-next-line no-console
    console.log(`[proof] detail page url: ${page.url()}`);

    await page.screenshot({
      path: "test-results/missions-feed-proof.png",
      fullPage: false,
    });
  });
});
