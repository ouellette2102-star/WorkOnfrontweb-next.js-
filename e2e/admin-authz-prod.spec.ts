/**
 * F5 — Autorisation backend des endpoints admin (PREUVE D'INTÉGRATION RÉELLE).
 *
 * Le gating de /admin côté frontend (worker → « Accès refusé ») est déjà
 * prouvé en E2E mocké (e2e/admin-role-gate.spec.ts). Mais un gate purement
 * client ne protège RIEN : un attaquant tape l'API directement. Ce spec
 * prouve, contre le VRAI backend de prod (aucun mock), que la garde
 * d'autorisation existe et rejette les requêtes non/mal authentifiées.
 *
 * Non-destructeur : la garde d'auth s'exécute AVANT toute logique métier,
 * donc même l'appel POST (reconcile) est rejeté sans rien réconcilier.
 * Aucune donnée n'est créée. Pur HTTP (pas de navigateur).
 *
 * Tourne en nightly (.github/workflows/nightly-prod-smoke.yml), pas en
 * CI per-PR : il dépend de la prod réelle, on ne veut pas rougir les PRs
 * si Railway a un hoquet.
 */
import { test, expect } from "@playwright/test";

const API_BASE =
  process.env.API_BASE ??
  "https://workon-backend-production-8908.up.railway.app/api/v1";

// Endpoint admin idempotent (lecture seule) servant de sonde.
const ADMIN_PROBE = `${API_BASE}/admin/verify-express/queue`;

test.describe("F5 — autorisation backend admin (prod réel, non mocké)", () => {
  test("endpoint admin SANS token → 401 UNAUTHORIZED", async ({ request }) => {
    const res = await request.get(ADMIN_PROBE);
    expect(
      res.status(),
      "un endpoint admin doit exiger une authentification",
    ).toBe(401);
    const body = await res.json().catch(() => ({}));
    // Enveloppe d'erreur standard du backend WorkOn.
    expect(body?.error?.code).toBe("UNAUTHORIZED");
  });

  test("endpoint admin avec token BIDON → 401 (validation du JWT)", async ({
    request,
  }) => {
    const res = await request.get(ADMIN_PROBE, {
      headers: { Authorization: "Bearer not-a-real.jwt.token" },
    });
    expect(
      res.status(),
      "un token invalide ne doit jamais ouvrir l'admin",
    ).toBe(401);
  });

  test("contrôle: endpoint PUBLIC → 2xx (le 401 admin n'est pas un backend down)", async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/public/stats`);
    expect(
      res.status(),
      "le backend doit être joignable — sinon le 401 ci-dessus ne prouve rien",
    ).toBeLessThan(300);
  });
});
