import { test, expect } from "./fixtures/console";
import { auditA11y } from "./fixtures/a11y";
import type { BrowserContext, Page } from "@playwright/test";
import type { InvoiceResponse, InvoiceReviewState } from "@/lib/api-client";

const USER = {
  id: "u_e2e_client",
  email: "client.e2e@workon.test",
  firstName: "Sam",
  lastName: "Patron",
  role: "employer",
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

const emptyReview = {
  clientAcceptedAt: null,
  workerAcceptedAt: null,
  clientDisputedAt: null,
  disputeReason: null,
  escrowReleasedAt: null,
};

function invoice(
  id: string,
  overrides: Partial<InvoiceResponse>,
): InvoiceResponse {
  return {
    id,
    invoiceNumber: `WO-2026-${id.slice(-4).toUpperCase()}`,
    missionId: `mission_${id}`,
    subtotal: 250,
    platformFee: 37.5,
    taxes: 14.36,
    tps: 12.5,
    tvq: 1.86,
    total: 301.86,
    currency: "CAD",
    status: "PAID",
    description: "Reparer galerie arriere",
    createdAt: "2026-06-25T14:00:00.000Z",
    paidAt: "2026-06-25T14:10:00.000Z",
    supplier: {
      name: "Alex Pro",
      address: "12 rue du Travail, Montreal",
      gstNumber: "123456789RT0001",
      qstNumber: "1234567890TQ0001",
    },
    client: {
      name: "Sam Patron",
      address: "34 av. du Client, Montreal",
    },
    paymentTerms: "Paiement a l'acceptation bilaterale.",
    review: emptyReview,
    ...overrides,
  };
}

const baseInvoices: InvoiceResponse[] = [
  invoice("inv_e2e_review", {
    invoiceNumber: "WO-2026-0100",
    description: "Reparer galerie arriere",
  }),
  invoice("inv_e2e_processing", {
    invoiceNumber: "WO-2026-0101",
    description: "Installer luminaire cuisine",
    status: "PROCESSING",
    paidAt: null,
    total: 180,
    subtotal: 150,
    platformFee: 22.5,
    taxes: 7.5,
    tps: 5,
    tvq: 2.5,
  }),
  invoice("inv_e2e_released", {
    invoiceNumber: "WO-2026-0102",
    description: "Nettoyage apres renovation",
    total: 420,
    subtotal: 360,
    platformFee: 54,
    taxes: 6,
    tps: 3,
    tvq: 3,
    review: {
      ...emptyReview,
      clientAcceptedAt: "2026-06-26T12:00:00.000Z",
      workerAcceptedAt: "2026-06-26T12:05:00.000Z",
      escrowReleasedAt: "2026-06-26T12:10:00.000Z",
    },
  }),
  invoice("inv_e2e_failed", {
    invoiceNumber: "WO-2026-0103",
    description: "Paiement carte a reprendre",
    status: "FAILED",
    paidAt: null,
    total: 95,
    subtotal: 80,
    platformFee: 12,
    taxes: 3,
    tps: 1.5,
    tvq: 1.5,
  }),
  invoice("inv_e2e_refunded", {
    invoiceNumber: "WO-2026-0104",
    description: "Mission annulee et remboursee",
    status: "REFUNDED",
    total: 210,
    subtotal: 180,
    platformFee: 27,
    taxes: 3,
    tps: 1.5,
    tvq: 1.5,
  }),
];

const reviewState: InvoiceReviewState = {
  invoiceId: "inv_e2e_review",
  invoiceNumber: "WO-2026-0100",
  status: "pending_acceptance",
  viewerRole: "client",
  clientAcceptedAt: null,
  workerAcceptedAt: null,
  clientDisputedAt: null,
  disputeReason: null,
  escrowReleasedAt: null,
  canAccept: true,
  canDispute: true,
};

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
      localStorage.setItem("workon_mode", "client");
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

test("factures : hub, filtres, detail et revue escrow", async ({
  page,
  context,
  consoleErrors,
}) => {
  test.setTimeout(120_000);
  await setupAuth(page, context);

  let acceptCalled = false;
  let currentReviewState = { ...reviewState };

  await page.route("**/api/workon/payments/invoices/mine", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(baseInvoices),
    }),
  );

  await page.route("**/api/workon/payments/invoice/**", async (route) => {
    const url = new URL(route.request().url());
    const parts = url.pathname.split("/");
    const invoiceId = parts[parts.indexOf("invoice") + 1];
    const selected = baseInvoices.find((item) => item.id === invoiceId);

    if (url.pathname.endsWith("/review-state")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentReviewState),
      });
    }

    if (url.pathname.endsWith("/accept")) {
      if (route.request().method() !== "POST") return route.fallback();
      acceptCalled = true;
      currentReviewState = {
        ...currentReviewState,
        clientAcceptedAt: "2026-06-29T12:00:00.000Z",
        canAccept: false,
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentReviewState),
      });
    }

    return route.fulfill({
      status: selected ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(selected ?? { message: "not found" }),
    });
  });

  await page.goto("/invoices");

  await expect(page.getByRole("heading", { name: "Mes factures" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Centre de facturation")).toBeVisible();
  await expect(page.getByTestId("invoice-card")).toHaveCount(5);
  await expect(
    page.getByTestId("invoices-list").getByRole("heading", {
      name: "Reparer galerie arriere",
    }),
  ).toBeVisible();
  await expect(page.getByText("Revue requise").first()).toBeVisible();

  await page.getByTestId("invoices-filter-action").click();
  await expect(page.getByTestId("invoice-card")).toHaveCount(2);
  await expect(page.getByText("Paiement carte a reprendre")).toBeVisible();

  await page.getByTestId("invoices-filter-pending").click();
  await expect(page.getByTestId("invoice-card")).toHaveCount(1);
  await expect(page.getByText("Installer luminaire cuisine")).toBeVisible();

  await page.getByTestId("invoices-filter-paid").click();
  await expect(page.getByTestId("invoice-card")).toHaveCount(1);
  await expect(page.getByText("Nettoyage apres renovation")).toBeVisible();

  await page.getByTestId("invoices-filter-closed").click();
  await expect(page.getByTestId("invoice-card")).toHaveCount(1);
  await expect(page.getByText("Mission annulee et remboursee")).toBeVisible();

  await page.getByTestId("invoices-filter-all").click();
  const reviewCard = page
    .getByTestId("invoice-card")
    .filter({ hasText: "Reparer galerie arriere" });
  await reviewCard.getByRole("link", { name: /Voir facture/ }).click();
  await page.waitForURL(/\/invoices\/inv_e2e_review$/, { timeout: 15_000 });

  await expect(page.getByTestId("invoice-detail-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "WO-2026-0100" })).toBeVisible();
  await expect(page.getByText("Dossier facture")).toBeVisible();
  await expect(page.getByText("Parties legales")).toBeVisible();
  await expect(page.getByText("Detail du montant")).toBeVisible();
  const reviewLinks = page.getByRole("link", { name: /Ouvrir la revue/ });
  await expect(reviewLinks).toHaveCount(2);
  await expect(reviewLinks.first()).toHaveAttribute(
    "href",
    "/invoices/inv_e2e_review/review",
  );

  await auditA11y(page, "/invoices/[id]", ["color-contrast"]);

  await reviewLinks.first().click();
  await page.waitForURL(/\/invoices\/inv_e2e_review\/review$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: /Revue de facture/ })).toBeVisible();
  await page.getByRole("button", { name: /Accepter la facture/ }).click();
  await expect(page.getByText(/Acceptation enregistr/)).toBeVisible({
    timeout: 10_000,
  });
  expect(acceptCalled).toBe(true);

  expect(consoleErrors).toEqual([]);
});
