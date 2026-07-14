import { expect, test } from "playwright/test";

import { browserHouseholdId, installBrowserApiFixture } from "./fixtures";

test("authenticated Home loads the Product Group workspace through the browser API contract", async ({
  page
}) => {
  const fixture = await installBrowserApiFixture(page);

  await page.goto("/");

  await expect(page.locator("app-household-v2-workspace")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Household stocks" })).toBeVisible();
  await expect(page.locator(`select option[value="${browserHouseholdId}"]`)).toHaveText(
    "Browser Test Household"
  );
  await expect(page.locator("app-household-shopping-list")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shopping trip" })).toBeVisible();
  const shoppingTripPanel = page.locator("app-household-shopping-trip-panel");
  await expect(shoppingTripPanel.locator(".trip-panel")).toHaveClass(/trip-collapsed/);
  await shoppingTripPanel.locator(".section-toggle").click();
  await expect(shoppingTripPanel.getByLabel("Shop market id")).toBeVisible();
  await shoppingTripPanel.locator(".section-toggle").click();
  await expect(shoppingTripPanel.locator(".trip-start-form")).toBeHidden();
  expect(fixture.unexpectedRequests).toEqual([]);
});
