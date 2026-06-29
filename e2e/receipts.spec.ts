import { test, expect } from "./fixtures/console";
import { auditA11y } from "./fixtures/a11y";
import type { BrowserContext, Page } from "@playwright/test";
import type { WorkerPayment } from "@/lib/api-client";

const USER = {
  id: "u_e2e_worker",
  email: "worker.e2e@workon.test",
  firstName: "Alex",
  lastName: "Pro",
  role: "worker",
  city: "Montreal",
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
};

function b64(obj: unknown) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function makeJwt() {
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub: USER.id,
    role: USER.role,
  })}.sig`;
}

const payments: WorkerPayment[] = [
  {
    id: "pay_succeeded",
    missionId: "mission_galerie",
    missionTitle: "Reparer galerie arriere",
    missionCategory: "Reparations",
    amountCents: 48000,
    feeCents: 7200,
    netAmountCents: 40800,
    currency: "CAD",
    status: "SUCCEEDED",
    completedAt: "2026-06-26T14:00:00.000Z",
    createdAt: "2026-06-25T12:00:00.000Z",
    invoiceNumber: "WO-2026-0200",
    stripeTransferId: "tr_e2e_123",
    escrowReleasedAt: "2026-06-26T14:05:00.000Z",
  },
  {
    id: "pay_pending",
    missionId: "mission_lumiere",
    missionTitle: "Installer luminaire cuisine",
    missionCategory: "Electricite",
    amountCents: 22000,
    feeCents: 3300,
    netAmountCents: 18700,
    currency: "CAD",
    status: "PENDING",
    completedAt: null,
    createdAt: "2026-06-27T12:00:00.000Z",
    invoiceNumber: "WO-2026-0201",
    stripeTransferId: null,
    escrowReleasedAt: null,
  },
  {
    id: "pay_failed",
    missionId: "mission_plomberie",
    missionTitle: "Changer robinet salle de bain",
    missionCategory: "Plomberie",
    amountCents: 12500,
    feeCents: 1875,
    netAmountCents: 10625,
    currency: "CAD",
    status: "FAILED",
    completedAt: null,
    createdAt: "2026-06-24T12:00:00.000Z",
    invoiceNumber: "WO-2026-0202",
    stripeTransferId: null,
    escrowReleasedAt: null,
  },
];

async function setupAuth(page: Page, context: BrowserContext) {
  const fakeJwt = makeJwt();

  await context.addCookies([
    {
      name: "workon_token",
      value: "e2e_fixture_token",
      domain: "localhost",
      path: "/",
    },
  ]);

  await page.addInitScript((user) => {
    try {
      const encode = (obj: unknown) =>
        btoa(JSON.stringify(obj))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
        sub: user.id,
        role: user.role,
      })}.sig`;
      localStorage.setItem("workon_user", JSON.stringify(user));
      localStorage.setItem("workon_access_token", token);
      localStorage.setItem("workon_refresh_token", "e2e_fake_refresh");
      localStorage.setItem("cookie-consent", "accepted");
      localStorage.setItem("workon_mode", "pro");
    } catch {}
  }, USER);

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(USER),
    }),
  );
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: USER, accessToken: fakeJwt }),
    }),
  );
  await page.route("**/api/workon/devices", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "dev_e2e", deviceId: "e2e", platform: "web" }),
    }),
  );
  await page.route("**/api/workon/compliance/versions", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        versions: { termsOfService: "1.0", privacyPolicy: "1.0" },
      }),
    }),
  );
  await page.route("**/api/workon/compliance/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isComplete: true, missing: [] }),
    }),
  );
  await page.route("**/api/workon/messages-local/unread-count", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0 }),
    }),
  );
  await page.route("**/api/workon/notifications/unread-count", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0 }),
    }),
  );
  await page.route("**/api/workon/reviews/pending-for-me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
}

test("recus : hub, filtres, facture et releve PDF", async ({
  page,
  context,
  consoleErrors,
}) => {
  test.setTimeout(120_000);
  await setupAuth(page, context);

  let pdfDownloadedFor: string | null = null;

  await page.route("**/api/workon/earnings/payments", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payments),
    }),
  );

  await page.route("**/api/workon/payments/invoice/**/statement/pdf", (route) => {
    const url = new URL(route.request().url());
    const parts = url.pathname.split("/");
    pdfDownloadedFor = parts[parts.indexOf("invoice") + 1];

    return route.fulfill({
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="releve-${pdfDownloadedFor}.pdf"`,
      },
      body: Buffer.from("%PDF-1.4\n% WorkOn receipt fixture\n%%EOF"),
    });
  });

  await page.goto("/receipts");

  await expect(page.getByTestId("receipts-page")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Mes recus" })).toBeVisible();
  await expect(page.getByText("Centre des recus")).toBeVisible();
  await expect(page.getByTestId("receipt-card")).toHaveCount(3);
  await expect(
    page.getByTestId("receipts-list").getByRole("heading", {
      name: "Reparer galerie arriere",
    }),
  ).toBeVisible();
  await expect(page.getByText("WO-2026-0200")).toBeVisible();
  await expect(page.getByText("Stripe tr_e2e_123")).toBeVisible();

  await page.getByTestId("receipts-filter-paid").click();
  await expect(page.getByTestId("receipt-card")).toHaveCount(1);
  await expect(page.getByText("Reparer galerie arriere")).toBeVisible();

  await page.getByTestId("receipts-filter-pending").click();
  await expect(page.getByTestId("receipt-card")).toHaveCount(1);
  await expect(page.getByText("Installer luminaire cuisine")).toBeVisible();

  await page.getByTestId("receipts-filter-failed").click();
  await expect(page.getByTestId("receipt-card")).toHaveCount(1);
  await expect(page.getByText("Changer robinet salle de bain")).toBeVisible();

  await page.getByTestId("receipts-filter-all").click();
  const succeededCard = page
    .getByTestId("receipt-card")
    .filter({ hasText: "Reparer galerie arriere" });
  await expect(succeededCard.getByRole("link", { name: /Voir facture/ })).toHaveAttribute(
    "href",
    "/invoices/pay_succeeded",
  );

  const downloadPromise = page.waitForEvent("download");
  await succeededCard.getByRole("button", { name: /Releve PDF/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("releve-pay_succeeded.pdf");
  expect(pdfDownloadedFor).toBe("pay_succeeded");

  await auditA11y(page, "/receipts", ["color-contrast"]);

  expect(consoleErrors).toEqual([]);
});
