import type { Page, Route } from "playwright/test";

export const browserHouseholdId = "browser-household";
export const browserAuthToken = "browser-test-token";

const browserHousehold = {
  allowExpiredItems: true,
  createdAt: "2026-07-14T08:00:00.000Z",
  defaultCalculatedMaxLimitMultiplier: 2,
  groupTargetShoppingDistributionMode: "even",
  groupTargetShoppingMode: "add_products_and_group_item",
  id: browserHouseholdId,
  memberCount: 1,
  membershipRole: "owner",
  name: "Browser Test Household",
  status: "active",
  updatedAt: "2026-07-14T08:00:00.000Z"
} as const;

export interface BrowserApiState {
  createShoppingListStatus: number;
  household: typeof browserHousehold;
  userRole: "admin" | "user";
  shoppingList: Record<string, unknown> | null;
  shopMarkets: Array<Record<string, unknown>>;
  shoppingTrips: Array<Record<string, unknown>>;
  stage9AdminPrices: Array<Record<string, unknown>>;
  stage9AdminProducts: Array<Record<string, unknown>>;
  stage9AdminSubmissions: Array<Record<string, unknown>>;
  stage9ReviewDelayMs: number;
  stage9ReviewStatus: number;
  workspace: {
    allowExpiredItems: boolean;
    defaultCalculatedMaxLimitMultiplier: number;
    productGroups: Array<Record<string, unknown>>;
    unassignedBatches: Array<Record<string, unknown>>;
    unassignedProducts: Array<Record<string, unknown>>;
    useAbbreviatedUiLabels: boolean;
  };
}

export interface BrowserApiRequest {
  body: unknown;
  method: string;
  path: string;
  search: string;
}

export interface BrowserApiFixture {
  requests: BrowserApiRequest[];
  unexpectedRequests: BrowserApiRequest[];
  state: BrowserApiState;
}

export function createBrowserApiState(): BrowserApiState {
  return {
    createShoppingListStatus: 200,
    household: browserHousehold,
    userRole: "user",
    shoppingList: null,
    shopMarkets: [
      {
        countryCode: "HU",
        currencyCode: "HUF",
        displayName: "Lidl Hungary",
        id: "market-lidl-hu",
        status: "active"
      }
    ],
    shoppingTrips: [],
    stage9AdminPrices: [
      {
        currencyCode: "HUF",
        id: "price:milk:initial",
        kind: "base",
        observedAt: "2026-07-14T07:00:00.000Z",
        price: 499,
        validFrom: null,
        validTo: null
      }
    ],
    stage9AdminProducts: [
      {
        displayName: "Milk 1 l",
        id: "shop-product:milk",
        packageQuantity: 1,
        packageUnit: "l",
        productId: "catalog-product:milk",
        shopMarketId: "market-lidl-hu"
      }
    ],
    stage9AdminSubmissions: [
      {
        facts: { displayName: "Milk 1 l", quantity: 1, unit: "l" },
        id: "submission:milk-1",
        revision: 1,
        status: "pending"
      }
    ],
    stage9ReviewDelayMs: 0,
    stage9ReviewStatus: 200,
    workspace: {
      allowExpiredItems: true,
      defaultCalculatedMaxLimitMultiplier: 2,
      productGroups: [
        {
          aggregate: {
            availableQuantity: 0,
            batchCount: 1,
            nextExpiryOn: "2026-07-15",
            state: "below_minimum",
            trackingUnit: "l"
          },
          childGroups: [],
          group: {
            displayName: "Milk",
            id: "group-milk",
            parentProductGroupId: null,
            revision: 1,
            targetPolicy: {
              consumptionPolicy: "earliest_expiry_first",
              desiredQuantity: 2,
              expiryWarningDays: 3,
              minimumQuantity: 1,
              trackingUnit: "l"
            },
            trackingUnit: "l"
          },
          products: [
            {
              aggregate: {
                availableQuantity: 0,
                batchCount: 1,
                nextExpiryOn: "2026-07-15",
                state: "below_minimum",
                trackingUnit: "l"
              },
              batches: [
                {
                  acquiredOn: "2026-07-10",
                  acquisitionSnapshot: {
                    displayName: "Pilos 1.5% milk",
                    sourceName: "Manual"
                  },
                  expiryOn: "2026-07-15",
                  householdProductId: "product-milk-pilos",
                  id: "batch-milk-pilos-1",
                  remainingQuantity: 0,
                  revision: 1,
                  unit: "l"
                }
              ],
              product: {
                defaultTrackingUnit: "l",
                displayName: "Pilos 1.5% milk",
                id: "product-milk-pilos",
                identityKind: "manual",
                note: null,
                productGroupId: "group-milk",
                revision: 1,
                targetPolicy: {
                  consumptionPolicy: "earliest_expiry_first",
                  desiredQuantity: 2,
                  expiryWarningDays: 3,
                  minimumQuantity: 1,
                  trackingUnit: "l"
                }
              }
            }
          ]
        }
      ],
      unassignedBatches: [],
      unassignedProducts: [],
      useAbbreviatedUiLabels: false
    }
  };
}

export async function installBrowserApiFixture(
  page: Page,
  state: BrowserApiState = createBrowserApiState()
): Promise<BrowserApiFixture> {
  const fixture: BrowserApiFixture = {
    requests: [],
    state,
    unexpectedRequests: []
  };

  await page.addInitScript((token) => {
    window.localStorage.setItem("kamra_user_token", token);
  }, browserAuthToken);

  await page.route("**/api/**", async (route) => {
    await respondToBrowserApiRequest(route, fixture);
  });

  return fixture;
}

async function respondToBrowserApiRequest(route: Route, fixture: BrowserApiFixture): Promise<void> {
  const request = route.request();
  const url = new URL(request.url());
  const record: BrowserApiRequest = {
    body: readRequestBody(request.postData()),
    method: request.method(),
    path: url.pathname,
    search: url.search
  };
  fixture.requests.push(record);

  const response = findResponse(record, fixture.state);
  if (!response) {
    fixture.unexpectedRequests.push(record);
    await route.fulfill({
      body: JSON.stringify({ error: "unexpected_browser_api_request" }),
      contentType: "application/json",
      status: 500
    });
    return;
  }

  if (
    record.path.startsWith("/api/admin/ingestion-submissions/") &&
    fixture.state.stage9ReviewDelayMs
  ) {
    await new Promise((resolve) => setTimeout(resolve, fixture.state.stage9ReviewDelayMs));
  }

  await route.fulfill(response);
}

function readRequestBody(body: string | null): unknown {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function findResponse(
  request: BrowserApiRequest,
  state: BrowserApiState
): { body: string; contentType: string; status: number } | null {
  if (request.method === "GET" && request.path === "/api/admin/me") {
    return jsonResponse(200, {
      user: {
        email: "browser@example.test",
        profile: { language: "en", theme: "dark" },
        role: state.userRole
      }
    });
  }

  if (request.method === "GET" && request.path === "/api/invitations") {
    return jsonResponse(200, { invitations: [] });
  }

  if (request.method === "POST" && request.path === "/api/log") {
    return jsonResponse(200, { accepted: true });
  }

  if (request.method === "GET" && request.path === "/api/households") {
    return jsonResponse(200, { households: [state.household] });
  }

  if (request.method === "GET" && request.path === "/api/household/items") {
    return jsonResponse(200, {
      household: state.household,
      localProducts: [],
      stockItems: []
    });
  }

  if (request.method === "GET" && request.path === "/api/household/shopping-lists/latest") {
    return state.shoppingList
      ? jsonResponse(200, { shoppingList: state.shoppingList })
      : jsonResponse(404, { error: "not_found" });
  }

  if (request.method === "GET" && request.path === "/api/shops") {
    return jsonResponse(200, { shops: [] });
  }

  if (request.method === "GET" && request.path === "/api/admin/shop-markets") {
    return jsonResponse(200, { markets: state.shopMarkets });
  }

  if (request.method === "GET" && request.path === "/api/admin/ingestion-submissions") {
    return jsonResponse(200, { submissions: state.stage9AdminSubmissions });
  }

  if (request.method === "GET" && request.path === "/api/admin/shop-products") {
    return jsonResponse(200, { products: state.stage9AdminProducts });
  }

  if (request.method === "GET" && request.path === "/api/admin/price-observations") {
    return jsonResponse(200, { observations: state.stage9AdminPrices });
  }

  if (request.method === "POST" && request.path === "/api/admin/price-observations") {
    const body = isRecord(request.body) ? request.body : {};
    state.stage9AdminPrices.push({
      currencyCode: typeof body["currencyCode"] === "string" ? body["currencyCode"] : "HUF",
      id: typeof body["id"] === "string" ? body["id"] : "price:browser:new",
      kind: typeof body["kind"] === "string" ? body["kind"] : "base",
      observedAt: typeof body["observedAt"] === "string" ? body["observedAt"] : "2026-07-14",
      price: typeof body["price"] === "number" ? body["price"] : 0,
      validFrom: body["validFrom"] ?? null,
      validTo: body["validTo"] ?? null
    });
    return jsonResponse(201, { priceObservation: state.stage9AdminPrices.at(-1) });
  }

  if (request.method === "PATCH" && request.path.startsWith("/api/admin/ingestion-submissions/")) {
    if (state.stage9ReviewStatus !== 200) {
      return jsonResponse(state.stage9ReviewStatus, { error: "review_conflict" });
    }
    const submissionId = decodeURIComponent(request.path.split("/").at(-1) ?? "");
    state.stage9AdminSubmissions = state.stage9AdminSubmissions.filter(
      (submission) => submission.id !== submissionId
    );
    return jsonResponse(200, { status: "accepted" });
  }

  if (request.method === "POST" && request.path === "/api/household/shopping-lists") {
    if (state.createShoppingListStatus !== 200) {
      return jsonResponse(state.createShoppingListStatus, {
        messageKey: "household.shoppingListSaveFailure"
      });
    }

    const body = isRecord(request.body) ? request.body : {};
    const selectedOwnerIds = Array.isArray(body["selectedOwnerIds"])
      ? body["selectedOwnerIds"].filter((id): id is string => typeof id === "string")
      : [];
    state.shoppingList = createShoppingList(selectedOwnerIds);
    return jsonResponse(200, { shoppingList: state.shoppingList });
  }

  if (request.method === "PATCH" && request.path === "/api/household/shopping-lists") {
    const body = isRecord(request.body) ? request.body : {};
    if (body["status"] === "archived") {
      state.shoppingList = null;
      return jsonResponse(200, { shoppingList: createArchivedShoppingList() });
    }
    if (state.shoppingList && Array.isArray(body["items"])) {
      state.shoppingList = { ...state.shoppingList, items: body["items"] };
    }
    return jsonResponse(200, { shoppingList: state.shoppingList });
  }

  if (
    request.method === "GET" &&
    request.path === `/api/households/${browserHouseholdId}/stock-workspace`
  ) {
    return jsonResponse(200, { productGroupWorkspace: state.workspace });
  }

  if (
    request.method === "GET" &&
    request.path === `/api/households/${browserHouseholdId}/product-groups`
  ) {
    return jsonResponse(200, { productGroups: [] });
  }

  if (
    request.method === "GET" &&
    request.path === `/api/households/${browserHouseholdId}/shopping-trips`
  ) {
    return jsonResponse(200, { trips: state.shoppingTrips });
  }

  if (
    request.method === "POST" &&
    request.path === `/api/households/${browserHouseholdId}/shopping-trips`
  ) {
    const trip = createShoppingTrip();
    state.shoppingTrips = [trip];
    return jsonResponse(201, { result: trip });
  }

  if (
    request.method === "PATCH" &&
    request.path.startsWith(`/api/households/${browserHouseholdId}/shopping-trips/`)
  ) {
    const current = state.shoppingTrips[0];
    if (!current) return jsonResponse(404, { error: "trip_not_found" });
    const next = updateShoppingTrip(current, request.body);
    state.shoppingTrips = [next];
    return jsonResponse(200, { result: next });
  }

  if (
    request.method === "POST" &&
    request.path.endsWith("/complete") &&
    request.path.includes(`/api/households/${browserHouseholdId}/shopping-trips/`)
  ) {
    const current = state.shoppingTrips[0];
    if (!current) return jsonResponse(404, { error: "trip_not_found" });
    const next = { ...current, revision: Number(current.revision ?? 0) + 1, status: "completed" };
    state.shoppingTrips = [next];
    return jsonResponse(200, { result: next });
  }

  if (
    request.method === "GET" &&
    request.path === `/api/households/${browserHouseholdId}/shop-markets`
  ) {
    return jsonResponse(200, { markets: state.shopMarkets });
  }

  return null;
}

function createShoppingList(selectedOwnerIds: string[]): Record<string, unknown> {
  const selectedItems = selectedOwnerIds.map((ownerId, index) => ({
    currentAmount: 0,
    displayName: ownerId === "group-milk" ? "Milk" : "Pilos 1.5% milk",
    householdProductId: ownerId === "group-milk" ? null : "product-milk-pilos",
    id: `generated_${index}_${ownerId}`,
    idealMaxLimit: null,
    minLimit: 1,
    plannedAmount: 1,
    purchasedAmount: 0,
    productGroupId: ownerId === "group-milk" ? "group-milk" : null,
    reasonCode: "below_minimum",
    sourceKind: "generated",
    status: "not_applied",
    suggestedBuyAmount: 1,
    targetAmount: 2,
    ticked: false,
    uncertaintyFlags: [],
    unit: "l"
  }));

  return {
    createdAt: "2026-07-14T08:10:00.000Z",
    createdByUserId: "browser@example.test",
    householdId: browserHouseholdId,
    id: "browser-shopping-list",
    items: [
      ...selectedItems,
      {
        displayName: "Alma",
        id: "manual_alma",
        plannedAmount: 1,
        purchasedAmount: 0,
        reasonCode: null,
        sourceKind: "manual",
        status: "not_applied",
        suggestedBuyAmount: 1,
        targetAmount: 1,
        ticked: false,
        uncertaintyFlags: ["missing_catalog_product", "missing_product_source"],
        unit: "db"
      }
    ],
    scale: "keep_it_chill",
    schemaVersion: "browser-test",
    shopId: null,
    status: "active",
    stockAppliedAt: null,
    updatedAt: "2026-07-14T08:10:00.000Z",
    updatedByUserId: "browser@example.test"
  };
}

function createArchivedShoppingList(): Record<string, unknown> {
  return {
    ...createShoppingList([]),
    status: "archived"
  };
}

function createShoppingTrip(): Record<string, unknown> {
  return {
    id: "browser-trip",
    items: [
      {
        displayNameSnapshot: "Pilos 1.5% milk",
        expectedPackageCount: 1,
        expectedTotal: 499,
        id: "trip-item-unresolved",
        matchExplanation: "compatible package candidate",
        matchOptions: [
          {
            displayName: "Milk 1 l",
            expectedPackageCount: 1,
            expectedTotal: 499,
            priceState: "conditional_only",
            selectedPriceObservationId: "price:milk:initial",
            shopProductId: "shop-product:milk"
          }
        ],
        planStatus: "unresolved",
        requiredQuantity: 1,
        requiredUnit: "l",
        resultStatus: "pending",
        selectedShopProductId: null
      },
      {
        displayNameSnapshot: "Mizo lactose-free milk",
        expectedPackageCount: 1,
        expectedTotal: 499,
        id: "trip-item-selected",
        matchExplanation: "preferred household Product",
        matchOptions: [],
        planStatus: "selected",
        requiredQuantity: 1,
        requiredUnit: "l",
        resultStatus: "pending",
        selectedProductId: "product-milk-pilos",
        selectedShopProductId: "shop-product:milk",
        priceState: "applicable"
      }
    ],
    plannedDate: "2026-07-14",
    revision: 1,
    shopMarketId: null,
    shopNameSnapshot: "Weekend market",
    status: "draft"
  };
}

function updateShoppingTrip(
  current: Record<string, unknown>,
  body: unknown
): Record<string, unknown> {
  const input = isRecord(body) ? body : {};
  let status = typeof current.status === "string" ? current.status : "draft";
  if (typeof input["transition"] === "string") status = input["transition"];

  const items = Array.isArray(current["items"])
    ? current["items"].map((value) => (isRecord(value) ? { ...value } : value))
    : [];
  const itemId = typeof input["itemId"] === "string" ? input["itemId"] : null;
  const item = items.find((value) => isRecord(value) && value["id"] === itemId);
  if (isRecord(item)) {
    for (const key of [
      "actualAcquiredOn",
      "actualCurrencyCode",
      "actualExpiryOn",
      "actualPaidPrice",
      "actualQuantity",
      "actualUnit"
    ]) {
      if (key in input) item[key] = input[key];
    }
    if (typeof input["householdProductId"] === "string" || input["householdProductId"] === null) {
      item["purchaseHouseholdProductId"] = input["householdProductId"];
    }
    if (typeof input["planStatus"] === "string") item["planStatus"] = input["planStatus"];
    if (typeof input["resultStatus"] === "string") item["resultStatus"] = input["resultStatus"];
    if (typeof input["selectedShopProductId"] === "string") {
      item["selectedShopProductId"] = input["selectedShopProductId"];
    }
  }

  const unplanned = input["unplannedPurchase"];
  if (isRecord(unplanned)) {
    items.push({
      displayNameSnapshot: unplanned["displayName"],
      id: unplanned["id"],
      planStatus: "selected",
      requiredQuantity: unplanned["quantity"],
      requiredUnit: unplanned["unit"],
      resultStatus: "bought"
    });
  }

  return {
    ...current,
    items,
    revision: Number(current.revision ?? 0) + 1,
    status
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(
  status: number,
  value: unknown
): {
  body: string;
  contentType: string;
  status: number;
} {
  return {
    body: JSON.stringify(value),
    contentType: "application/json",
    status
  };
}
