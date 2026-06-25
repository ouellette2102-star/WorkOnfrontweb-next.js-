import { test, expect } from "@playwright/test";

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
}) => {
  await page.goto("/publier-besoin");

  const banner = page.getByRole("dialog", { name: /Consentement aux cookies/i });
  await expect(banner).toBeVisible();

  const submit = page.locator('button[type="submit"]');
  await expect(submit).toBeVisible();

  // Aller au plus bas de la page : la position la plus défavorable.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);

  const cta = await submit.boundingBox();
  const band = await banner.boundingBox();
  expect(cta).not.toBeNull();
  expect(band).not.toBeNull();

  // Le bas du CTA est au-dessus (ou au niveau) du haut du bandeau → pas de
  // recouvrement. Sans le fix, le CTA passerait SOUS le bandeau fixe.
  expect(cta!.y + cta!.height).toBeLessThanOrEqual(band!.y + 1);
});
