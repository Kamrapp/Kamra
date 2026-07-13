import { describe, expect, it } from "vitest";
import {
  limitShoppingMatches,
  matchShoppingNeed,
  selectApplicablePrice
} from "./shopping-matcher.js";

describe("Stage 9 shopping matcher", () => {
  it("selects an inclusive offer and keeps stale state explainable", () => {
    expect(
      selectApplicablePrice({
        currencyCode: "HUF",
        shoppingDate: "2026-07-12",
        observations: [
          {
            currencyCode: "HUF",
            id: "base",
            kind: "base",
            observedAt: "2026-07-01T00:00:00.000Z",
            price: 500,
            shopProductId: "shop-product"
          },
          {
            currencyCode: "HUF",
            id: "offer",
            kind: "offer",
            observedAt: "2026-07-10T00:00:00.000Z",
            price: 400,
            shopProductId: "shop-product",
            validFrom: "2026-07-12",
            validTo: "2026-07-12"
          }
        ]
      })
    ).toMatchObject({ observationId: "offer", price: 400, state: "applicable" });
    expect(
      selectApplicablePrice({
        currencyCode: "HUF",
        shoppingDate: "2026-07-12",
        observations: [
          {
            currencyCode: "HUF",
            id: "old",
            kind: "base",
            observedAt: "2026-06-01T00:00:00.000Z",
            price: 500,
            shopProductId: "shop-product"
          }
        ]
      }).state
    ).toBe("stale");
  });

  it("repeats one compatible package and prefers the lowest priced total", () => {
    const matches = matchShoppingNeed({
      currencyCode: "HUF",
      requiredQuantity: 2,
      requiredUnit: "l",
      shoppingDate: "2026-07-12",
      candidates: [
        {
          shopProduct: {
            id: "expensive",
            productId: "milk",
            shopMarketId: "market",
            displayName: "Milk 1 l",
            packageQuantity: 1,
            packageUnit: "l",
            status: "active"
          },
          priceObservations: [
            {
              id: "expensive-price",
              shopProductId: "expensive",
              currencyCode: "HUF",
              kind: "base",
              observedAt: "2026-07-12T00:00:00.000Z",
              price: 500
            }
          ]
        },
        {
          shopProduct: {
            id: "cheap",
            productId: "milk",
            shopMarketId: "market",
            displayName: "Milk 2 l",
            packageQuantity: 2,
            packageUnit: "l",
            status: "active"
          },
          priceObservations: [
            {
              id: "cheap-price",
              shopProductId: "cheap",
              currencyCode: "HUF",
              kind: "base",
              observedAt: "2026-07-12T00:00:00.000Z",
              price: 700
            }
          ]
        }
      ]
    });
    expect(matches[0]).toMatchObject({
      shopProductId: "cheap",
      packageCount: 1,
      expectedTotal: 700
    });
  });

  it("bounds match options while retaining truncation evidence", () => {
    const matches = Array.from({ length: 14 }, (_, index) => ({
      applicablePrice: {
        currencyCode: "HUF",
        observationId: `price-${index}`,
        price: index + 1,
        state: "applicable" as const
      },
      explanation: "compatible package candidate",
      expectedTotal: index + 1,
      packageCount: 1,
      productId: `product-${index}`,
      shopProductId: `shop-product-${index}`
    }));

    expect(limitShoppingMatches(matches)).toMatchObject({ truncated: true });
    expect(limitShoppingMatches(matches).matches).toHaveLength(12);
  });
});
