import { test, expect } from "@playwright/test";
import { auditA11y } from "./fixtures/a11y";

/**
 * F3 — Création de mission : preuve happy-path bout-en-bout, RÉSEAU MOCKÉ.
 *
 * Pilote le VRAI formulaire `/missions/new` (sous le gate `(app)`) et
 * respecte sa logique réelle :
 *   - gate SERVEUR `(app)/layout.tsx` : présence du cookie `workon_token`
 *     (sinon `redirect("/login")` côté serveur) → on pose un cookie fixture ;
 *   - gate CLIENT `_app-shell` : `isAuthenticated` → on hydrate un user en
 *     localStorage + JWT factice (sub/role) + on mocke `/api/auth/me` ;
 *   - `getCurrentLocation()` : géoloc forcée (déterministe) ;
 *   - `POST /missions-local` (proxy `/api/workon/missions-local`) avec le
 *     contrat attendu ;
 *   - l'écran de succès « Mission créée avec succès ! ».
 *
 * Aucune donnée réelle : cookie/token factices + toutes les routes mockées.
 */
const USER = {
  id: "u_e2e_employer",
  email: "employer.e2e@workon.test",
  firstName: "Sam",
  lastName: "Patron",
  role: "employer",
  city: "Montréal",
  // Employeur onboardé → passe le guard T44 de /missions/new (sinon
  // redirection vers /onboarding/employer).
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
};

test("création mission : formulaire rempli → écran de succès", async ({
  page,
  context,
}) => {
  let missionPayload: Record<string, unknown> | null = null;

  // JWT factice (sub/role) — réutilisé pour le refresh mocké.
  const jwt = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const fakeJwt = `${jwt({ alg: "HS256", typ: "JWT" })}.${jwt({
    sub: USER.id,
    role: USER.role,
  })}.sig`;

  // Gate SERVEUR : (app)/layout vérifie la simple présence du cookie.
  await context.addCookies([
    {
      name: "workon_token",
      value: "e2e_fixture_token",
      domain: "localhost",
      path: "/",
    },
  ]);

  // Gate CLIENT : user hydraté + JWT factice {sub, role} qui matche (évite
  // le refresh) + géoloc déterministe + cookies acceptés, avant tout script.
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
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: {
              latitude: 45.5017,
              longitude: -73.5673,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: 0,
          } as GeolocationPosition),
        watchPosition: () => 0,
        clearWatch: () => {},
      },
    });
  }, USER);

  // /api/auth/me → renvoie le user (le client AppShell confirme isAuthenticated).
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(USER),
    }),
  );

  // Les appels best-effort du shell (app) (devices, reviews…) tapent le
  // vrai backend avec un token factice → 401 → apiFetch tente un refresh.
  // On mocke le refresh pour qu'il RÉUSSISSE : sinon `refreshToken()` émet
  // `session-expired` → redirection /login.
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: USER, accessToken: fakeJwt }),
    }),
  );

  // Gate de consentement légal (ConsentProvider du shell app) → statut
  // COMPLET pour que la modale « J'accepte les conditions » ne s'ouvre pas.
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

  // Reverse-geocode externe (best-effort, auto-remplit la ville) → mocké
  // pour rester hermétique et déterministe.
  await page.route("**nominatim.openstreetmap.org/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ address: { city: "Montréal" } }),
    }),
  );

  // POST mission → 201 factice (la prod/backend ne sont jamais touchés).
  await page.route("**/api/workon/missions-local", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    missionPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "lm_e2e_test",
        title: (missionPayload as { title?: string })?.title,
        status: "open",
      }),
    });
  });

  await page.goto("/missions/new");

  // Le formulaire ne s'affiche que si les deux gates (serveur + client) passent.
  const title = page.getByPlaceholder(
    "Ex: Réparation de plomberie salle de bain",
  );
  await expect(title).toBeVisible({ timeout: 15_000 });

  await auditA11y(page, "F3 mission-create/formulaire");

  await title.fill("Peinture du salon");
  await page
    .getByPlaceholder(/Décrivez le travail/)
    .fill("Repeindre le salon (~200 pi²), 2 couches, matériel fourni.");
  // Catégorie = boutons qui pilotent un input caché register("category").
  await page.getByRole("button", { name: /Peinture/ }).click();
  await page.getByPlaceholder("Montréal").fill("Montréal");
  await page.getByPlaceholder("50").fill("450");

  await page.getByRole("button", { name: /Publier la mission/ }).click();

  // Succès → la page navigue vers le détail de la mission (?created=1).
  await page.waitForURL(/\/missions\/lm_e2e_test/, { timeout: 15_000 });

  // Contrat de payload — aligné sur api.createMission → POST /missions-local.
  expect(missionPayload).toMatchObject({
    title: "Peinture du salon",
    category: "painting",
    city: "Montréal",
    price: 450,
    latitude: 45.5017,
    longitude: -73.5673,
  });
});
