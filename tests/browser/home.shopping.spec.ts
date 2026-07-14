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

test("Home shopping selection allows manual changes and resets after a scale change", async ({
  page
}) => {
  const fixture = await installBrowserApiFixture(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Build shopping list" }).click();
  const groupCheckbox = page.getByRole("checkbox", { name: "Milk", exact: true });
  const productCheckbox = page.getByRole("checkbox", { name: "Pilos 1.5% milk" });
  const untrackedCheckbox = page.getByRole("checkbox", { name: "Banana" });

  await expect(groupCheckbox).toBeChecked();
  await expect(productCheckbox).toBeChecked();
  await expect(untrackedCheckbox).not.toBeChecked();

  await productCheckbox.uncheck();
  await untrackedCheckbox.check();
  await expect(productCheckbox).not.toBeChecked();
  await expect(untrackedCheckbox).toBeChecked();

  const scale = page.getByRole("slider", { name: "Shopping scale" });
  await scale.fill("0");
  await expect(groupCheckbox).not.toBeChecked();
  await expect(productCheckbox).not.toBeChecked();
  await expect(untrackedCheckbox).not.toBeChecked();

  await scale.fill("2");
  await expect(groupCheckbox).toBeChecked();
  await expect(productCheckbox).toBeChecked();
  await expect(untrackedCheckbox).not.toBeChecked();
  expect(fixture.unexpectedRequests).toEqual([]);
});

test("Home generates the shopping list from the final manual selection", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Build shopping list" }).click();
  await page.getByRole("checkbox", { name: "Pilos 1.5% milk" }).uncheck();
  await page.getByRole("checkbox", { name: "Banana" }).check();
  await page.getByRole("button", { name: "Generate shopping list" }).click();

  const request = fixture.requests.find(
    (candidate) => candidate.method === "POST" && candidate.path === "/api/household/shopping-lists"
  );
  expect(request?.body).toMatchObject({
    selectedOwnerIds: expect.arrayContaining(["group-milk", "product-banana"])
  });
  expect(request?.body).not.toMatchObject({
    selectedOwnerIds: expect.arrayContaining(["product-milk-pilos"])
  });
  await expect(page.getByText("Banana", { exact: true })).toBeVisible();
  expect(fixture.unexpectedRequests).toEqual([]);
});
