import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("match");
});

test("navigation works", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Pricing");
  await expect(page).toHaveURL(/.*pricing/);
});

