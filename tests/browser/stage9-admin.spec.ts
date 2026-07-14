import { expect, test } from "playwright/test";

import { installBrowserApiFixture } from "./fixtures";

test("admins can validate pricing input and review a pending purchase fact", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  fixture.state.userRole = "admin";
  fixture.state.stage9ReviewDelayMs = 100;
  fixture.state.stage9ReviewStatus = 409;

  await page.goto("/site-admin/shopping");

  await expect(page.getByRole("heading", { name: "Markets and purchase review" })).toBeVisible();
  await expect(page.getByText("Milk 1 l", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Milk 1 l/ }).click();
  await expect(page.getByText("499 HUF")).toBeVisible();

  const appendPriceButton = page.getByRole("button", { name: "Append price" });
  await page.locator('input[type="number"]').last().fill("-1");
  await appendPriceButton.click();
  await expect(
    page.getByText("Enter a valid non-negative price and a valid date range.")
  ).toBeVisible();

  await page.locator('input[type="number"]').last().fill("599");
  await appendPriceButton.click();
  await expect(page.getByText("Price observation saved.")).toBeVisible();
  await expect(page.getByText("599 HUF")).toBeVisible();

  const acceptButton = page.getByRole("button", { name: "Accept" });
  await acceptButton.click();
  await expect(acceptButton).toBeDisabled();
  await expect(acceptButton).toBeEnabled();
  await expect(page.getByText("The ingestion submission review could not be saved.")).toBeVisible();
  await expect(
    page.getByLabel("Activity console").getByText("Ingestion submission review failed")
  ).toBeVisible();

  fixture.state.stage9ReviewStatus = 200;
  await acceptButton.click();
  await expect(page.getByText("Ingestion submission reviewed.")).toBeVisible();
  await expect(page.getByText("No pending purchase facts.")).toBeVisible();
  expect(fixture.unexpectedRequests).toEqual([]);
});
