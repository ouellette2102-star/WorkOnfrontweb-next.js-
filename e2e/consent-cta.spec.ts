import { test, expect } from "./fixtures/console";

/**
 * T4 — Le bandeau de consentement (`fixed bottom-0 z-9999`) ne doit PAS
 * recouvrir le CTA d'une page. Régression révélée par l'E2E F1 (le bandeau
 * interceptait le clic « Publier »). Le fix réserve sa hauteur en bas de
 * page (`body.paddingBottom`).
 *
 * Page publique (`/publier-besoin`) — pas d'auth. On NE pose PAS
 * `cookie-consent` → le bandeau s'affiche.
 */
test("consent : le bandeau ne recouvre pas le CTA de /publier-besoin", async ({
  page,
  consoleErrors,
}) => {
  await page.goto("/publier-besoin");

  const banner = page.getByRole("dialog", { name: /Consentement aux cookies/i });
  await expect(banner).toBeVisible();

  const band = await banner.boundingBox();
  expect(band).not.toBeNull();

  // INVARIANT RÉEL du fix (cookie-consent.tsx : body.paddingBottom = hauteur
  // du bandeau). On l'assert DIRECTEMENT — une comparaison de positions
  // qu'un <p> en fin de form pourrait satisfaire SANS le fix ne suffit pas.
  // Sans le fix, paddingBottom = 0 → échec.
  const pad = await page.evaluate(
    () => parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
  );
  expect(pad).toBeGreaterThanOrEqual(band!.height - 2);

  // Conséquence : le formulaire ENTIER (pas juste le bouton) ne passe pas
  // sous le bandeau, même scrollé au plus bas.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const form = await page.locator("form").boundingBox();
  expect(form).not.toBeNull();
  expect(form!.y + form!.height).toBeLessThanOrEqual(band!.y + 1);

  expect(consoleErrors).toEqual([]);
});
