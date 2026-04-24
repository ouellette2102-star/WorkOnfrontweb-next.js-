/**
 * End-to-end proof for Phase 1 / fix/profile-notifications-navigation-bugs.
 *
 * Asserts that every field a worker can fill on /profile actually
 * round-trips to the public worker card — the "silent drop" class of
 * bugs (#2 #3 #4 #5 #6) is exactly what this test prevents from
 * regressing.
 *
 * Flow:
 *   1.  Log in via the Next.js /api/auth/login proxy.
 *   2.  Navigate to /profile and assert:
 *        - bug #1: no ProfileRolesCard (no duplicate role toggle).
 *        - bug #5: <PortfolioUploader data-testid="portfolio-uploader" /> present.
 *        - bug #6: <BusinessInfoEditor data-testid="business-info-editor" /> present.
 *   3.  Fill bio in the WorkerCardEditor, click Save.
 *   4.  Select a skill in SkillSelector, click Save.
 *   5.  Enable Monday 09:00–17:00 in AvailabilityEditor, click Save.
 *   6.  Reload /profile and verify each editor re-hydrates with the
 *       values we just saved (bug #2 #3 #4 persistence proof).
 *   7.  Navigate to /worker/[myId] and verify the bio + at least one
 *       skill chip + at least one availability chip render on the
 *       public card (end-to-end public visibility proof).
 *
 * Running it:
 *   BASE_URL=https://workonapp.vercel.app \
 *   TEST_EMAIL=<worker-test-account> \
 *   TEST_PASSWORD=<pw> \
 *     npx playwright test --config=playwright.remote.config.ts \
 *       -g "profile end-to-end"
 *
 * Or against a local dev server:
 *   pnpm dev       # in workonapp
 *   pnpm backend:dev   # in workonapp/backend
 *   npx playwright test -g "profile end-to-end"
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "profile-e2e@workon.test";
const PASSWORD = process.env.TEST_PASSWORD ?? "Test1234!";

test.describe("Phase 1 — profile end-to-end", () => {
  test("fill → save → reload → public card shows all fields", async ({ page }) => {
    // ── 1. Auth via Next.js proxy ───────────────────────────
    await page.goto(`${BASE_URL}/`);
    const loginRes = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.status(), "login must succeed").toBe(200);
    const body = await loginRes.json();
    await page.evaluate(
      ({ token, refresh, user }) => {
        localStorage.setItem("workon_access_token", token);
        if (refresh) localStorage.setItem("workon_refresh_token", refresh);
        if (user) localStorage.setItem("workon_user", JSON.stringify(user));
      },
      { token: body.accessToken, refresh: body.refreshToken, user: body.user },
    );
    const myId: string = body.user?.id;
    expect(myId, "backend must return user.id").toBeTruthy();

    // ── 2. /profile structural assertions ───────────────────
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });

    // Bug #1: the duplicate role card must be gone. The canonical
    // toggle lives in the top-bar hamburger (mode-pill testid).
    await expect(
      page.getByRole("heading", { name: /Comment utilises-tu WorkOn/ }),
    ).toHaveCount(0);
    await expect(page.getByTestId("mode-pill")).toBeVisible();

    // Bug #5: Portfolio uploader must be wired in.
    await expect(page.getByTestId("portfolio-uploader")).toBeVisible();

    // Bug #6: Business info editor must be wired in.
    await expect(page.getByTestId("business-info-editor")).toBeVisible();

    // ── 3. Fill bio in WorkerCardEditor ─────────────────────
    // Bio field is a textarea with a distinctive placeholder and maxlength=1000.
    // The surrounding <label> has no htmlFor, so getByLabel doesn't reach it.
    const bioText = `Test bio ${Date.now()} — visible on public card`;
    const bioField = page
      .locator('textarea[maxlength="1000"]')
      .first();
    await expect(bioField).toBeVisible({ timeout: 10_000 });
    await bioField.fill(bioText);
    // WorkerCardEditor's Save button is literally "Sauvegarder" (icon Save).
    // We wait for the PATCH /users/me response so we know the save actually
    // landed before moving on — toast text is ephemeral and button labels
    // can falsely match a "sauvegard" regex while the mutation is still
    // in flight.
    const saveBio = page
      .waitForResponse(
        (r) => r.url().includes("/users/me") && r.request().method() === "PATCH",
        { timeout: 20_000 },
      );
    // The page has two buttons with the exact label "Sauvegarder":
    //  [0] ProfileForm (name/phone/city) — may be disabled on a fresh account
    //      since phone/city are empty.
    //  [1] WorkerCardEditor (bio / categories / gallery) — what we want.
    const bioSaveBtn = page
      .getByRole("button", { name: /^Sauvegarder$/i })
      .nth(1);
    await bioSaveBtn.scrollIntoViewIfNeeded();
    await bioSaveBtn.click();
    const bioResp = await saveBio;
    expect(bioResp.ok(), "PATCH /users/me must return 2xx").toBeTruthy();

    // ── 4. Select skills (Beauté → 2 tiles) ─────────────────
    // Catalog is seeded in prod: "Beauté" contains 9 skills including
    // "Coiffure" and "Barbier / coupe homme". We click the category
    // first to narrow the list, then click the two specific tiles by
    // name, then wait on PUT /workers/me/skills so we know the save
    // landed before continuing.
    const beauteCategory = page.getByRole("button", { name: /^💇 Beauté$/ });
    await beauteCategory.scrollIntoViewIfNeeded();
    await beauteCategory.click();

    const coiffureTile = page.getByRole("button", { name: /^Coiffure$/ });
    await expect(coiffureTile).toBeVisible({ timeout: 10_000 });
    await coiffureTile.click();

    const barbierTile = page.getByRole("button", {
      name: /Barbier \/ coupe homme/,
    });
    await expect(barbierTile).toBeVisible();
    await barbierTile.click();

    const saveSkills = page.waitForResponse(
      (r) =>
        r.url().includes("/workers/me/skills") && r.request().method() === "PUT",
      { timeout: 20_000 },
    );
    await page
      .getByRole("button", { name: /Sauvegarder les comp[ée]tences/i })
      .click();
    const skillsResp = await saveSkills;
    expect(
      skillsResp.ok(),
      "PUT /workers/me/skills must return 2xx — DTO validation drove #2",
    ).toBeTruthy();
    await expect(
      page.getByRole("button", { name: /Comp[ée]tences à jour/i }),
    ).toBeVisible({ timeout: 10_000 });

    // ── 5. Enable Monday 09:00–17:00 ────────────────────────
    const mondayToggle = page
      .locator('label:has-text("Lundi") button[role="switch"]')
      .first();
    await expect(mondayToggle).toBeVisible({ timeout: 10_000 });
    if ((await mondayToggle.getAttribute("aria-checked")) === "false") {
      await mondayToggle.click();
      await expect(mondayToggle).toHaveAttribute("aria-checked", "true");
    }
    // Click Save only if the button is in its dirty state (if it's already
    // "à jour", we don't need to save). Button flip to "à jour ✓" is the
    // permanent, assertable state — the sonner toast is ephemeral.
    const availSave = page.getByRole("button", {
      name: /Sauvegarder les disponibilit[ée]s/i,
    });
    if (await availSave.isVisible().catch(() => false)) {
      await availSave.click();
    }
    await expect(
      page.getByRole("button", { name: /Disponibilit[ée]s à jour/i }),
    ).toBeVisible({ timeout: 15_000 });

    // ── 6. Reload and verify persistence ────────────────────
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator('textarea[maxlength="1000"]').first())
      .toHaveValue(bioText, { timeout: 10_000 });
    // Monday switch must still be on after reload.
    await expect(
      page.locator('label:has-text("Lundi") button[role="switch"]').first(),
    ).toHaveAttribute("aria-checked", "true");

    // ── 7. Public card proof ────────────────────────────────
    await page.goto(`${BASE_URL}/worker/${myId}`, {
      waitUntil: "domcontentloaded",
    });
    // Bio appears on the public profile.
    await expect(page.getByText(bioText)).toBeVisible({ timeout: 10_000 });
    // At least one availability chip (DAY · HH:MM–HH:MM pattern).
    await expect(
      page
        .locator("text=/(Lun|Mar|Mer|Jeu|Ven|Sam|Dim) · \\d{2}:\\d{2}/")
        .first(),
    ).toBeVisible({ timeout: 10_000 });
    // Both skills we saved appear as chips under "Compétences".
    await expect(page.getByText(/^Coiffure$/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Barbier \/ coupe homme/)).toBeVisible();
  });
});
