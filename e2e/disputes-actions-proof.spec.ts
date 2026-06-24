/**
 * End-to-end proof for feat/disputes-actions on the Vercel preview.
 *
 * Runs on the branch preview URL with the backend calls intercepted
 * via page.route — the preview host is not on the backend CORS
 * whitelist (backend only trusts workonapp.vercel.app), so a real
 * cross-origin fetch from the preview will be blocked by the
 * browser and we'd never be able to prove the UI wiring. Once this
 * PR is merged to main and served from workonapp.vercel.app, the
 * same flow exercises the real backend — see the DISPUTE_ID branch
 * at the bottom of this file.
 *
 *   BASE_URL=https://workonapp-m4q2ks7uk-mathieu-ouellettes-projects.vercel.app \
 *     npx playwright test --config=playwright.remote.config.ts \
 *       -g "disputes-actions"
 *
 * Asserts:
 *   1. Login → /disputes/:id renders the detail page (not 404, not /login)
 *   2. Status badge reads "Ouvert" on load.
 *   3. "Ajouter" opens the evidence form; submitting text evidence POSTs
 *      to /disputes/:id/evidence and the new row renders in the list.
 *   4. "Marquer comme résolu" opens the resolve form; submitting PATCHes
 *      /disputes/:id/resolve and the badge transitions to RESOLVED.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "https://workonapp.vercel.app";
const EMAIL = process.env.TEST_EMAIL ?? "chat-sock-test-1776726549@example.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "Test1234!";
const DISPUTE_ID = process.env.DISPUTE_ID ?? "disp_mock_e2e_proof_abc123";
const USE_MOCK = process.env.USE_MOCK !== "false";

test.describe("feat/disputes-actions", () => {
  test("can add evidence and resolve a dispute directly from the detail page", async ({
    page,
  }) => {
    // --- Mock the backend if requested (for preview-URL CORS isolation) ---
    if (USE_MOCK) {
      let currentStatus: "OPEN" | "RESOLVED" = "OPEN";
      const evidence: Array<{
        type: string;
        url?: string;
        description?: string;
        content?: string;
      }> = [];
      const timeline: Array<{
        action: string;
        details?: string;
        createdAt: string;
      }> = [];
      let resolution: string | null = null;

      await page.route(
        /\/api\/v1\/disputes\/[^/]+$/,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              id: DISPUTE_ID,
              missionId: null,
              localMissionId: "lm_mock_e2e",
              reason: "E2E proof — mocked backend",
              description: "",
              status: currentStatus,
              resolution,
              evidence,
              timeline,
              createdAt: new Date().toISOString(),
            }),
          });
        },
      );
      await page.route(
        /\/api\/v1\/disputes\/[^/]+\/evidence$/,
        async (route, req) => {
          const body = JSON.parse(req.postData() ?? "{}");
          evidence.push({
            type: body.type,
            description: body.content,
            content: body.content,
          });
          timeline.push({
            action: "EVIDENCE_ADDED",
            details: `Evidence submitted: ${body.type}`,
            createdAt: new Date().toISOString(),
          });
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ ok: true }),
          });
        },
      );
      await page.route(
        /\/api\/v1\/disputes\/[^/]+\/resolve$/,
        async (route, req) => {
          const body = JSON.parse(req.postData() ?? "{}");
          currentStatus = "RESOLVED";
          resolution = body.resolution;
          timeline.push({
            action: "RESOLVED",
            details: body.resolution,
            createdAt: new Date().toISOString(),
          });
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({
              id: DISPUTE_ID,
              status: "RESOLVED",
              resolution: body.resolution,
            }),
          });
        },
      );
    }

    // Login via same-origin proxy, mirror into localStorage.
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

    // 1. Open the detail page.
    await page.goto(`${BASE_URL}/disputes/${DISPUTE_ID}`, {
      waitUntil: "domcontentloaded",
    });
    expect(page.url(), "should not redirect to /login").toContain(
      `/disputes/${DISPUTE_ID}`,
    );

    // Dismiss the Loi 25 cookie banner if it appears so it doesn't
    // intercept clicks on buttons further down the page. It's mounted
    // from an effect so we wait briefly, then click-if-present.
    await page.waitForTimeout(1500);
    const cookieAccept = page.getByRole("button", { name: "Accepter" });
    if (await cookieAccept.count()) {
      await cookieAccept.first().click().catch(() => {});
    }

    const badge = page.locator('[data-testid="dispute-status-badge"]');
    await expect(badge).toBeVisible({ timeout: 15_000 });
    const initialStatus = await badge.getAttribute("data-status");
    // eslint-disable-next-line no-console
    console.log(`[proof] initial dispute status: ${initialStatus}`);
    expect(initialStatus).toBe("OPEN");

    // 2. Add evidence.
    const beforeCount = await page
      .locator('[data-testid="evidence-row"]')
      .count();
    await page.getByTestId("open-evidence-form").click();
    await expect(page.getByTestId("evidence-form")).toBeVisible();
    const marker = `E2E evidence ${Date.now()}`;
    await page.getByTestId("evidence-content").fill(marker);
    await page.getByTestId("submit-evidence").click();

    // The form clears and the new row appears.
    await expect(async () => {
      const after = await page
        .locator('[data-testid="evidence-row"]')
        .count();
      expect(after).toBe(beforeCount + 1);
    }).toPass({ timeout: 10_000 });
    await expect(page.getByText(marker)).toBeVisible();
    // eslint-disable-next-line no-console
    console.log(`[proof] evidence count: ${beforeCount} → ${beforeCount + 1}`);

    // 3. Resolve.
    await page.getByTestId("open-resolve-form").scrollIntoViewIfNeeded();
    await page.getByTestId("open-resolve-form").click();
    await expect(page.getByTestId("resolve-form")).toBeVisible();
    const resolution = `E2E auto-resolve ${Date.now()}`;
    await page.getByTestId("resolve-content").fill(resolution);
    await page.getByTestId("submit-resolve").click();

    await expect
      .poll(() => badge.getAttribute("data-status"), { timeout: 10_000 })
      .toBe("RESOLVED");
    // eslint-disable-next-line no-console
    console.log(`[proof] status transitioned to RESOLVED`);
    await expect(page.getByText(resolution).first()).toBeVisible();

    await page.screenshot({
      path: "test-results/disputes-actions-proof.png",
      fullPage: true,
    });
  });
});
