import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { auditA11y } from "./fixtures/a11y";

/**
 * F5 — Auth / session / rôles : contrôle d'accès par rôle sur route gated
 * `(app)`. RÉSEAU MOCKÉ (recette mocked-auth) — zéro compte réel.
 *
 * Prouve le gating de `/admin` (`page.tsx` : `if (!user || user.role !==
 * "admin")` → « Accès refusé ») :
 *   - un worker  → « Accès refusé » ;
 *   - un admin   → « Tableau de bord admin ».
 *
 * Le gate est un check client pur sur le rôle hydraté → aucune donnée
 * réelle, aucun backend touché.
 */
function makeUser(role: string) {
  return {
    id: `u_e2e_${role}`,
    email: `${role}.e2e@workon.test`,
    firstName: "Sam",
    lastName: "Test",
    role,
    city: "Montréal",
    onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
  };
}

async function setupAuth(
  page: Page,
  context: BrowserContext,
  user: ReturnType<typeof makeUser>,
) {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const fakeJwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub: user.id,
    role: user.role,
  })}.sig`;

  // Gate SERVEUR : (app)/layout vérifie la présence du cookie.
  await context.addCookies([
    { name: "workon_token", value: "e2e_fixture", domain: "localhost", path: "/" },
  ]);

  // Gate CLIENT : user hydraté + JWT factice {sub,role} + consentement.
  await page.addInitScript((u) => {
    try {
      const b = (o: unknown) =>
        btoa(JSON.stringify(o))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      const token = `${b({ alg: "HS256", typ: "JWT" })}.${b({
        sub: u.id,
        role: u.role,
      })}.sig`;
      localStorage.setItem("workon_user", JSON.stringify(u));
      localStorage.setItem("workon_access_token", token);
      localStorage.setItem("workon_refresh_token", "e2e_fake_refresh");
      localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  }, user);

  await page.route("**/api/auth/me", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
  );
  await page.route("**/api/auth/refresh", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user, accessToken: fakeJwt }),
    }),
  );
  await page.route("**/api/workon/compliance/versions", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ versions: { termsOfService: "1.0", privacyPolicy: "1.0" } }),
    }),
  );
  await page.route("**/api/workon/compliance/status", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isComplete: true, missing: [] }),
    }),
  );
}

test("rôles : un worker est bloqué sur /admin (accès refusé)", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await setupAuth(page, context, makeUser("worker"));
  await page.goto("/admin", { timeout: 90_000 });

  await expect(page.getByText(/Accès refusé/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/réservée aux administrateurs/)).toBeVisible();
  // Et surtout : pas de contenu admin.
  await expect(page.getByText(/Tableau de bord admin/)).toHaveCount(0);
});

test("rôles : un admin accède au tableau de bord /admin", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await setupAuth(page, context, makeUser("admin"));
  await page.goto("/admin", { timeout: 90_000 });

  await expect(page.getByText(/Tableau de bord admin/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Accès refusé/)).toHaveCount(0);

  await auditA11y(page, "F5 admin/dashboard", ["color-contrast"]);
});
