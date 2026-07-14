import { expect, test } from "playwright/test";

import { installBrowserApiFixture } from "./fixtures";

test("standard users can run a custom-market Shopping Trip through completion", async ({
  page
}) => {
  const fixture = await installBrowserApiFixture(page);

  await page.goto("/");
  await page.locator("app-household-shopping-trip-panel .section-toggle").click();

  const marketSelect = page.getByLabel("Shop market id");
  await marketSelect.selectOption("__custom__");
  await page.getByLabel("Custom shop name").fill("Weekend market");
  await page.getByRole("button", { name: "Start trip" }).click();

  await expect(page.getByText("no usable price")).toBeVisible();
  const detailButtons = page.getByRole("button", { name: "Show trip item details" });
  for (let index = 0; index < (await detailButtons.count()); index += 1) {
    await detailButtons.nth(index).click();
    if (await page.getByText("preferred Product").isVisible()) break;
  }
  await expect(page.getByText("preferred Product")).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip line" })).toBeVisible();
  await page.getByRole("button", { name: "Skip line" }).click();

  await page.getByRole("button", { name: "Not bought", exact: true }).last().click();
  await expect(page.getByRole("button", { name: "Not bought", exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Bought", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save result details" })).toBeVisible();

  await page.getByLabel("Stock as Product").selectOption("product-milk-pilos");
  await page.getByRole("button", { name: "Save result details" }).click();

  await page.getByLabel("Item name").fill("Chocolate");
  await page.getByRole("button", { name: "Add purchase" }).click();
  await expect(page.getByText("Chocolate")).toBeVisible();

  await page.getByRole("button", { name: "Finalize trip" }).click();
  await expect(page.getByText("Shopping trip finalized and stock updated.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Finalize trip" })).toBeDisabled();
  expect(
    fixture.requests.some(
      (request) =>
        request.method === "POST" && request.path.endsWith("/shopping-trips/browser-trip/complete")
    )
  ).toBeTruthy();
  expect(fixture.unexpectedRequests).toEqual([]);
});

test("Shopping Trip keeps trip actions beside the compact item table and can be cancelled", async ({
  page
}) => {
  const fixture = await installBrowserApiFixture(page);

  await page.goto("/");
  await page.locator("app-household-shopping-trip-panel .section-toggle").click();
  await page.getByLabel("Shop market id").selectOption("__custom__");
  await page.getByLabel("Custom shop name").fill("Weekend market");
  await page.getByRole("button", { name: "Start trip" }).click();

  await expect(page.locator(".trip-table-header")).toBeVisible();
  await expect(page.locator(".trip-after")).toContainText("Weekend market");
  await expect(page.getByRole("button", { name: "Cancel trip" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel trip" }).click();

  await expect(page.getByRole("button", { name: "Start trip" })).toBeVisible();
  expect(
    fixture.requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.path.endsWith("/shopping-trips/browser-trip") &&
        request.body?.transition === "cancelled"
    )
  ).toBeTruthy();
  expect(fixture.unexpectedRequests).toEqual([]);
});
