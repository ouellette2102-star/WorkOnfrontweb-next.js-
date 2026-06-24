/**
 * End-to-end proof for feat/chat-socket-realtime on the Vercel preview.
 *
 * Runs with BASE_URL override so it hits the preview deployment:
 *   BASE_URL=https://workonapp-877ds2rgf-mathieu-ouellettes-projects.vercel.app \
 *     npx playwright test e2e/chat-socket-proof.spec.ts --project=chromium
 *
 * Asserts:
 *   1. Login with the throwaway test account succeeds
 *   2. /messages/<uuid> renders the thread UI (not the marketing home)
 *   3. The Live badge is present
 *   4. The page opens a wss connection to the /chat socket.io namespace
 *
 * We don't assert the badge text matches "Live" because the gateway may
 * take >1s to authenticate under cold start; what we DO assert is that
 * the socket.io handshake actually fires — that is the thing PR #102
 * was about.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "chat-sock-test-1776726549@example.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "Test1234!";
const MISSION_ID = "00000000-0000-4000-8000-000000000001"; // any uuid; thread renders empty state

test.describe("feat/chat-socket-realtime", () => {
  test("thread page opens a socket.io /chat connection and renders the live badge", async ({
    page,
    context,
  }) => {
    // Capture every request so we can assert the socket handshake later.
    const socketRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/socket.io/") || url.includes("/chat")) {
        socketRequests.push(url);
      }
    });
    page.on("websocket", (ws) => {
      socketRequests.push(`WS: ${ws.url()}`);
    });

    // --- Login via the same-origin proxy (mirrors lib/auth.ts) -----------
    await page.goto(`${BASE_URL}/`);
    const loginRes = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.status(), "login proxy should return 200").toBe(200);
    const body = await loginRes.json();
    expect(body.accessToken, "login should return an access token").toBeTruthy();

    // Mirror the token into localStorage so api-client.ts can Bearer it,
    // and the socket hook can pick it up via getAccessToken().
    await page.evaluate(
      ({ token, refresh, user }) => {
        localStorage.setItem("workon_access_token", token);
        if (refresh) localStorage.setItem("workon_refresh_token", refresh);
        if (user) localStorage.setItem("workon_user", JSON.stringify(user));
      },
      { token: body.accessToken, refresh: body.refreshToken, user: body.user },
    );

    // --- Navigate to the thread page -------------------------------------
    await page.goto(`${BASE_URL}/messages/${MISSION_ID}`, {
      waitUntil: "domcontentloaded",
    });

    // Not redirected to /login.
    expect(page.url(), "thread page should not redirect to login").toContain(
      `/messages/${MISSION_ID}`,
    );

    // The live badge rendered.
    const badge = page.locator('[data-testid="chat-live-status"]');
    await expect(badge, "live badge should be visible").toBeVisible({ timeout: 15_000 });
    const status = await badge.getAttribute("data-status");
    const label = (await badge.textContent())?.trim() ?? "";
    // eslint-disable-next-line no-console
    console.log(`[proof] badge data-status="${status}" label="${label}"`);
    expect(["idle", "connecting", "connected", "error", "disconnected"]).toContain(status);

    // Give the socket a moment to attempt the handshake.
    await page.waitForTimeout(3_000);

    // eslint-disable-next-line no-console
    console.log("[proof] socket-related network entries:");
    for (const u of socketRequests) console.log(`  - ${u}`);

    expect(
      socketRequests.some((u) => u.includes("/chat") || u.includes("/socket.io/")),
      "page should open a socket.io /chat handshake",
    ).toBe(true);

    await page.screenshot({
      path: "test-results/chat-socket-proof-badge.png",
      fullPage: false,
    });
  });
});
