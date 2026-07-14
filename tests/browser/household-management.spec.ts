import { expect, test } from "playwright/test";

import { browserHouseholdId, installBrowserApiFixture } from "./fixtures";

test("household management saves settings and restores them after reload", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  await page.goto(`/household/${browserHouseholdId}`);

  const allowExpiredItems = page.getByRole("checkbox", { name: "Allow expired items" });
  const multiplier = page.getByLabel("Default calculated max-limit multiplier");
  await expect(allowExpiredItems).toBeChecked();
  await allowExpiredItems.uncheck();
  await multiplier.fill("3");
  await page.getByRole("button", { name: "Save settings", exact: true }).click();

  await expect(page.getByText("Household settings saved.", { exact: true })).toBeVisible();
  const settingsRequest = fixture.requests.find(
    (request) =>
      request.method === "PATCH" &&
      request.path === `/api/households/${browserHouseholdId}/settings`
  );
  expect(settingsRequest?.body).toMatchObject({
    allowExpiredItems: false,
    defaultCalculatedMaxLimitMultiplier: 3
  });

  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Allow expired items" })).not.toBeChecked();
  await expect(page.getByLabel("Default calculated max-limit multiplier")).toHaveValue("3");
  expect(fixture.unexpectedRequests).toEqual([]);
});
