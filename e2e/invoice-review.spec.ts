import { test, expect } from "./fixtures/console";
import { auditA11y } from "./fixtures/a11y";

/**
 * F4 — Acceptation bilatérale de facture (escrow) : preuve happy-path,
 * RÉSEAU MOCKÉ, route gated `(app)`. Modèle : e2e/mission-create.spec.ts
 * + recette mocked-auth (mémoire e2e-mocked-auth-recipe).
 *
 * Prouve la logique « argent sûr » sans toucher au backend ni à Stripe :
 *   - les gates auth (cookie serveur `workon_token` + user client hydraté +
 *     JWT factice {sub,role} + refresh mocké + consentement complet) ;
 *   - `/invoices/<id>/review` affiche la facture + l'état d'acceptation
 *     bilatérale ;
 *   - « Accepter la facture » → POST `.../accept` → toast
 *     « Acceptation enregistrée ».
 *
 * Aucune donnée réelle : cookie/token factices + toutes les routes mockées.
 */
const USER = {
  id: "u_e2e_client",
  email: "client.e2e@workon.test",
  firstName: "Sam",
  lastName: "Patron",
  role: "employer",
  city: "Montréal",
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
};

const INVOICE_ID = "inv_e2e_f4";

const REVIEW_STATE = {
  invoiceId: INVOICE_ID,
  invoiceNumber: "WO-2026-0042",
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

// Shape complète attendue par la page (objets imbriqués supplier/client
// inclus — sinon `invoice.supplier.name` crashe la page).
const INVOICE = {
  id: INVOICE_ID,
  invoiceNumber: "WO-2026-0042",
  missionId: "m_e2e",
  subtotal: 100,
  platformFee: 10,
  taxes: 15,
  tps: 5,
  tvq: 10,
  total: 115,
  currency: "CAD",
  status: "pending_acceptance",
  paidAt: null,
  paymentTerms: "Paiement à l'acceptation",
  supplier: {
    name: "Sam Prestataire",
    address: "12 rue du Travail, Montréal",
    gstNumber: "123456789RT0001",
    qstNumber: "1234567890TQ0001",
  },
  client: {
    name: "Sam Patron",
    address: "34 av. du Client, Montréal",
  },
};

test("acceptation facture : /invoices/[id]/review → POST accept → toast", async ({
  page,
  context,
  consoleErrors,
}) => {
  // Route gated + serveur dev compilé à froid en CI → marge.
  test.setTimeout(120_000);

  let acceptCalled = false;

  const jwt = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const fakeJwt = `${jwt({ alg: "HS256", typ: "JWT" })}.${jwt({
    sub: USER.id,
    role: USER.role,
  })}.sig`;

  // Gate SERVEUR : (app)/layout vérifie la présence du cookie.
  await context.addCookies([
    { name: "workon_token", value: "e2e_fixture_token", domain: "localhost", path: "/" },
  ]);

  // Gate CLIENT : user hydraté + JWT factice {sub,role} + consentement.
  await page.addInitScript((user) => {
    try {
      const b64url = (obj: unknown) =>
        btoa(JSON.stringify(obj))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      const token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url({
        sub: user.id,
        role: user.role,
      })}.sig`;
      localStorage.setItem("workon_user", JSON.stringify(user));
      localStorage.setItem("workon_access_token", token);
      localStorage.setItem("workon_refresh_token", "e2e_fake_refresh");
      localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  }, USER);

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(USER) }),
  );
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: USER, accessToken: fakeJwt }),
    }),
  );
  await page.route("**/api/workon/compliance/versions", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ versions: { termsOfService: "1.0", privacyPolicy: "1.0" } }),
    }),
  );
  await page.route("**/api/workon/compliance/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isComplete: true, missing: [] }),
    }),
  );

  // F4 — endpoints facture (proxy /api/workon/payments/invoice/**). UN SEUL
  // handler keyé sur le suffixe d'URL → zéro ambiguïté de précédence de glob
  // (les 3 routes séparées se chevauchaient et laissaient passer review-state).
  await page.route("**/api/workon/payments/invoice/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/review-state")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(REVIEW_STATE),
      });
    }
    if (url.includes("/accept")) {
      if (route.request().method() !== "POST") return route.fallback();
      acceptCalled = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...REVIEW_STATE,
          clientAcceptedAt: "2026-06-23T18:00:00.000Z",
          canAccept: false,
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(INVOICE),
    });
  });

  await page.goto(`/invoices/${INVOICE_ID}/review`);

  // Les deux gates (serveur + client) doivent passer pour rendre la page.
  // Assertions SANS apostrophe (le rendu utilise &apos; ; éviter tout
  // mismatch droite/courbe). h1 « Revue de facture » = état succès atteint.
  await expect(
    page.getByRole("heading", { name: /Revue de facture/ }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/acceptation bilat/)).toBeVisible();
  await expect(page.getByText(/WO-2026-0042/).first()).toBeVisible();

  await auditA11y(page, "F4 invoice-review", ["color-contrast"]);

  const acceptBtn = page.getByRole("button", { name: /Accepter la facture/ });
  await expect(acceptBtn).toBeVisible();
  await acceptBtn.click();

  await expect(page.getByText(/Acceptation enregistrée/)).toBeVisible({ timeout: 10_000 });
  expect(acceptCalled).toBe(true);

  expect(consoleErrors).toEqual([]);
});
