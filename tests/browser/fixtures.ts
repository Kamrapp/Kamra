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
  shoppingList: Record<string, unknown> | null;
  shopMarkets: Array<Record<string, unknown>>;
  shoppingTrips: Array<Record<string, unknown>>;
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
    shoppingList: null,
    shopMarkets: [],
    shoppingTrips: [],
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
        role: "user"
      }
    });
  }

  if (request.method === "GET" && request.path === "/api/invitations") {
    return jsonResponse(200, { invitations: [] });
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
