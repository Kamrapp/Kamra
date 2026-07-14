import { expect, test } from "playwright/test";

import { installBrowserApiFixture } from "./fixtures";

test("Home builds, retries, generates, and cancels a shopping list", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  fixture.state.createShoppingListStatus = 500;

  await page.goto("/");

  const buildButton = page.getByRole("button", { name: "Build shopping list" });
  await expect(buildButton).toBeEnabled();
  await buildButton.click();
  await expect(page.getByRole("button", { name: "Generate shopping list" })).toBeVisible();
  await expect(page.locator('app-household-v2-workspace input[type="checkbox"]')).not.toHaveCount(
    0
  );

  await page.getByRole("button", { name: "Cancel shopping" }).click();
  await expect(buildButton).toBeEnabled();
  await expect(page.locator('app-household-v2-workspace input[type="checkbox"]')).toHaveCount(0);

  await buildButton.click();
  const generateButton = page.getByRole("button", { name: "Generate shopping list" });
  await generateButton.click();
  await expect(generateButton).toBeVisible();
  await expect(
    page.getByLabel("Shopping list").getByText("Shopping-list changes could not be saved.")
  ).toBeVisible();

  fixture.state.createShoppingListStatus = 200;
  await generateButton.click();

  await expect(page.getByText("Alma", { exact: true })).toBeVisible();
  await expect(buildButton).toBeDisabled();
  await expect(page.getByRole("button", { name: "Cancel shopping" })).toBeEnabled();
  expect(
    fixture.requests.some(
      (request) => request.method === "POST" && request.path === "/api/household/shopping-lists"
    )
  ).toBeTruthy();

  const quickAddInput = page.getByPlaceholder("Impulse item, bakery stop, extra milk...");
  await quickAddInput.fill("Alma");
  const patchCountBeforeDuplicate = fixture.requests.filter(
    (request) => request.method === "PATCH" && request.path === "/api/household/shopping-lists"
  ).length;
  await page.getByRole("button", { name: "Quick add" }).click();
  await expect(page.getByText("Alma", { exact: true })).toHaveCount(1);
  expect(
    fixture.requests.filter(
      (request) => request.method === "PATCH" && request.path === "/api/household/shopping-lists"
    )
  ).toHaveLength(patchCountBeforeDuplicate);

  await page.getByRole("button", { name: "Cancel shopping" }).click();
  await expect(buildButton).toBeEnabled();
  await expect(page.getByText("Alma", { exact: true })).toHaveCount(0);
  expect(fixture.unexpectedRequests).toEqual([]);
});
