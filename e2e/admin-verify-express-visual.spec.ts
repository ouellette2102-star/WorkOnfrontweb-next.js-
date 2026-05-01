/**
 * Visual proof for the admin VERIFY_EXPRESS_19 reviewer queue.
 *
 * Uses Playwright route mocks to bypass the real auth + API and force
 * (1) the user to be an admin and (2) one fake queue item. Asserts
 * the table renders, the approve/reject buttons are wired, and an
 * approval call is made when "Approuver" is clicked.
 *
 * Run:
 *   BASE_URL=http://localhost:3000 \
 *     npx playwright test --config=playwright.audit.config.ts \
 *       --grep "verify-express visual"
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const FAKE_ADMIN = {
  id: "admin_test_1",
  email: "admin@workon.test",
  firstName: "Admin",
  lastName: "Test",
  role: "admin",
};

const FAKE_QUEUE = {
  items: [
    {
      boostId: "b_demo_1",
      paidAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      stripePaymentIntentId: "pi_demo123abcdef",
      user: {
        id: "u_demo",
        email: "alice.demo@workon.test",
        firstName: "Alice",
        lastName: "Demo",
        phone: "+15145550123",
        phoneVerified: true,
        idVerificationStatus: "NOT_STARTED",
        idVerifiedAt: null,
        trustTier: "BASIC",
        gallery: [],
      },
    },
  ],
  total: 1,
};

test.setTimeout(60_000);

test("verify-express visual: queue renders + approve fires API call", async ({
  page,
}) => {
  // Make sure the (app)/layout server-side cookie check passes.
  await page.context().addCookies([
    {
      name: "workon_token",
      value: "fake-cookie-for-test",
      url: BASE_URL,
    },
  ]);

  // Stub the FE-proxy /api/auth/me to claim we're admin.
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: FAKE_ADMIN }),
  );

  // Stub the BE queue list endpoint.
  await page.route(
    "**/api/v1/admin/verify-express/queue",
    (route) => route.fulfill({ json: FAKE_QUEUE }),
  );

  // Capture the approve POST so we can assert it was called.
  let approveCalled = false;
  await page.route(
    "**/api/v1/admin/verify-express/b_demo_1/approve",
    (route) => {
      approveCalled = true;
      route.fulfill({
        json: {
          user: { id: "u_demo", idVerificationStatus: "VERIFIED", trustTier: "TRUSTED" },
          trustTier: "TRUSTED",
        },
      });
    },
  );

  await page.goto(`${BASE_URL}/admin/verify-express`, {
    waitUntil: "domcontentloaded",
  });

  // Page loaded as admin — heading visible.
  await expect(
    page.getByRole("heading", { name: /File de vérification express/ }),
  ).toBeVisible();

  // Queue count rendered.
  await expect(page.getByTestId("queue-count")).toHaveText("1");

  // Item card rendered with worker name.
  await expect(page.getByTestId("queue-item-b_demo_1")).toBeVisible();
  await expect(page.getByText("Alice Demo")).toBeVisible();
  await expect(page.getByText("alice.demo@workon.test")).toBeVisible();

  // Approve button fires the API call.
  await page.getByTestId("btn-approve-b_demo_1").click();
  await page.waitForTimeout(1000);
  expect(approveCalled).toBe(true);
});
