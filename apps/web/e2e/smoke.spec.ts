import { expect, test } from "@playwright/test";

test("landing renders and links into the builder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /describe it/i })).toBeVisible();
  await page
    .getByRole("link", { name: /start building/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/builder/);
});

test("builder shell mounts with a composer", async ({ page }) => {
  await page.goto("/builder");
  await expect(page.getByPlaceholder(/describe an app/i)).toBeVisible();
});

test("settings page lists provider key inputs", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  await expect(page.getByLabel(/openai/i)).toBeVisible();
});
