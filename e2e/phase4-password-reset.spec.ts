/**
 * E2E proof for Phase 4 — Password reset (#13).
 *
 * Two compounded fixes to verify:
 *   1. /forgot-password POST → BE actually triggers the email flow.
 *   2. /reset-password page exists and successfully sets a new password.
 *
 * SendGrid is the production email provider. We can't reach the user's
 * inbox from a test, but we can prove the full chain in a way that
 * matches what the email link does:
 *   a. Hit POST /auth/forgot-password.
 *   b. Pull the reset token directly from the BE response *if* SendGrid
 *      isn't initialized in the test environment, OR (in prod) generate
 *      a token through the same path the BE uses (we can't, so we
 *      assert the dev fallback returns it OR we accept the security-
 *      stub message and verify the page-only flow with a synthetic but
 *      well-formed token rejected by the BE — that proves the page +
 *      error path are wired).
 *
 * Concretely, in prod:
 *   - We register a fresh user.
 *   - POST /auth/forgot-password — assert the response shape is the
 *     security stub (no token leak).
 *   - Open /reset-password (with no token) → assert the "Lien invalide"
 *     UX (covers tokenMissing path).
 *   - Open /reset-password?token=clearly-invalid → fill new password →
 *     submit → assert the BE error surfaces in the UI (covers wired
 *     POST + error rendering).
 *
 * Verifying the happy path (real token) requires inbox access, which is
 * out of band. Documented in the rapport as residual; covered by 58/58
 * BE auth tests including forgot/reset coverage.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_BASE =
  process.env.API_BASE ??
  "https://workon-backend-production-8908.up.railway.app/api/v1";

test.setTimeout(45_000);

test.describe("Phase 4 — password reset wiring (#13)", () => {
  test("forgot-password triggers BE; reset-password page handles token UX", async ({
    page,
  }) => {
    const ts = Date.now();
    const email = `phase4-${ts}@workon.test`;
    const password = "Test1234!";

    // ── 1. Register a fresh user so the email exists ────────
    const reg = await page.request.post(`${API_BASE}/auth/register`, {
      data: {
        email,
        password,
        firstName: "Phase4",
        lastName: "User",
        role: "worker",
      },
    });
    expect(reg.ok(), "register").toBe(true);

    // ── 2. POST /auth/forgot-password ───────────────────────
    const forgot = await page.request.post(
      `${API_BASE}/auth/forgot-password`,
      { data: { email } },
    );
    expect(forgot.ok(), "forgot-password must 2xx").toBe(true);
    const forgotBody = await forgot.json();
    // The BE returns the security-safe stub regardless of whether the
    // email exists. In prod with SendGrid wired, no token is leaked.
    expect(forgotBody.message).toMatch(/reset link|réinitialisation|exist/i);
    expect(
      forgotBody.resetToken,
      "Prod must NOT leak the reset token in the response",
    ).toBeUndefined();

    // ── 3. /reset-password with no token → "Lien invalide" UX
    await page.goto(`${BASE_URL}/reset-password`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /Lien invalide/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("link", { name: /Demander un nouveau lien/i }),
    ).toBeVisible();

    // ── 4. /reset-password?token=<bogus> → form visible, submit
    //         surfaces the BE error message verbatim ──────────
    await page.goto(`${BASE_URL}/reset-password?token=bogusbogusbogus`, {
      waitUntil: "domcontentloaded",
    });
    // Loi 25 cookie banner floats over the bottom of the viewport on
    // first visit and intercepts pointer events on the submit button.
    // Dismiss it if present so the click below actually lands.
    const cookieAccept = page.getByRole("button", { name: /Accepter/i });
    if (await cookieAccept.count()) {
      await cookieAccept.first().click().catch(() => {});
    }
    await expect(
      page.getByTestId("reset-password-input"),
    ).toBeVisible({ timeout: 10_000 });

    await page
      .getByTestId("reset-password-input")
      .fill("brandNewPassword42");
    await page
      .getByTestId("reset-password-confirm")
      .fill("brandNewPassword42");

    const resetReq = page.waitForResponse(
      (r) =>
        r.url().includes("/auth/reset-password") &&
        r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await page.getByTestId("reset-password-submit").click();
    const resetResp = await resetReq;
    // Bogus token → BE returns 400. The page surfaces err.message.
    expect(resetResp.status()).toBe(400);
    await expect(
      page
        .getByText(/invalid|expir[ée]|lien|invalide/i)
        .first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
