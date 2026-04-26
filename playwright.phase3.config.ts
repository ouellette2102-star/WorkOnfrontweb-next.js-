import { defineConfig, devices } from "@playwright/test";

/**
 * Disposable config for Phase 3 (#10 #11) live verification.
 * Same template as phase1/phase2/phase4.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /phase3-navigation\.spec\.ts/,
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
