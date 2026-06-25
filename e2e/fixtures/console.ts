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
// Bruit attendu : tuiles externes + appels best-effort du shell (app) qui
// échouent quand leur backend n'est pas mocké (device-registration, etc.) —
// jamais lié à la page testée.
const IGNORE = [
  /cartocdn/i,
  /openstreetmap/i,
  /\btile\b/i,
  /favicon/i,
  /ERR_/,
  /\[device-registration\]/i,
  /Backend WorkOn indisponible/i,
  // Artefacts d'env / réseau du contexte mocké (pas des défauts de la page) :
  /Permissions policy violation/i, // géoloc bloquée par la policy navigateur en CI
  /Failed to load resource/i, // appels best-effort non mockés → 5xx réseau
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
