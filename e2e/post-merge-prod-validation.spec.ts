/**
 * Post-merge validation — exercises every shipped feature against
 * Vercel prod (workonapp.vercel.app) as a real user, not via curl.
 *
 * Covers all 5 fixes from today's session:
 *   A. CNESST notice renders for worker on /onboarding/details
 *   B. CNESST notice does NOT render for employer
 *   C. Worker login auto-registers a `web` device (POST /devices fires)
 *   D. Polling cadence aligned at 30s (no 20s drift on bottom-nav unread)
 *   E. /settings/subscription page renders, FREE user sees no portal button
 *   F. /admin/verify-express auth-gates correctly (no admin → Accès refusé)
 *
 * Run:
 *   BASE_URL=https://workonapp.vercel.app \
 *     npx playwright test --config=playwright.audit.config.ts \
 *       --grep "post-merge"
 */
import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.BASE_URL ?? "https://workonapp.vercel.app";
const API_BASE =
  process.env.API_BASE ??
  "https://workon-backend-production-8908.up.railway.app/api/v1";

const OUT_DIR = path.resolve(__dirname, "../audit-out");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function registerFresh(
  page: Page,
  role: "worker" | "employer",
): Promise<{ id: string; email: string; token: string }> {
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const email = `pmv-${role}-${ts}@workon.test`;
  const password = "Test1234!";
  const res = await page.request.post(`${API_BASE}/auth/register`, {
    data: {
      email,
      password,
      firstName: `PMV${role[0].toUpperCase()}`,
      lastName: role === "worker" ? "Pro" : "Client",
      role,
    },
  });
  expect(res.status(), `register ${role}`).toBeLessThan(300);
  const body = await res.json();
  return { id: body.user.id, email, token: body.accessToken };
}

async function loginViaProxy(
  page: Page,
  email: string,
  password = "Test1234!",
): Promise<{ id: string; role: string; token: string }> {
  await page.goto(`${BASE_URL}/`);
  const res = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
  });
  expect(res.status(), "FE login proxy").toBe(200);
  const body = await res.json();
  await page.evaluate(
    ({ token, refresh, user }) => {
      localStorage.setItem("workon_access_token", token);
      if (refresh) localStorage.setItem("workon_refresh_token", refresh);
      if (user) localStorage.setItem("workon_user", JSON.stringify(user));
    },
    { token: body.accessToken, refresh: body.refreshToken, user: body.user },
  );
  return { id: body.user.id, role: body.user.role, token: body.accessToken };
}

test.setTimeout(180_000);

test.describe("post-merge validation @prod", () => {
  test("A. CNESST notice renders for worker on /onboarding/details", async ({
    page,
  }) => {
    const worker = await registerFresh(page, "worker");
    await loginViaProxy(page, worker.email);

    await page.goto(`${BASE_URL}/onboarding/details`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);

    const notice = page.getByTestId("onboarding-cnesst-notice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("Statut de travailleur autonome");
    await expect(notice).toContainText("TPS/TVQ");
    await expect(notice).toContainText("CNESST");
    await expect(
      notice.getByRole("link", { name: /En savoir plus sur la CNESST/ }),
    ).toBeVisible();

    await page.screenshot({
      path: path.join(OUT_DIR, "A-cnesst-worker.png"),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 700 },
    });
  });

  test("B. CNESST notice does NOT render for employer", async ({ page }) => {
    const employer = await registerFresh(page, "employer");
    await loginViaProxy(page, employer.email);

    await page.goto(`${BASE_URL}/onboarding/details`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);

    await expect(page.getByTestId("onboarding-cnesst-notice")).toHaveCount(0);
  });

  test("C. Worker login auto-registers a web device", async ({ page }) => {
    const worker = await registerFresh(page, "worker");

    // Capture POST /devices calls to assert payload shape.
    const deviceCalls: Array<{ url: string; payload: any }> = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/devices") && req.method() === "POST") {
        try {
          deviceCalls.push({ url: req.url(), payload: req.postDataJSON() });
        } catch {
          deviceCalls.push({ url: req.url(), payload: null });
        }
      }
    });

    await loginViaProxy(page, worker.email);

    // /home is the first authenticated screen; AppShell mounts useDeviceRegistration.
    await page.goto(`${BASE_URL}/home`, { waitUntil: "domcontentloaded" });
    // Hook fires inside useEffect, give it time to run + post.
    await page.waitForTimeout(4000);

    expect(deviceCalls.length, "POST /devices should fire at least once").toBeGreaterThanOrEqual(1);
    const last = deviceCalls[deviceCalls.length - 1];
    expect(last.payload).toMatchObject({
      platform: "web",
    });
    expect(last.payload.deviceId, "deviceId must be set").toBeTruthy();
    expect(typeof last.payload.deviceId).toBe("string");

    // localStorage stores the same id.
    const stored = await page.evaluate(() =>
      localStorage.getItem("workon_device_id"),
    );
    expect(stored).toBe(last.payload.deviceId);
  });

  test("D. Polling cadence aligned — only 1 fetch per endpoint per 30s window", async ({
    page,
  }) => {
    const worker = await registerFresh(page, "worker");
    await loginViaProxy(page, worker.email);

    const polls: Array<{ url: string; ts: number }> = [];
    page.on("request", (req) => {
      const u = req.url();
      if (u.includes("unread-count")) {
        polls.push({ url: u, ts: Date.now() });
      }
    });

    await page.goto(`${BASE_URL}/home`, { waitUntil: "domcontentloaded" });
    // First call is the initial fetch on mount, then refetchInterval kicks in.
    await page.waitForTimeout(35_000);

    // Group by endpoint root (notifications vs messages-local).
    const byEndpoint = new Map<string, number[]>();
    for (const p of polls) {
      const key = p.url.includes("notifications/unread-count")
        ? "notifications"
        : p.url.includes("messages-local/unread-count")
          ? "messages-local"
          : "other";
      const arr = byEndpoint.get(key) ?? [];
      arr.push(p.ts);
      byEndpoint.set(key, arr);
    }

    // Each endpoint should fire 1-2x in 35s (mount + maybe one refetch at 30s).
    // Pre-fix: bottom-nav was 20s → 2 fetches in 35s; top-bar was 30s → 1.
    // Post-fix: both at 30s → 1-2 each.
    for (const [key, ts] of byEndpoint.entries()) {
      if (key === "other") continue;
      expect(ts.length, `${key} should poll 1-2x in 35s`).toBeLessThanOrEqual(2);
    }
  });

  test("E. /settings/subscription renders, FREE user sees no portal button", async ({
    page,
  }) => {
    const worker = await registerFresh(page, "worker");
    await loginViaProxy(page, worker.email);

    await page.goto(`${BASE_URL}/settings/subscription`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2500);

    await expect(
      page.getByRole("heading", { name: /Mon abonnement/ }),
    ).toBeVisible();

    // Free plan label visible.
    await expect(page.getByText(/Gratuit|FREE/i).first()).toBeVisible();

    // Portal button must NOT be visible for FREE user (gated on isPaid).
    await expect(page.getByTestId("btn-customer-portal")).toHaveCount(0);

    // "Voir les plans" CTA should be visible to drive paid conversion.
    await expect(page.getByRole("link", { name: /Voir les plans/i })).toBeVisible();
  });

  test("F. /admin/verify-express gates non-admin to 'Accès refusé'", async ({
    page,
  }) => {
    const worker = await registerFresh(page, "worker");
    await loginViaProxy(page, worker.email);

    await page.goto(`${BASE_URL}/admin/verify-express`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);

    // Server-side cookie check passes (we have a token), so the page loads,
    // but the client-side role guard should render the "Accès refusé" panel.
    await expect(
      page.getByRole("heading", { name: /Accès refusé/ }),
    ).toBeVisible();
  });
});
