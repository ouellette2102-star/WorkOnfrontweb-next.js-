import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // QA report cleanup: forbid stray console.log / console.debug in
  // committed code. console.warn and console.error are still allowed
  // because they are routed to Sentry in production.
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // Filet a11y statique (absent jusqu'ici ; eslint-config-next ne bundle plus
  // jsx-a11y sur Next 16). Règles recommandées passées en WARN → surfacent les
  // problèmes (boutons-icône sans aria-label, labels manquants, div cliquables)
  // dans `npm run lint` sans bloquer le CI. À durcir en error au fil des fixes.
  {
    // Le plugin jsx-a11y est déjà enregistré par eslint-config-next → on
    // surcharge seulement les sévérités (recommandé → warn), sans le
    // ré-enregistrer (« Cannot redefine plugin »).
    rules: Object.fromEntries(
      Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule, val]) => [
        rule,
        Array.isArray(val) ? ["warn", ...val.slice(1)] : "warn",
      ]),
    ),
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // QA: route handlers and tests legitimately log to stdout/CI.
    "src/app/api/**",
    "e2e/**",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
  ]),
]);

export default eslintConfig;
