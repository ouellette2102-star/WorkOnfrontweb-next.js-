import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Audit a11y runtime (axe-core) réutilisable sur une page déjà rendue.
 * Logue TOUTES les violations (`[A11Y] <label>: …`) pour l'audit, et
 * échoue uniquement sur les violations `critical` (vrais bloquants) — les
 * `serious`/`moderate` sont surfacés sans bloquer le lancement gelé.
 *
 * WCAG 2.0 A/AA + 2.1 AA. Appeler après que le contenu principal de la page
 * est visible.
 */
export async function auditA11y(page: Page, label: string): Promise<void> {
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  console.log(
    `[A11Y] ${label}:`,
    res.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(" · ") ||
      "aucune violation",
  );
  const critical = res.violations.filter((v) => v.impact === "critical");
  expect(
    critical,
    `Violations a11y critiques (${label}) : ${critical.map((v) => v.id).join(", ")}`,
  ).toEqual([]);
}
