import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

// Règles jsx-a11y DÉJÀ configurées par eslint-config-next/core-web-vitals —
// à NE PAS réécrire (sinon on dégrade leurs options, ex. alt-text qui couvre
// next/Image via { img: ["Image"] }).
const NEXT_JSX_A11Y_RULES = new Set([
  "jsx-a11y/alt-text",
  "jsx-a11y/aria-props",
  "jsx-a11y/aria-proptypes",
  "jsx-a11y/aria-unsupported-elements",
  "jsx-a11y/role-has-required-aria-props",
  "jsx-a11y/role-supports-aria-props",
]);

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
  // Filet a11y statique. eslint-config-next/core-web-vitals enregistre DÉJÀ le
  // plugin jsx-a11y + 6 règles (cf. NEXT_JSX_A11Y_RULES). Ici on AJOUTE le
  // RESTE du recommended en WARN, en laissant intactes ces 6 (sinon on perd
  // leurs options, ex. alt-text/next-Image). Le plugin n'est pas ré-enregistré
  // (« Cannot redefine plugin »). Non bloquant (warn) — filet informatif ;
  // à durcir en error au fil des fixes.
  {
    rules: Object.fromEntries(
      Object.entries(jsxA11y.flatConfigs.recommended.rules)
        .filter(([rule]) => !NEXT_JSX_A11Y_RULES.has(rule))
        .map(([rule, val]) => [
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
