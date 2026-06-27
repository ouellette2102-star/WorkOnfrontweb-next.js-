import { test } from "@playwright/test";
import { auditA11y } from "./fixtures/a11y";

/**
 * T3 — Gate a11y runtime (axe-core) sur la page P0 publique /publier-besoin.
 *
 * Garde RÉELLE : `auditA11y` SANS baseline échoue sur toute violation
 * `critical` OU `serious`. La page est à 0 violation (corrigée #301/#302) ;
 * reverter un fix de contraste/aria réintroduirait une violation `serious`
 * et ferait échouer la CI — c'est ce qui rend les fixes réellement gardés.
 *
 * Complète le filet statique eslint-plugin-jsx-a11y et la grille humaine
 * design:accessibility-review.
 */
test("a11y : /publier-besoin sans violation axe (critical/serious)", async ({
  page,
}) => {
  // Pré-accepter le consentement → axe analyse le contenu, pas le bandeau.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  });
  await page.goto("/publier-besoin");
  await page.getByRole("heading").first().waitFor({ timeout: 15_000 });

  await auditA11y(page, "/publier-besoin");
});
