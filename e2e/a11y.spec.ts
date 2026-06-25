import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * T3 — Gate a11y runtime (axe-core) sur une page P0 publique.
 *
 * Transforme l'audit a11y subjectif en garde CI objective : contraste,
 * labels, rôles, IDs dupliqués (WCAG 2.0 A/AA + 2.1 AA). Échoue sur les
 * violations `critical` (vrais bloquants), logue toutes les violations
 * pour l'audit (serious/moderate à traiter ensuite, côté goût/priorité).
 *
 * Complète le filet STATIQUE eslint-plugin-jsx-a11y (warn) et la grille
 * HUMAINE design:accessibility-review.
 */
test("a11y : /publier-besoin sans violation axe critique", async ({ page }) => {
  // Pré-accepter le consentement → axe analyse le contenu, pas le bandeau.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  });
  await page.goto("/publier-besoin");
  await page.getByRole("heading").first().waitFor({ timeout: 15_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  // Audit : toutes les violations (info) — fixées par priorité ensuite.
  console.log(
    "[A11Y] /publier-besoin:",
    results.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(" · ") ||
      "aucune violation",
  );

  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(
    critical,
    `Violations critiques axe : ${critical.map((v) => v.id).join(", ")}`,
  ).toEqual([]);
});
