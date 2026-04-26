/**
 * E2E proof for Phase 3 — Navigation contractualisée (#10 #11).
 *
 * Verifies the new nav contract on a live worker session:
 *   - Bottom-nav FAB in PRO mode → label "Missions", links to /missions
 *     (the open-mission feed). Old behaviour pointed at /missions/mine
 *     (a passive list view, the "no action" symptom of #10).
 *   - Bottom-nav FAB in CLIENT mode → label "Publier", links to
 *     /missions/new. Unchanged but exercised here as regression guard.
 *   - Hamburger contains "Mes affectations" → /missions/mine in Pro
 *     mode, and "Mes publications" → /missions/mine in Client mode.
 *     Both come from the same route — the page filters by JWT user.
 *     This proves #11 ("Mes affectations" moved out of the FAB slot).
 *
 * Mode toggle via the top-bar pill — same code path the user clicks.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_BASE =
  process.env.API_BASE ??
  "https://workon-backend-production-8908.up.railway.app/api/v1";

test.setTimeout(45_000);

test.describe("Phase 3 — navigation contract (#10 #11)", () => {
  test("FAB is an action; Mes affectations lives in the hamburger", async ({
    page,
  }) => {
    // ── 1. Register a fresh worker ──────────────────────────
    const ts = Date.now();
    const email = `phase3-${ts}@workon.test`;
    const password = "Test1234!";
    const reg = await page.request.post(`${API_BASE}/auth/register`, {
      data: {
        email,
        password,
        firstName: "Phase3",
        lastName: "Worker",
        role: "worker",
      },
    });
    expect(reg.ok(), "register").toBe(true);

    // ── 2. Authenticate the browser session ─────────────────
    await page.goto(`${BASE_URL}/`);
    const login = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email, password },
    });
    expect(login.status()).toBe(200);
    const lb = await login.json();
    await page.evaluate(
      ({ token, refresh, user }) => {
        localStorage.setItem("workon_access_token", token);
        if (refresh) localStorage.setItem("workon_refresh_token", refresh);
        if (user) localStorage.setItem("workon_user", JSON.stringify(user));
        // Force pro mode so the test is deterministic — defaultMode reads
        // user.role and a worker lands on "pro" anyway, but we set it
        // explicitly to guarantee the assertion below.
        localStorage.setItem("workon_mode", "pro");
      },
      { token: lb.accessToken, refresh: lb.refreshToken, user: lb.user },
    );

    // ── 3. /home → assert the contract on the bottom-nav FAB ─
    await page.goto(`${BASE_URL}/home`, { waitUntil: "domcontentloaded" });

    // Pro FAB id = `nav-fab-pro` (data-testid set by bottom-nav.tsx).
    // The Link only contains the icon; the visible label sits in a
    // sibling <span>, so we assert href on the link and the label on
    // its parent container.
    const proFab = page.getByTestId("nav-fab-pro");
    await expect(proFab).toBeVisible({ timeout: 10_000 });
    await expect(proFab).toHaveAttribute("href", "/missions");
    const proFabBlock = proFab.locator("..");
    await expect(proFabBlock).toContainText("Missions");

    // ── 4. Open the hamburger; assert "Mes affectations" present
    //         and points at /missions/mine ─────────────────────
    await page.getByRole("button", { name: /^Menu$/i }).click();
    const affectationsLink = page.getByRole("link", {
      name: /Mes affectations/i,
    });
    await expect(affectationsLink).toBeVisible({ timeout: 5_000 });
    await expect(affectationsLink).toHaveAttribute("href", "/missions/mine");

    // ── 5. Switch to client mode via the hamburger toggle and
    //         re-check the FAB contract ───────────────────────
    await page.getByRole("button", { name: /^Client$/ }).click();
    // setMode is async (touches localStorage + a /users/me PATCH).
    // Wait for the FAB swap to confirm the mode landed before we
    // re-open the hamburger.
    const clientFab = page.getByTestId("nav-fab-client");
    await expect(clientFab).toBeVisible({ timeout: 10_000 });
    await expect(clientFab).toHaveAttribute("href", "/missions/new");
    await expect(clientFab.locator("..")).toContainText("Publier");
    // The pro FAB must be gone now.
    await expect(page.getByTestId("nav-fab-pro")).toHaveCount(0);

    // ── 6. Hamburger in client mode shows "Mes publications"
    //         and not "Mes affectations" ──────────────────────
    // Mode switch closes the menu via the setMenuOpen(false) effect
    // bound to navigation. Re-open it explicitly.
    const menuToggle = page.getByRole("button", { name: /^Menu$/i });
    if (
      await page
        .getByRole("link", { name: /Mes publications/i })
        .count()
        .then((n) => n === 0)
    ) {
      await menuToggle.click();
    }
    const publicationsLink = page.getByRole("link", {
      name: /Mes publications/i,
    });
    await expect(publicationsLink).toBeVisible({ timeout: 8_000 });
    await expect(publicationsLink).toHaveAttribute("href", "/missions/mine");
    // And the pro-only "Mes affectations" must be gone in client mode.
    await expect(
      page.getByRole("link", { name: /Mes affectations/i }),
    ).toHaveCount(0);
  });
});
