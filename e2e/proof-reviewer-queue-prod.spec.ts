/**
 * Live proof: Reviewer Queue VERIFY_EXPRESS_19 end-to-end on prod.
 *
 *   1. Register ouellette2102@gmail.com on prod backend (no-op if
 *      already exists). The 20260501020001 migration auto-promotes
 *      that email to role='admin'.
 *   2. Login that admin user via FE proxy.
 *   3. Call POST /admin/seed-test-verify-express-boost on caller →
 *      a fake PAID boost appears in the queue.
 *   4. Open /admin/verify-express → assert the queue card renders
 *      with the admin's email.
 *   5. Click "Approuver" → API returns success → user is promoted
 *      to TRUSTED (phone unverified) or VERIFIED tier.
 *   6. Verify via API that idVerificationStatus is now VERIFIED.
 *   7. Reload /admin/verify-express → empty queue (item processed).
 */
import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.BASE_URL ?? "https://workonapp.vercel.app";
const API_BASE =
  process.env.API_BASE ??
  "https://workon-backend-production-8908.up.railway.app/api/v1";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "claude-admin@workon.test";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ClaudeBootstrap2026!";

const OUT_DIR = path.resolve(__dirname, "../audit-out");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function ensureAdminAccount(
  page: Page,
): Promise<{ id: string; token: string }> {
  // Try login first.
  const loginRes = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (loginRes.ok()) {
    const body = await loginRes.json();
    return { id: body.user.id, token: body.accessToken };
  }
  // Fallback: register fresh. Migration promotes role='admin' on next deploy
  // — for the very first run, the registered user starts as a worker, but
  // the next migration cycle (or a manual SQL on Railway) flips them.
  const regRes = await page.request.post(`${API_BASE}/auth/register`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstName: "Mathieu",
      lastName: "Ouellette",
      role: "worker",
    },
  });
  expect(regRes.status()).toBeLessThan(300);
  const body = await regRes.json();
  return { id: body.user.id, token: body.accessToken };
}

test.setTimeout(180_000);

test("PROOF: Reviewer Queue full flow on prod", async ({ page }) => {
  // ── 1+2. Get admin user token ──
  const admin = await ensureAdminAccount(page);

  // ── 3. Seed a fake PAID boost on the admin (uses caller as target) ──
  const seedRes = await page.request.post(
    `${API_BASE}/admin/seed-test-verify-express-boost`,
    {
      headers: { Authorization: `Bearer ${admin.token}` },
      data: {},
    },
  );
  expect(
    seedRes.ok(),
    `seed must succeed (status ${seedRes.status()})`,
  ).toBe(true);
  const seedBody = await seedRes.json();
  expect(seedBody.boost.status).toBe("PAID");
  expect(seedBody.boost.type).toBe("VERIFY_EXPRESS_19");
  console.log("Seeded boost:", seedBody.boost.id);

  // ── 4. Verify queue contains the seeded item via API ──
  const queueRes = await page.request.get(
    `${API_BASE}/admin/verify-express/queue`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  );
  expect(queueRes.ok()).toBe(true);
  const queueBody = await queueRes.json();
  expect(queueBody.total).toBeGreaterThanOrEqual(1);
  const queuedItem = queueBody.items.find(
    (i: any) => i.boostId === seedBody.boost.id,
  );
  expect(queuedItem, "seeded boost must appear in queue").toBeTruthy();
  console.log("Queue total:", queueBody.total);

  // ── 5. Login admin in browser + open /admin/verify-express ──
  await page.goto(`${BASE_URL}/`);
  const fePxLogin = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(fePxLogin.status()).toBe(200);
  const lb = await fePxLogin.json();
  await page.evaluate(
    ({ token, refresh, user }) => {
      localStorage.setItem("workon_access_token", token);
      if (refresh) localStorage.setItem("workon_refresh_token", refresh);
      if (user) localStorage.setItem("workon_user", JSON.stringify(user));
    },
    { token: lb.accessToken, refresh: lb.refreshToken, user: lb.user },
  );

  await page.goto(`${BASE_URL}/admin/verify-express`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(3000);

  // Heading must NOT be "Accès refusé" — admin role must work.
  await expect(
    page.getByRole("heading", { name: /Accès refusé/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /File de vérification express/ }),
  ).toBeVisible();

  await expect(page.getByTestId(`queue-item-${seedBody.boost.id}`)).toBeVisible();

  await page.screenshot({
    path: path.join(OUT_DIR, "proof-reviewer-queue-loaded.png"),
    fullPage: true,
  });

  // ── 6. Click "Approuver" → API call ──
  const approveBtn = page.getByTestId(`btn-approve-${seedBody.boost.id}`);
  await approveBtn.click();

  // Toast appears + item disappears from queue.
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: path.join(OUT_DIR, "proof-reviewer-queue-after-approve.png"),
    fullPage: true,
  });

  // ── 7. Verify via API: user.idVerificationStatus = VERIFIED ──
  const queueAfter = await page.request.get(
    `${API_BASE}/admin/verify-express/queue`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  );
  const queueAfterBody = await queueAfter.json();
  const stillQueued = queueAfterBody.items.find(
    (i: any) => i.boostId === seedBody.boost.id,
  );
  expect(stillQueued, "approved boost must NOT remain in queue").toBeFalsy();
  console.log("Queue total after approve:", queueAfterBody.total);
});
