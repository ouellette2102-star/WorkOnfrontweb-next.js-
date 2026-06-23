import { test, expect } from "@playwright/test";

/**
 * F1 — /publier-besoin : preuve happy-path bout-en-bout, RÉSEAU MOCKÉ.
 *
 * Prouve, sans créer aucune donnée réelle :
 *   1. le formulaire collecte et envoie le bon payload au proxy
 *      navigateur `/api/workon/public/missions` (= chemin réel du form) ;
 *   2. le contrat correspond au DTO backend (champs requis) ;
 *   3. la soumission valide affiche l'écran « Demande reçue ! » avec le
 *      titre entre guillemets français « … ».
 *
 * La route est interceptée et résolue avec un 201 factice → la prod /
 * le backend ne sont jamais touchés (pas de mission seed).
 */
test("publier-besoin : soumission valide → écran de confirmation", async ({
  page,
}) => {
  // Le serveur dev en CI compile la route à froid → laisser de la marge.
  test.setTimeout(120_000);

  let captured: Record<string, unknown> | null = null;

  await page.route("**/api/workon/public/missions", async (route) => {
    captured = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "lm_test_e2e",
        title: (captured as { title?: string })?.title,
        city: (captured as { city?: string })?.city,
      }),
    });
  });

  // Le bandeau de consentement cookies (z-9999) recouvre la page et bloque
  // les clics → on pré-accepte via localStorage avant le rendu.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  });

  await page.goto("/publier-besoin", { timeout: 90_000 });

  await page.getByPlaceholder("Jean Tremblay").fill("Jean Tremblay");
  await page.getByPlaceholder("514-555-0100").fill("514-555-0100");
  await page
    .getByPlaceholder("Ex: Peinture intérieure 3 pièces")
    .fill("Peinture salon");
  await page
    .getByPlaceholder(/Décrivez le travail/)
    .fill("Repeindre le salon, ~200 pi², matériaux fournis.");
  await page.getByRole("button", { name: /Peinture/ }).click();
  await page.getByPlaceholder("500").fill("500");
  await page.getByPlaceholder("Montréal").fill("Montréal");

  await page.locator('button[type="submit"]').click();

  // Écran de confirmation
  await expect(page.getByText("Demande reçue !")).toBeVisible();
  await expect(page.getByText(/«\s*Peinture salon\s*»/)).toBeVisible();

  // Contrat de payload (aligné sur CreatePublicMissionDto backend)
  expect(captured).toMatchObject({
    title: "Peinture salon",
    category: "painting",
    city: "Montréal",
    budget: 500,
    clientName: "Jean Tremblay",
    clientPhone: "514-555-0100",
    source: "landing_public",
  });
});
