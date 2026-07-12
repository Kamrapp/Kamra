import { describe, expect, it } from "vitest";

import { buildShoppingListStockUpdatePlan } from "./shopping-list-completion.js";

describe("buildShoppingListStockUpdatePlan", () => {
  it("requires confirmation when unticked items remain", () => {
    const result = buildShoppingListStockUpdatePlan({
      allowAutoTickingAllShoppingListEntries: true,
      householdId: "household1",
      shoppingList: createShoppingList([
        createLine({ id: "line_1", ticked: true }),
        createLine({ id: "line_2", ticked: false })
      ]),
      shop: null,
      stockAppliedAt: "2026-07-09",
      stockPage: createStockPage()
    });

    expect(result.kind).toBe("confirmation_required");
    if (result.kind === "confirmation_required") {
      expect(result.response.allowedConfirmationModes).toEqual([
        "tick_all_and_update",
        "update_ticked_only"
      ]);
    }
  });

  it("updates only ticked items when partial confirmation is chosen", () => {
    const result = buildShoppingListStockUpdatePlan({
      allowAutoTickingAllShoppingListEntries: true,
      confirmationMode: "update_ticked_only",
      householdId: "household1",
      shoppingList: createShoppingList([
        createLine({
          householdStockItemId: "stock_milk",
          id: "line_1",
          purchasedAmount: 2,
          ticked: true
        }),
        createLine({
          householdStockItemId: "stock_flour",
          id: "line_2",
          purchasedAmount: 1,
          ticked: false
        })
      ]),
      shop: null,
      stockAppliedAt: "2026-07-09",
      stockPage: createStockPage([
        {
          currentAmount: 1,
          householdId: "household1",
          householdProductId: "product_milk",
          id: "stock_milk"
        },
        {
          currentAmount: 3,
          householdId: "household1",
          householdProductId: "product_flour",
          id: "stock_flour"
        }
      ])
    });

    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.plan.stockUpdates).toEqual([
        {
          currentAmount: 3,
          householdId: "household1",
          id: "stock_milk"
        }
      ]);
      expect(result.plan.updatedShoppingList.items).toMatchObject([
        { id: "line_1", status: "applied" },
        { id: "line_2", status: "not_applied" }
      ]);
    }
  });

  it("can tick all, create stock rows, and route linked prices into catalog observations", () => {
    const result = buildShoppingListStockUpdatePlan({
      allowAutoTickingAllShoppingListEntries: true,
      confirmationMode: "tick_all_and_update",
      householdId: "household1",
      shoppingList: createShoppingList([
        createLine({
          catalogProductId: "product_1",
          displayName: "Milk",
          householdProductId: "product_milk",
          id: "line_1",
          observedPrice: {
            amount: 599,
            currencyCode: "HUF",
            observedAt: "2026-07-09T10:00:00.000Z"
          },
          productSourceId: "product_source_1",
          purchasedAmount: 2,
          sourceName: "lidl-hu-brochure",
          sourceProductUrl: "https://example.test/milk",
          ticked: false
        }),
        createLine({
          displayName: "Paprika cream",
          id: "line_2",
          observedPrice: {
            amount: 899,
            currencyCode: "HUF",
            observedAt: "2026-07-09T10:05:00.000Z"
          },
          purchasedAmount: 1,
          stockGroupKey: "paprika_cream",
          ticked: false
        })
      ]),
      shop: {
        countryCode: "HU",
        createdAt: "2026-07-09T09:00:00.000Z",
        id: "shop_hu_lidl",
        label: "Lidl Hungary",
        sourceNames: ["lidl-hu-brochure"],
        status: "active",
        storeBrandKeys: ["lidl-hu"],
        updatedAt: "2026-07-09T09:00:00.000Z"
      },
      stockAppliedAt: "2026-07-09",
      stockPage: createStockPage()
    });

    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.plan.catalogPriceObservations).toHaveLength(1);
      expect(result.plan.householdPurchasePriceObservations).toHaveLength(1);
      expect(result.plan.stockCreates).toMatchObject([
        {
          displayName: "Milk",
          householdProductId: "product_milk"
        },
        {
          displayName: "Paprika cream",
          stockGroupKey: "paprika_cream"
        }
      ]);
      expect(
        result.plan.updatedShoppingList.items.every(
          (item) => item.status === "applied" && item.ticked
        )
      ).toBe(true);
    }
  });
});

function createShoppingList(items: ReturnType<typeof createLine>[]) {
  return {
    createdAt: "2026-07-09T09:00:00.000Z",
    createdByUserId: "usera",
    householdId: "household1",
    id: "shopping_list_1",
    items,
    scale: "keep_it_chill" as const,
    schemaVersion: "shopping_list_v1",
    shopId: null,
    status: "active" as const,
    updatedAt: "2026-07-09T09:00:00.000Z",
    updatedByUserId: "usera"
  };
}

function createLine(overrides: Record<string, unknown>) {
  return {
    displayName: "Milk",
    id: "line",
    plannedAmount: 1,
    purchasedAmount: 1,
    sourceKind: "generated" as const,
    status: "not_applied" as const,
    suggestedBuyAmount: 1,
    targetAmount: 2,
    ticked: true,
    uncertaintyFlags: [],
    unit: "db",
    ...overrides
  };
}

function createStockPage(
  stockItems: Array<{
    currentAmount: number;
    householdId: string;
    householdProductId: string;
    id: string;
  }> = []
) {
  return {
    household: {
      createdAt: "2026-07-09T09:00:00.000Z",
      defaultCalculatedMaxLimitMultiplier: 2,
      favouriteShopId: null,
      id: "household1",
      membershipRole: "owner" as const,
      memberCount: 1,
      name: "Demo household",
      status: "active" as const,
      updatedAt: "2026-07-09T09:00:00.000Z"
    },
    localProducts: [],
    stockItems: stockItems.map((item) => ({
      createdAt: "2026-07-09T09:00:00.000Z",
      currentAmount: item.currentAmount,
      displayName: item.householdProductId,
      householdId: item.householdId,
      householdProductId: item.householdProductId,
      id: item.id,
      initialAmount: item.currentAmount,
      minLimit: 0,
      stockedAt: "2026-07-09T09:00:00.000Z",
      stockGroupKey: item.householdProductId,
      stockStatus: "steady" as const,
      status: "active" as const,
      unit: "db",
      updatedAt: "2026-07-09T09:00:00.000Z"
    }))
  };
}
