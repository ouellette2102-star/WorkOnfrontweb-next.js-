import { test, expect } from "./fixtures/console";
import { auditA11y } from "./fixtures/a11y";
import type { Page, BrowserContext } from "@playwright/test";

/**
 * T1 — `/map` (Leaflet) : preuve de rendu, RÉSEAU MOCKÉ, route gated `(app)`.
 *
 * Prouve, sans backend ni tuiles réelles :
 *   - la carte monte (`.leaflet-container`) ;
 *   - les pins missions s'affichent (`.leaflet-marker-icon`, 1 par mission —
 *     `mission-map.tsx` les crée en Leaflet impératif via `L.marker` + divIcon
 *     `mission-pin-shell`/`mission-pin-marker`) ;
 *   - **0 erreur console** (fixture) — le filet qui aurait attrapé le crash F4.
 */
const USER = {
  id: "u_e2e_worker",
  email: "worker.e2e@workon.test",
  firstName: "Sam",
  lastName: "Travailleur",
  role: "worker",
  city: "Montréal",
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
};

// 1×1 PNG transparent — sert toutes les tuiles cartocdn (zéro erreur réseau).
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

// Shape alignée sur MissionMapItem (le composant DÉRIVE displayLat/Lng depuis
// latitude/longitude — cf. mission-map.tsx). `extra` injecte boostedUntil /
// urgentUntil pour exercer la branche « pin prioritaire » (isBoosted).
function pin(
  id: string,
  lat: number,
  lng: number,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    title: `Mission ${id}`,
    category: "painting",
    latitude: lat,
    longitude: lng,
    status: "open",
    price: 120,
    city: "Montréal",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...extra,
  };
}
const MISSIONS = [
  pin("m1", 45.5017, -73.5673),
  pin("m2", 45.515, -73.56),
  // Pin prioritaire : boostedUntil futur → isBoosted() vrai → classe
  // `is-priority` (branche que toHaveCount seul ne couvrait pas).
  pin("m3", 45.53, -73.55, { boostedUntil: "2030-01-01T00:00:00.000Z" }),
];

async function setupAuth(page: Page, context: BrowserContext) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const fakeJwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER.id, role: USER.role })}.sig`;
  await context.addCookies([
    { name: "workon_token", value: "e2e_fixture", domain: "localhost", path: "/" },
  ]);
  await page.addInitScript((user) => {
    try {
      const b = (o: unknown) =>
        btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const token = `${b({ alg: "HS256", typ: "JWT" })}.${b({ sub: user.id, role: user.role })}.sig`;
      localStorage.setItem("workon_user", JSON.stringify(user));
      localStorage.setItem("workon_access_token", token);
      localStorage.setItem("workon_refresh_token", "e2e_fake_refresh");
      localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  }, USER);

  // Mocke l'appel best-effort device-registration (POST /devices) — sinon il
  // tape le backend absent. Mock CIBLÉ (pas un catch-all : un catch-all 200 {}
  // casse les calls shell qui attendent une vraie shape).
  await page.route("**/api/workon/devices", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "dev_e2e", deviceId: "e2e", platform: "web" }),
    }),
  );
  await page.route("**/api/auth/me", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(USER) }),
  );
  await page.route("**/api/auth/refresh", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: USER, accessToken: fakeJwt }),
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
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ isComplete: true, missing: [] }) }),
  );
}

test("carte : /map monte et affiche les pins missions sans erreur console", async ({
  page,
  context,
  consoleErrors,
}) => {
  test.setTimeout(120_000);
  await setupAuth(page, context);

  await page.route("**/api/workon/catalog/categories", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
  );
  await page.route("**/api/workon/missions-local/map**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ missions: MISSIONS, count: MISSIONS.length }),
    }),
  );
  // Tuiles cartocdn → PNG hermétique (sinon erreurs réseau → faux positif console).
  await page.route("**basemaps.cartocdn.com/**", (r) =>
    r.fulfill({ status: 200, contentType: "image/png", body: PNG_1X1 }),
  );

  await page.goto("/map", { timeout: 90_000 });

  // La carte monte…
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 15_000 });
  // …et un pin par mission s'affiche.
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(MISSIONS.length, {
    timeout: 15_000,
  });
  // Le pin boosté exerce la branche prioritaire (classe `is-priority`).
  await expect(page.locator(".mission-pin-marker.is-priority")).toHaveCount(1);

  await auditA11y(page, "/map");

  // Filet : aucune vraie erreur console (bruit tuiles/réseau/env filtré côté fixture).
  expect(consoleErrors).toEqual([]);
});
