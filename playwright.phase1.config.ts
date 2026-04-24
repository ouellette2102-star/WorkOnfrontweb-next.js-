import { defineConfig, devices } from "@playwright/test";

/**
 * Ad-hoc config to run the Phase 1 profile E2E against prod/preview
 * without triggering the webServer (which assumes `pnpm`) or the
 * remote config's `-proof` testMatch filter. Disposable — kept only
 * for the Phase 1 validation run.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /profile-end-to-end\.spec\.ts/,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: process.env.BASE_URL ?? "https://workonapp.vercel.app",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
