import { defineConfig, devices } from "@playwright/test";

/**
 * Disposable config for the Phase 2 (#7 #8 #9) live verification run.
 * Same shape as playwright.phase1.config.ts — bypasses the webServer
 * and the remote config's -proof.spec.ts testMatch so the spec can
 * run by name against prod.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /phase2-notifications-matches\.spec\.ts/,
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
