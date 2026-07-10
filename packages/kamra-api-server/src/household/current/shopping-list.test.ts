import { describe, expect, it } from "vitest";

import type { HouseholdStockItemListItem } from "../v1/contracts.js";
import {
  calculateHouseholdShoppingTargetAmount,
  generateHouseholdShoppingListPreview
} from "./shopping-list.js";

describe("generateHouseholdShoppingListPreview", () => {
  it("includes only below-limit and at-limit rows for business as usual", () => {
    const result = generateHouseholdShoppingListPreview({
      household: {
        id: "household1"
      },
      scale: "business_as_usual",
      stockItems: [
        createStockItem({ displayName: "Below", id: "below", minLimit: 2, currentAmount: 1, stockStatus: "below_limit" }),
        createStockItem({ displayName: "At", id: "at", minLimit: 2, currentAmount: 2, stockStatus: "at_limit" }),
        createStockItem({ displayName: "Soon", id: "soon", minLimit: 2, currentAmount: 2.2, stockStatus: "low_soon" }),
        createStockItem({ displayName: "Steady", id: "steady", minLimit: 2, currentAmount: 4, stockStatus: "steady" })
      ]
    });

    expect(result.items.map((item) => item.householdStockItemId)).toEqual(["below", "at"]);
    expect(result.items.map((item) => item.displayName)).toEqual(["Below", "At"]);
    expect(result.items.map((item) => item.reasonCode)).toEqual(["below_minimum", "at_minimum"]);
  });

  it("includes low-soon rows for keep it chill and all rows for stock em up", () => {
    const stockItems = [
      createStockItem({ displayName: "Below", id: "below", minLimit: 2, currentAmount: 1, stockStatus: "below_limit" }),
      createStockItem({ displayName: "At", id: "at", minLimit: 2, currentAmount: 2, stockStatus: "at_limit" }),
      createStockItem({ displayName: "Soon", id: "soon", minLimit: 2, currentAmount: 2.3, stockStatus: "low_soon" }),
      createStockItem({ displayName: "Steady", id: "steady", minLimit: 2, currentAmount: 4, stockStatus: "steady" })
    ];

    const keepItChill = generateHouseholdShoppingListPreview({
      household: { id: "household1" },
      scale: "keep_it_chill",
      stockItems
    });
    const stockEmUp = generateHouseholdShoppingListPreview({
      household: { id: "household1" },
      scale: "stock_em_up",
      stockItems
    });

    expect(keepItChill.items.map((item) => item.displayName)).toEqual(["Below", "At", "Soon"]);
    expect(stockEmUp.items.map((item) => item.displayName)).toEqual(["Below", "At", "Soon", "Steady"]);
    expect(stockEmUp.items.at(-1)?.reasonCode).toBe("broad_restock");
  });

  it("creates an empty preview for start fresh", () => {
    const result = generateHouseholdShoppingListPreview({
      household: { id: "household1" },
      scale: "start_fresh",
      stockItems: [
        createStockItem({ displayName: "Below", id: "below", minLimit: 2, currentAmount: 1, stockStatus: "below_limit" }),
        createStockItem({ displayName: "Soon", id: "soon", minLimit: 2, currentAmount: 2.3, stockStatus: "low_soon" })
      ]
    });

    expect(result).toMatchObject({
      householdId: "household1",
      itemCount: 0,
      items: [],
      scale: "start_fresh"
    });
  });

  it("orders rows by stock priority and then display name", () => {
    const result = generateHouseholdShoppingListPreview({
      household: { id: "household1" },
      scale: "stock_em_up",
      stockItems: [
        createStockItem({ displayName: "Zeta", id: "zeta", minLimit: 2, currentAmount: 1, stockStatus: "below_limit" }),
        createStockItem({ displayName: "Alpha", id: "alpha", minLimit: 2, currentAmount: 1, stockStatus: "below_limit" }),
        createStockItem({ displayName: "Beta", id: "beta", minLimit: 2, currentAmount: 2, stockStatus: "at_limit" }),
        createStockItem({ displayName: "Gamma", id: "gamma", minLimit: 2, currentAmount: 2.2, stockStatus: "low_soon" })
      ]
    });

    expect(result.items.map((item) => item.displayName)).toEqual(["Alpha", "Zeta", "Beta", "Gamma"]);
  });

  it("uses ideal max limit first and otherwise falls back to the household multiplier", () => {
    const result = generateHouseholdShoppingListPreview({
      household: {
        defaultCalculatedMaxLimitMultiplier: 3,
        id: "household1"
      },
      scale: "stock_em_up",
      stockItems: [
        createStockItem({
          currentAmount: 1.5,
          displayName: "Flour",
          id: "flour",
          idealMaxLimit: 5,
          minLimit: 2,
          stockStatus: "below_limit"
        }),
        createStockItem({
          currentAmount: 1.5,
          displayName: "Milk",
          id: "milk",
          minLimit: 2,
          stockStatus: "below_limit"
        })
      ]
    });

    expect(result.items).toMatchObject([
      {
        displayName: "Flour",
        suggestedBuyAmount: 3.5,
        targetAmount: 5
      },
      {
        displayName: "Milk",
        suggestedBuyAmount: 4.5,
        targetAmount: 6
      }
    ]);
  });

  it("clamps negative restock suggestions to zero, including zero-minimum broad-restock rows", () => {
    const result = generateHouseholdShoppingListPreview({
      household: { id: "household1" },
      scale: "stock_em_up",
      stockItems: [
        createStockItem({
          currentAmount: 3,
          displayName: "Jam",
          id: "jam",
          minLimit: 1,
          stockStatus: "steady"
        }),
        createStockItem({
          currentAmount: 0.4,
          displayName: "Salt",
          id: "salt",
          minLimit: 0,
          stockStatus: "steady"
        })
      ]
    });

    expect(result.items).toMatchObject([
      {
        displayName: "Jam",
        suggestedBuyAmount: 0,
        targetAmount: 2
      },
      {
        displayName: "Salt",
        suggestedBuyAmount: 0,
        targetAmount: 0
      }
    ]);
  });

  it("keeps unmatched household-local rows visible and marks missing catalog linkage as uncertainty", () => {
    const result = generateHouseholdShoppingListPreview({
      household: { id: "household1" },
      scale: "business_as_usual",
      stockItems: [
        createStockItem({
          currentAmount: 0,
          displayName: "Paprika cream",
          id: "paprika-cream",
          minLimit: 1,
          productSourceId: null,
          stockStatus: "below_limit"
        })
      ]
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      displayName: "Paprika cream",
      uncertaintyFlags: ["missing_catalog_product", "missing_product_source"]
    });
  });
});

describe("calculateHouseholdShoppingTargetAmount", () => {
  it("defaults the multiplier to two when no household override exists", () => {
    expect(
      calculateHouseholdShoppingTargetAmount({
        minLimit: 2
      })
    ).toBe(4);
  });
});

function createStockItem(
  overrides: Partial<HouseholdStockItemListItem> & Pick<HouseholdStockItemListItem, "displayName" | "id">
): HouseholdStockItemListItem {
  return {
    ...overrides,
    createdAt: "2026-07-09T10:00:00.000Z",
    currentAmount: overrides.currentAmount ?? 0,
    displayName: overrides.displayName,
    householdId: "household1",
    householdProductId: overrides.householdProductId ?? `product_${overrides.id}`,
    id: overrides.id,
    initialAmount: overrides.initialAmount ?? overrides.currentAmount ?? 0,
    minLimit: overrides.minLimit ?? 1,
    note: overrides.note ?? null,
    stockedAt: "2026-07-09",
    stockGroupKey: overrides.stockGroupKey ?? overrides.id,
    stockStatus: overrides.stockStatus ?? "below_limit",
    status: "active",
    unit: overrides.unit ?? "db",
    updatedAt: "2026-07-09T10:00:00.000Z"
  };
}
