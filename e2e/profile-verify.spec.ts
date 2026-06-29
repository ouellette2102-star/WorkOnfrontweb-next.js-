import type { BrowserContext, Page } from "@playwright/test";
import type { VerificationStatus } from "@/lib/api-client";
import { auditA11y } from "./fixtures/a11y";
import { expect, test } from "./fixtures/console";

const USER = {
  id: "u_e2e_verify",
  email: "verify.e2e@workon.test",
  firstName: "Alex",
  lastName: "Confiance",
  phone: "+15145550100",
  city: "Montreal",
  pictureUrl: null,
  role: "worker",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
  businessName: "Gestion Atlas",
  businessCategory: "Entretien",
  businessDescription: "Services locaux fiables pour immeubles et commerces.",
  businessWebsite: null,
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

function baseVerificationStatus(): VerificationStatus {
  return {
    phone: { verified: false, verifiedAt: null },
    identity: { status: "NOT_STARTED", verifiedAt: null, provider: null },
    bank: { verified: false, verifiedAt: null, hasStripeAccount: false },
    trustTier: "BASIC",
    trustTierUpdatedAt: null,
  };
}

test("centre de confiance : SMS, OTP, identite et infos de cie", async ({
  page,
  context,
  consoleErrors,
}) => {
  test.setTimeout(120_000);
  await setupAuth(page, context);

  let verificationStatus = baseVerificationStatus();
  let phoneStarted = false;
  let otpConfirmed = false;
  let identityStarted = false;

  await page.route("**/api/workon/identity/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(verificationStatus),
    }),
  );

  await page.route("**/api/workon/identity/verify/phone", (route) => {
    phoneStarted = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sent: true, expiresInSeconds: 300 }),
    });
  });

  await page.route("**/api/workon/identity/verify/phone/confirm", async (route) => {
    const body = route.request().postDataJSON() as { code?: string };
    expect(body.code).toBe("123456");
    otpConfirmed = true;
    verificationStatus = {
      ...verificationStatus,
      phone: {
        verified: true,
        verifiedAt: "2026-06-29T12:00:00.000Z",
      },
      trustTier: "VERIFIED",
      trustTierUpdatedAt: "2026-06-29T12:00:00.000Z",
    };

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ verified: true, trustTier: "VERIFIED" }),
    });
  });

  await page.route("**/api/workon/identity/verify/id/start", (route) => {
    identityStarted = true;
    verificationStatus = {
      ...verificationStatus,
      identity: {
        status: "PENDING",
        verifiedAt: null,
        provider: "stripe",
      },
    };

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "PENDING",
        provider: "stripe",
        sessionUrl: null,
        message: "Verification soumise pour le test.",
      }),
    });
  });

  await page.goto("/profile/verify");

  await expect(page.getByTestId("profile-verify-page")).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole("heading", { name: "Verification d'identite" }),
  ).toBeVisible();
  await expect(page.getByText("Centre de confiance")).toBeVisible();
  await expect(page.getByTestId("verify-business-step")).toContainText(
    "Infos de cie",
  );
  await expect(page.getByTestId("verify-business-step")).toContainText("3/4");
  await expect(page.getByTestId("verify-business-open")).toHaveAttribute(
    "href",
    "/profile",
  );
  await expect(page.getByTestId("verify-next-action")).toContainText(
    "Commence par confirmer ton numero",
  );

  await page.getByTestId("verify-phone-send").click();
  await expect(page.getByTestId("verify-phone-code")).toBeVisible();
  await page.getByTestId("verify-phone-code").fill("123456");
  await page.getByTestId("verify-phone-confirm").click();

  await expect(page.getByTestId("verify-phone-step")).toContainText(
    "Ton telephone est confirme",
  );
  await expect(page.getByTestId("verify-next-action")).toContainText(
    "Ajoute une preuve officielle",
  );

  await page.getByTestId("verify-identity-start").click();
  await expect(page.getByTestId("verify-identity-step")).toContainText(
    "En cours",
  );
  await expect(page.getByTestId("verify-bank-open")).toHaveAttribute(
    "href",
    "/worker/payments",
  );

  await auditA11y(page, "/profile/verify", ["color-contrast"]);

  expect(phoneStarted).toBe(true);
  expect(otpConfirmed).toBe(true);
  expect(identityStarted).toBe(true);
  expect(consoleErrors).toEqual([]);
});
