import { expect, test } from "playwright/test";

test("Kamra application shell opens", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Kamra");

  const brand = page.locator(".left-rail .brand-card");
  await expect(brand).toBeVisible();
  await expect(brand.locator(".brand-name")).toHaveText("Kamra");
});
