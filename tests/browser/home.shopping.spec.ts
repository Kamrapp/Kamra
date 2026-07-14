import { expect, test } from "playwright/test";

import { installBrowserApiFixture } from "./fixtures";

test("Home builds, retries, generates, and cancels a shopping list", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  fixture.state.createShoppingListStatus = 500;

  await page.goto("/");

  const householdWorkspace = page.locator("app-household-v2-workspace");
  const shoppingListPanel = page.locator("app-household-shopping-list");
  const shoppingTripPanel = page.locator("app-household-shopping-trip-panel");
  await householdWorkspace.locator(".section-toggle").click();
  await expect(householdWorkspace.locator(".stock-grid-shell")).toHaveCount(0);
  await shoppingListPanel.locator(".section-toggle").click();
  await shoppingTripPanel.locator(".section-toggle").click();

  const buildButton = page.getByRole("button", { name: "Build shopping list" });
  await expect(buildButton).toBeEnabled();
  await buildButton.click();
  await expect(page.getByRole("button", { name: "Generate shopping list" })).toBeVisible();
  await expect(householdWorkspace.locator(".stock-grid-shell")).toBeVisible();
  await expect(shoppingListPanel.locator(".shopping-collapsed")).toHaveCount(1);
  await expect(shoppingTripPanel.locator(".trip-collapsed")).toHaveCount(1);
  await expect(page.locator('app-household-v2-workspace input[type="checkbox"]')).not.toHaveCount(
    0
  );

  await page.getByRole("button", { name: "Cancel shopping" }).click();
  await expect(buildButton).toBeEnabled();
  await expect(page.locator('app-household-v2-workspace input[type="checkbox"]')).toHaveCount(0);
  await expect(householdWorkspace.locator(".stock-grid-shell")).toBeVisible();

  await buildButton.click();
  const generateButton = page.getByRole("button", { name: "Generate shopping list" });
  await generateButton.click();
  await expect(generateButton).toBeVisible();
  await expect(
    page.getByLabel("Shopping list").getByText("Shopping-list changes could not be saved.")
  ).toBeVisible();

  fixture.state.createShoppingListStatus = 200;
  await generateButton.click();

  await expect(page.locator('input[aria-label="Shopping item name"]').first()).toHaveValue("Alma");
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
  await expect(page.locator('input[aria-label="Shopping item name"]')).toHaveCount(1);
  await expect(page.locator('input[aria-label="Shopping item name"]').first()).toHaveValue("Alma");
  expect(
    fixture.requests.filter(
      (request) => request.method === "PATCH" && request.path === "/api/household/shopping-lists"
    )
  ).toHaveLength(patchCountBeforeDuplicate);

  await page.getByRole("button", { name: "Cancel shopping" }).click();
  await expect(buildButton).toBeEnabled();
  await expect(page.getByText("Alma", { exact: true })).toHaveCount(0);
  await expect(householdWorkspace.locator(".stock-grid-shell")).toBeVisible();
  expect(fixture.unexpectedRequests).toEqual([]);
});

test("Home shopping rows support impulse rename, discard, and purchased labeling", async ({
  page
}) => {
  const fixture = await installBrowserApiFixture(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Build shopping list" }).click();
  await page.getByRole("button", { name: "Generate shopping list" }).click();

  await expect(page.locator(".shopping-list-header")).toBeVisible();
  await expect(page.locator(".shopping-line").first()).toHaveCSS("border-radius", "0px");
  expect(
    await page.locator(".shopping-list-header").evaluate((element) => {
      const background = getComputedStyle(element).backgroundColor;
      return background !== "transparent" && background !== "rgba(0, 0, 0, 0)";
    })
  ).toBe(true);

  const impulseName = page.getByLabel("Shopping item name");
  await expect(impulseName).toHaveValue("Alma");
  const patchCountBeforeRename = fixture.requests.filter(
    (request) => request.method === "PATCH" && request.path === "/api/household/shopping-lists"
  ).length;
  await impulseName.fill("Alma duplicate");
  await impulseName.press("Enter");
  await expect(page.locator('input[aria-label="Shopping item name"]').first()).toHaveValue(
    "Alma duplicate"
  );
  await expect
    .poll(
      () =>
        fixture.requests.filter(
          (request) =>
            request.method === "PATCH" && request.path === "/api/household/shopping-lists"
        ).length
    )
    .toBe(patchCountBeforeRename + 1);

  const renameRequest = [...fixture.requests]
    .reverse()
    .find(
      (request) => request.method === "PATCH" && request.path === "/api/household/shopping-lists"
    );
  expect(renameRequest?.body).toMatchObject({
    items: expect.arrayContaining([expect.objectContaining({ displayName: "Alma duplicate" })])
  });

  await page
    .locator(".shopping-line-impulse")
    .getByRole("button", { name: "Remove this item from the shopping list" })
    .click();
  await expect(page.locator('input[aria-label="Shopping item name"]')).toHaveCount(0);
  const discardRequest = [...fixture.requests]
    .reverse()
    .find(
      (request) => request.method === "PATCH" && request.path === "/api/household/shopping-lists"
    );
  expect(discardRequest?.body).toMatchObject({
    items: expect.not.arrayContaining([expect.objectContaining({ displayName: "Alma duplicate" })])
  });

  await page.locator(".shopping-line-product input[type='checkbox']").first().click();
  await expect(page.getByRole("button", { name: /1 purchased item/ })).toBeVisible();
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

test("Home finishes shopping with the household workspace reopened", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  await page.goto("/");

  const householdWorkspace = page.locator("app-household-v2-workspace");
  await page.getByRole("button", { name: "Build shopping list" }).click();
  await page.getByRole("button", { name: "Generate shopping list" }).click();

  await expect(page.locator('input[aria-label="Shopping item name"]').first()).toHaveValue("Alma");
  await expect(householdWorkspace.locator(".stock-grid-shell")).toHaveCount(0);

  await page.getByRole("button", { name: "Finalize shopping and save stocks" }).click();

  await expect(page.locator("app-household-shopping-list .shopping-layout")).toHaveCount(0);
  await expect(householdWorkspace.locator(".stock-grid-shell")).toBeVisible();
  expect(
    fixture.requests.some(
      (request) =>
        request.method === "POST" && request.path === "/api/household/shopping-lists/update-stocks"
    )
  ).toBeTruthy();
  expect(fixture.unexpectedRequests).toEqual([]);
});

test("Home household rows share grid tracks and show child counts", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  await page.goto("/");

  const header = page.locator(".stock-grid-header");
  const groupRow = page.locator(".stock-group-row").filter({ hasText: "Milk" });
  const productRow = page.locator(".stock-product-row").filter({ hasText: "Pilos 1.5% milk" });
  const emptyProductRow = page.locator(".stock-product-row").filter({ hasText: "Banana" });
  const unassignedRow = page.locator(".stock-unassigned-separator");

  await expect(groupRow.locator(".group-product-count")).toHaveText("(1)");
  await expect(unassignedRow.locator(".group-product-count")).toHaveText("(1)");
  await groupRow.getByRole("button", { name: "Show Product Group details" }).click();
  await expect(
    groupRow.getByRole("button", { name: "Show Product Group details" }).locator("svg.details-icon")
  ).toHaveCount(1);
  await expect(groupRow.getByRole("button", { name: "Edit Product Group" })).toHaveClass(
    /table-icon-button-warning/
  );
  await expect(groupRow.getByRole("button", { name: "Add Product to Product Group" })).toHaveClass(
    /table-icon-button-info/
  );
  const groupDetails = page.locator(".group-details").first();
  await expect(groupDetails).toContainText("Tracking unit");
  await expect(groupDetails).toContainText("When a Product Group is below target");
  await expect(page.getByText("Calculated from Products and batches")).toHaveCount(0);
  const gridStarts = await Promise.all(
    [header, groupRow, productRow, emptyProductRow].map((row) =>
      row
        .locator(":scope > *")
        .evaluateAll((cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().left)))
    )
  );
  const contentGridStarts = gridStarts[0].slice(0, -1);
  expect(gridStarts.slice(1)).toEqual([contentGridStarts, contentGridStarts, contentGridStarts]);
  const comparisonWidth = await groupRow
    .locator(".comparison-column")
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(comparisonWidth).toBeGreaterThanOrEqual(16);
  const headerAndBodyEdges = await Promise.all([
    header.evaluate((element) => Math.round(element.getBoundingClientRect().right)),
    page
      .locator(".stock-grid-body")
      .evaluate((element) => Math.round(element.getBoundingClientRect().right))
  ]);
  expect(headerAndBodyEdges[0]).toBeGreaterThanOrEqual(headerAndBodyEdges[1]);
  const headerAndShellEdges = await header.evaluate((element) => {
    const shell = element.parentElement;
    return {
      headerRight: Math.round(element.getBoundingClientRect().right),
      shellRight: shell ? Math.round(shell.getBoundingClientRect().right) : 0
    };
  });
  expect(headerAndShellEdges.headerRight).toBeLessThanOrEqual(headerAndShellEdges.shellRight);
  await expect(header.locator(".stock-grid-scrollbar-space")).toHaveCount(1);
  await expect(productRow.locator(".workspace-expansion-slot")).toHaveText("▸");
  await expect(emptyProductRow.locator(".workspace-expansion-slot")).toHaveText("");

  const stockGridBody = page.locator(".stock-grid-body");
  await stockGridBody.evaluate((element) => {
    element.style.maxHeight = "1px";
  });
  await expect
    .poll(() => stockGridBody.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  const scrollbarGridStarts = await Promise.all(
    [header, groupRow, productRow, emptyProductRow].map((row) =>
      row
        .locator(":scope > *")
        .evaluateAll((cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().left)))
    )
  );
  const scrollbarContentGridStarts = scrollbarGridStarts[0].slice(0, -1);
  expect(scrollbarGridStarts.slice(1)).toEqual([
    scrollbarContentGridStarts,
    scrollbarContentGridStarts,
    scrollbarContentGridStarts
  ]);
  await productRow.locator(".row-name").click();
  const batchRow = page.locator(".stock-batch-row").first();
  await expect(batchRow).toBeVisible();
  await expect(
    batchRow.getByRole("button", { name: "Show Stock Batch details" }).locator("svg.details-icon")
  ).toHaveCount(1);

  const gridTracks = await Promise.all(
    [header, groupRow, productRow, batchRow].map((row) =>
      row.evaluate((element) => getComputedStyle(element).getPropertyValue("--stock-grid-columns"))
    )
  );
  expect([...new Set(gridTracks)]).toHaveLength(1);
  expect(fixture.unexpectedRequests).toEqual([]);
});

test("Home row edit cancellation closes the details it opened", async ({ page }) => {
  const fixture = await installBrowserApiFixture(page);
  await page.goto("/");

  const groupRow = page
    .locator(".stock-group-row")
    .filter({ has: page.locator('button[aria-label="Milk"]') })
    .first();
  await groupRow.getByRole("button", { name: "Edit Product Group" }).click();
  await expect(page.locator(".group-details")).toHaveCount(1);
  await groupRow.getByRole("button", { name: "Discard Product Group changes" }).click();
  await expect(page.locator(".group-details")).toHaveCount(0);

  const productRow = page
    .locator(".stock-product-row")
    .filter({ has: page.locator('button[aria-label="Pilos 1.5% milk"]') })
    .first();
  await productRow.getByRole("button", { name: "Edit Product" }).click();
  await expect(page.locator(".product-details")).toHaveCount(1);
  await productRow.getByRole("button", { name: "Discard Household Product changes" }).click();
  await expect(page.locator(".product-details")).toHaveCount(0);

  await productRow.locator(".row-name").click();
  const batchRow = page.locator(".stock-batch-row").first();
  await batchRow.getByRole("button", { name: "Edit Stock Batch" }).click();
  await expect(page.locator(".batch-details")).toHaveCount(1);
  await batchRow.getByRole("button", { name: "Cancel Stock Batch edit" }).click();
  await expect(page.locator(".batch-details")).toHaveCount(0);
  expect(fixture.unexpectedRequests).toEqual([]);
});
