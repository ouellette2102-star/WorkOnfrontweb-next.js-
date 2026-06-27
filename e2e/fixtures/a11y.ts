import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Audit a11y runtime (axe-core) réutilisable sur une page déjà rendue.
 * Logue TOUTES les violations, et ÉCHOUE sur toute violation `critical` ou
 * `serious` dont l'id n'est PAS dans `baseline` (dette a11y connue, tolérée).
 *
 * → Page à 0 violation (baseline vide) = garde TOUT : reverter un fix de
 *   contraste/aria réintroduit une violation `serious` → la CI échoue.
 * → Page avec dette connue = tolère ses ids baselinés mais échoue sur toute
 *   NOUVELLE violation (nouveau type, ou `critical`).
 *
 * WCAG 2.0 A/AA + 2.1 AA. Appeler après que le contenu principal est visible.
 */
export async function auditA11y(
  page: Page,
  label: string,
  baseline: string[] = [],
): Promise<void> {
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  console.log(
    `[A11Y] ${label}:`,
    res.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(" · ") ||
      "aucune violation",
  );
  const blocking = res.violations.filter(
    (v) =>
      (v.impact === "critical" || v.impact === "serious") &&
      !baseline.includes(v.id),
  );
  expect(
    blocking,
    `Violations a11y bloquantes (${label}) : ${blocking
      .map((v) => `${v.impact}:${v.id}`)
      .join(", ")} — hors baseline [${baseline.join(", ")}]`,
  ).toEqual([]);
}
