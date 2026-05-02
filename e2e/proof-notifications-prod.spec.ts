/**
 * Live proof: notification flow end-to-end on Vercel prod, no mocks.
 *
 *   1. Register two fresh accounts on prod backend.
 *   2. Mutual LIKE → real swipe_match LocalNotification with actionUrl.
 *   3. Login as user A on Vercel prod (no fakery).
 *   4. Navigate /notifications → assert the swipe_match row renders.
 *   5. Click it → URL goes to /matches.
 *   6. Screenshot every step under audit-out/ for the matrix.
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

async function register(
  page: Page,
  role: "worker" | "employer",
): Promise<{ id: string; email: string; password: string; token: string }> {
  const ts = Date.now() + Math.floor(Math.random() * 10_000);
  const email = `proof-${role}-${ts}@workon.test`;
  const password = "Test1234!";
  const res = await page.request.post(`${API_BASE}/auth/register`, {
    data: {
      email,
      password,
      firstName: `Proof${role[0].toUpperCase()}`,
      lastName: role === "worker" ? "Pro" : "Client",
      role,
    },
  });
  expect(res.status()).toBeLessThan(300);
  const body = await res.json();
  return { id: body.user.id, email, password, token: body.accessToken };
}

test.setTimeout(180_000);

test("PROOF: notification list renders + click routes to actionUrl on prod", async ({
  page,
}) => {
  // ── 1. Two fresh accounts ──
  const A = await register(page, "worker");
  const B = await register(page, "employer");

  // ── 2. Mutual LIKE → match → swipe_match notification ──
  await page.request.post(`${API_BASE}/swipe/action`, {
    headers: { Authorization: `Bearer ${A.token}` },
    data: { candidateId: B.id, action: "LIKE" },
  });
  const matchRes = await page.request.post(`${API_BASE}/swipe/action`, {
    headers: { Authorization: `Bearer ${B.token}` },
    data: { candidateId: A.id, action: "LIKE" },
  });
  const matchBody = await matchRes.json();
  expect(matchBody.matched).toBe(true);

  // Brief wait — notification creation runs after the swipe action returns.
  await page.waitForTimeout(2000);

  // Verify on the BE side first that the notification exists and carries actionUrl.
  const notifApiRes = await page.request.get(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${A.token}` },
  });
  const notifApi = await notifApiRes.json();
  expect(notifApi.length).toBeGreaterThanOrEqual(1);
  const swipeNotif = notifApi.find((n: any) => n.type === "swipe_match");
  expect(swipeNotif).toBeTruthy();
  expect(swipeNotif.actionUrl).toBe("/matches");

  console.log("BE notification:", JSON.stringify(swipeNotif, null, 2));

  // ── 3. Login as A on Vercel prod ──
  await page.goto(`${BASE_URL}/`);
  const loginRes = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: A.email, password: A.password },
  });
  expect(loginRes.status()).toBe(200);
  const lb = await loginRes.json();
  await page.evaluate(
    ({ token, refresh, user }) => {
      localStorage.setItem("workon_access_token", token);
      if (refresh) localStorage.setItem("workon_refresh_token", refresh);
      if (user) localStorage.setItem("workon_user", JSON.stringify(user));
    },
    { token: lb.accessToken, refresh: lb.refreshToken, user: lb.user },
  );

  // ── 4. /notifications renders the swipe_match row ──
  await page.goto(`${BASE_URL}/notifications`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  await expect(
    page.getByRole("heading", { name: /^Notifications$/ }),
  ).toBeVisible();
  await expect(page.getByText(/Nouveau match/)).toBeVisible();

  await page.screenshot({
    path: path.join(OUT_DIR, "proof-1a-notifications-prod.png"),
    fullPage: true,
  });

  // ── 5. Click it → routes off /notifications onto /matches ──
  const before = page.url();
  await page.getByText(/Nouveau match/).click();
  await page.waitForFunction(
    (prev) => window.location.href !== prev,
    before,
    { timeout: 10_000 },
  );
  expect(page.url()).toContain("/matches");

  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUT_DIR, "proof-1b-matches-after-click.png"),
    fullPage: true,
  });

  console.log("Final URL:", page.url());
});
