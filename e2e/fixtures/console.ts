import { test as base, expect } from "@playwright/test";

/**
 * Fixture « 0 erreur console » — Playwright n'a pas de flag natif pour
 * échouer sur une erreur console. ~15 lignes plus sûres qu'une dépendance
 * non maintenue. Collecte les `console.error` ET les `pageerror` (crashs
 * JS non catchés — c'est exactement ce qui a fait planter F4 en silence).
 *
 * Usage : `import { test, expect } from "./fixtures/console"` puis, à la
 * fin du test, `expect(consoleErrors).toEqual([])`.
 *
 * `IGNORE` filtre le bruit réseau attendu (tuiles carto, favicon) pour ne
 * garder que les vraies erreurs applicatives.
 */
// Bruit d'ENVIRONNEMENT / réseau navigateur (jamais une erreur applicative de
// la page) : tuiles externes, favicon, géoloc bloquée par la policy CI, log
// best-effort [device-registration], et le message GÉNÉRIQUE « Failed to load
// resource » (émis par le navigateur pour les appels best-effort non mockés —
// pas de backend en CI mockée).
// LIMITE ASSUMÉE : un 5xx sur un endpoint critique passerait via ce message
// générique. Mitigé car (a) chaque spec mocke explicitement ses endpoints
// critiques (200) — un 500 inattendu y serait visible ; (b) toute erreur que
// le CODE logue (console.error) ou tout crash non catché (pageerror) n'est
// PAS filtré → les vrais bugs (ex. crash F4) échouent bien.
const IGNORE = [
  /cartocdn/i,
  /openstreetmap/i,
  /\btile\b/i,
  /favicon/i,
  /Permissions policy violation/i,
  /\[device-registration\]/i,
  /Failed to load resource/i,
];

// NB: la fixture garde sa valeur — les vrais crashs app (ex. F4
// « Cannot read properties of undefined ») arrivent en `pageerror` avec un
// message spécifique, jamais filtré.

export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORE.some((re) => re.test(text))) return;
      errors.push(text);
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    await use(errors);
  },
});

export { expect };
