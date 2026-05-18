import { expect, test, type APIResponse, type Page } from "@playwright/test";

test.setTimeout(30_000);

const serverErrorPattern =
  /500 Internal Server Error|Application error: a server-side exception/i;

async function expectNoServerCrash(page: Page, response: APIResponse | null) {
  expect(response?.status() ?? 0).toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();

  const bodyText = await page.locator("body").textContent();
  expect(bodyText ?? "").not.toMatch(serverErrorPattern);
}

test.describe("Smoke: public frontend", () => {
  const publicPages = [
    { path: "/", name: "Home" },
    { path: "/about", name: "About" },
    { path: "/pricing", name: "Pricing" },
    { path: "/faq", name: "FAQ" },
    { path: "/legal/terms", name: "Terms" },
    { path: "/legal/privacy", name: "Privacy" },
    { path: "/login", name: "Login" },
    { path: "/register", name: "Register" },
    { path: "/forgot-password", name: "Forgot password" },
    { path: "/reset-password", name: "Reset password" },
  ];

  for (const { path, name } of publicPages) {
    test(`${name} (${path}) loads without server crash`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      await expectNoServerCrash(page, response);
    });
  }
});

test.describe("Smoke: auth protection", () => {
  const protectedPages = [
    "/home",
    "/dashboard",
    "/profile",
    "/onboarding",
    "/missions/new",
    "/missions/mine",
    "/worker/dashboard",
    "/employer/dashboard",
    "/settings",
  ];

  for (const path of protectedPages) {
    test(`${path} redirects anonymous visitors to login`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname).toBe("/login");
      await expectNoServerCrash(page, response);
    });
  }
});

test.describe("Smoke: frontend API", () => {
  test("/api/health responds without a frontend crash", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.status()).toBeLessThan(500);

    const data = await response.json();
    expect(data).toEqual(
      expect.objectContaining({
        checks: expect.objectContaining({ api: true }),
        status: expect.stringMatching(/healthy|degraded|unhealthy/),
      }),
    );
  });
});

test.describe("Smoke: backend health (optional)", () => {
  test("backend health responds when explicitly enabled", async ({ request }) => {
    test.skip(
      process.env.RUN_BACKEND_SMOKE !== "true",
      "Set RUN_BACKEND_SMOKE=true to include backend health in smoke.",
    );

    const healthUrl =
      process.env.BACKEND_HEALTH_URL ??
      "http://127.0.0.1:3001/api/v1/health";
    const response = await request.get(healthUrl, { timeout: 5_000 });

    expect(response.status()).toBeLessThan(500);
  });
});
