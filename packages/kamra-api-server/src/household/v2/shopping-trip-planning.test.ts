import { describe, expect, it } from "vitest";
import type { ShoppingNeedList } from "./contracts.js";
import { buildShoppingTripItems } from "./shopping-trip-planning.js";

const needs: ShoppingNeedList = {
  createdAt: "2026-07-13T00:00:00.000Z",
  createdByUserId: "user",
  householdId: "household",
  id: "needs",
  items: [
    {
      acceptanceCriteriaSnapshot: {
        acceptedAttributesAny: [],
        acceptedConceptsAny: [],
        excludedAttributesAny: [],
        requiredAttributesAll: [],
        requiredConceptsAll: []
      },
      id: "need-milk",
      ownerDisplayNameSnapshot: "Milk",
      ownerKind: "household_product",
      plannedQuantity: 2,
      reasonCode: "below_minimum",
      revision: 0,
      state: "open",
      unit: "l"
    }
  ],
  updatedAt: "2026-07-13T00:00:00.000Z",
  updatedByUserId: "user"
};

describe("shopping trip planning", () => {
  it("builds bounded, explicit Trip Items from open Shopping Needs", () => {
    const items = buildShoppingTripItems({
      currencyCode: "HUF",
      needs,
      plannedDate: "2026-07-13",
      priceObservationsByShopProductId: new Map([
        [
          "shop-product:milk",
          [
            {
              currencyCode: "HUF",
              id: "price:milk",
              kind: "base",
              observedAt: "2026-07-13T00:00:00.000Z",
              price: 500,
              shopProductId: "shop-product:milk"
            }
          ]
        ]
      ]),
      shopProducts: [
        {
          displayName: "Milk 1 l",
          id: "shop-product:milk",
          packageQuantity: 1,
          packageUnit: "l",
          productId: "catalog-product:milk",
          shopMarketId: "market:hu",
          status: "active"
        }
      ]
    });

    expect(items).toMatchObject([
      {
        displayNameSnapshot: "Milk",
        expectedPackageCount: 2,
        expectedTotal: 1000,
        matchOptions: [{ shopProductId: "shop-product:milk" }],
        planStatus: "selected",
        selectedProductId: "catalog-product:milk"
      }
    ]);
  });
});
