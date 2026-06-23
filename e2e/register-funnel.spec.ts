import { test, expect } from "@playwright/test";

/**
 * F2 — Inscription : preuve happy-path bout-en-bout, RÉSEAU MOCKÉ.
 *
 * Pilote le VRAI formulaire multi-étapes `/register` (credentials → rôle →
 * profil) et respecte sa logique réelle :
 *   - POST `/api/auth/register` (le proxy d'auth) avec le bon RegisterDto ;
 *   - le gate de consentement (`/compliance/versions` + `/compliance/status`)
 *     qui décide d'ouvrir la modale ou de passer à l'écran de succès ;
 *   - l'écran final « Votre profil est prêt ! » qui n'apparaît que si
 *     `user` est bien hydraté par la réponse register.
 *
 * Toutes les routes sont interceptées → aucun compte réel n'est créé,
 * ni la prod ni le backend ne sont touchés.
 */
test("inscription worker : 3 étapes → écran « profil prêt »", async ({
  page,
}) => {
  let registerPayload: Record<string, unknown> | null = null;

  // 1. Register proxy → user + tokens factices (storeAuth les pose en
  //    localStorage, register() renvoie { user }, l'app passe au gate).
  await page.route("**/api/auth/register", async (route) => {
    registerPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "u_e2e_test",
          email: (registerPayload as { email?: string })?.email,
          firstName: "Alex",
          lastName: "Tremblay",
          role: "worker",
          city: "Montréal",
        },
        accessToken: "e2e_fake_token",
        refreshToken: "e2e_fake_refresh",
      }),
    });
  });

  // 2. Gate de consentement → versions actives + statut COMPLET, ce qui
  //    fait passer directement à l'étape 4 (la modale ne s'ouvre pas).
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

  // 3. /api/auth/me → 401 (pas de session) pour rester hermétique.
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
  );

  // Le bandeau cookies (z-9999) recouvre les CTA → pré-accepté.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  });

  await page.goto("/register");

  // ── Étape 1 — credentials ──────────────────────────────
  await page.getByPlaceholder("votre@email.com").fill("alex.e2e@workon.test");
  await page.getByPlaceholder("Minimum 8 caractères").fill("Test1234!");
  await page.getByRole("button", { name: /^Continuer$/ }).click();

  // ── Étape 2 — rôle worker ──────────────────────────────
  await page.getByRole("button", { name: /Trouver des missions/ }).click();

  // ── Étape 3 — profil (téléphone facultatif pour un worker) ──
  await page.getByPlaceholder("Prénom").fill("Alex");
  await page.getByPlaceholder("Nom", { exact: true }).fill("Tremblay");
  await page.getByPlaceholder("Montréal").fill("Montréal");
  await page
    .getByRole("button", { name: /Finaliser mon inscription/ })
    .click();

  // ── Étape 4 — succès (n'apparaît que si user est hydraté) ──
  await expect(
    page.getByRole("heading", { name: /Votre profil est prêt/ }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Alex Tremblay/)).toBeVisible();

  // Contrat de payload — aligné sur RegisterDto backend.
  expect(registerPayload).toMatchObject({
    email: "alex.e2e@workon.test",
    role: "worker",
    firstName: "Alex",
    lastName: "Tremblay",
    city: "Montréal",
  });
});
