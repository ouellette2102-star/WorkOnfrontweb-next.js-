import type { BrowserContext, Page } from "@playwright/test";
import { auditA11y } from "./fixtures/a11y";
import { expect, test } from "./fixtures/console";

const USER = {
  id: "u_e2e_profile_cie",
  email: "profile.cie@workon.test",
  firstName: "Alex",
  lastName: "Profil",
  phone: "+15145550111",
  city: "Montreal",
  pictureUrl: null,
  role: "worker",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
  businessName: null,
  businessCategory: null,
  businessDescription: null,
  businessWebsite: null,
  businessAddress: null,
  gstNumber: null,
  qstNumber: null,
  jobTitle: "Entretien residentiel",
  hourlyRate: 45,
  bio: "Profil de test WorkOn.",
  category: "entretien",
  serviceRadiusKm: 20,
  gallery: [],
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

async function setupProfileMocks(page: Page, context: BrowserContext) {
  const fakeJwt = makeJwt();
  let currentUser = { ...USER };
  let savedBusinessPayload: Record<string, unknown> | null = null;

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
      body: JSON.stringify(currentUser),
    }),
  );
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: currentUser, accessToken: fakeJwt }),
    }),
  );
  await page.route("**/api/workon/users/me", async (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      savedBusinessPayload = body;
      currentUser = { ...currentUser, ...body };
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(currentUser),
    });
  });
  await page.route("**/api/workon/users/me/completion", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ score: 76, tier: "ACTIVE", missingFields: [] }),
    }),
  );
  await page.route("**/api/workon/identity/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        phone: { verified: false, verifiedAt: null },
        identity: { status: "NOT_STARTED", verifiedAt: null, provider: null },
        bank: { verified: false, verifiedAt: null, hasStripeAccount: false },
        trustTier: "BASIC",
        trustTierUpdatedAt: null,
      }),
    }),
  );
  await page.route("**/api/workon/stripe/connect/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        onboarded: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        requirementsNeeded: [],
      }),
    }),
  );
  await page.route("**/api/workon/earnings/summary", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalGross: 0,
        totalNet: 0,
        totalPaid: 0,
        totalPending: 0,
        commissionRate: 0.1,
      }),
    }),
  );
  await page.route("**/api/workon/contracts/user/me", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/api/workon/disputes/mine", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
  await page.route("**/api/workon/missions-local/my-assignments", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
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
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
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

  return {
    getSavedBusinessPayload: () => savedBusinessPayload,
  };
}

test("profil : dossier de cie complet et repris par le centre de confiance", async ({
  page,
  context,
  consoleErrors,
}) => {
  test.setTimeout(120_000);
  const { getSavedBusinessPayload } = await setupProfileMocks(page, context);

  await page.goto("/profile");

  await expect(page.getByTestId("business-info-editor")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Infos de cie et facturation")).toBeVisible();

  await page.getByTestId("business-info-businessName").fill("Gestion Atlas Inc.");
  await page
    .getByTestId("business-info-businessCategory")
    .selectOption("paysagement");
  await page
    .getByTestId("business-info-businessDescription")
    .fill("Equipe locale specialisee en entretien exterieur et petits travaux.");
  await page
    .getByTestId("business-info-businessWebsite")
    .fill("https://atlas.example");
  await page
    .getByTestId("business-info-businessAddress")
    .fill("1234 rue Saint-Laurent, Montreal, QC H2X 2S6");
  await page.getByTestId("business-info-gstNumber").fill("123456789RT0001");
  await page.getByTestId("business-info-qstNumber").fill("1234567890TQ0001");
  await page.getByTestId("business-info-save").click();

  await expect.poll(getSavedBusinessPayload).toMatchObject({
    businessName: "Gestion Atlas Inc.",
    businessCategory: "paysagement",
    businessDescription:
      "Equipe locale specialisee en entretien exterieur et petits travaux.",
    businessWebsite: "https://atlas.example",
    businessAddress: "1234 rue Saint-Laurent, Montreal, QC H2X 2S6",
    gstNumber: "123456789RT0001",
    qstNumber: "1234567890TQ0001",
  });
  await expect(page.getByTestId("business-info-save")).toContainText(
    "Dossier enregistre",
  );

  await auditA11y(page, "/profile", ["color-contrast"]);

  await page.goto("/profile/verify");
  await expect(page.getByText("4/4").first()).toBeVisible();
  const businessStep = page.getByTestId("verify-business-step");
  await expect(businessStep).toContainText("Infos de cie");
  await expect(businessStep).toContainText("Complet");
  await expect(businessStep).toContainText("Nom legal");
  await expect(businessStep).toContainText("Categorie");
  await expect(businessStep).toContainText("Description");
  await expect(businessStep).toContainText("Site web");
  await expect(businessStep.getByText("Present")).toHaveCount(4);

  expect(consoleErrors).toEqual([]);
});
