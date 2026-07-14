import { expect, test } from "playwright/test";

import { browserHouseholdId, installBrowserApiFixture } from "./fixtures";

test("authenticated Home loads the Product Group workspace through the browser API contract", async ({
  page
}) => {
  const fixture = await installBrowserApiFixture(page);

  await page.goto("/");

  await expect(page.locator("app-household-v2-workspace")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Product groups" })).toBeVisible();
  await expect(page.locator(`select option[value="${browserHouseholdId}"]`)).toHaveText(
    "Browser Test Household"
  );
  await expect(page.locator("app-household-shopping-list")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shopping trip" })).toBeVisible();
  expect(fixture.unexpectedRequests).toEqual([]);
});
