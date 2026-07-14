import { expect, test } from "playwright/test";

test("anonymous Home uses the canonical Product Group workspace as an inert preview", async ({
  page
}) => {
  const householdRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/households/")) householdRequests.push(request.url());
  });

  await page.goto("/");

  const preview = page.locator("app-household-preview-workspace");
  const workspace = preview.locator("app-household-v2-workspace .v2-workspace");
  await expect(preview).toBeVisible();
  await expect(workspace).toHaveAttribute("inert", "");
  await expect(workspace.getByRole("heading", { name: "Household stocks" })).toBeVisible();
  await expect(workspace.getByText(/Milk/).first()).toBeVisible();
  await expect(workspace.getByText(/Pilos 1\.5% milk/).first()).toBeVisible();
  await expect(workspace.locator(".stock-grid-header")).toBeVisible();
  expect(householdRequests).toEqual([]);
});
