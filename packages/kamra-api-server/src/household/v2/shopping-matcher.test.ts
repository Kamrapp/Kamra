import { describe, expect, it } from "vitest";
import {
  limitShoppingMatches,
  matchShoppingNeed,
  selectApplicablePrice
} from "./shopping-matcher.js";

describe("Stage 9 shopping matcher", () => {
  it.each([
    {
      name: "no price",
      observations: [],
      expected: { observationId: null, price: null, state: "no_price" }
    },
    {
      name: "future price",
      observations: [
        {
          currencyCode: "HUF",
          id: "future",
          kind: "base" as const,
          observedAt: "2026-07-12T00:00:00.000Z",
          price: 500,
          shopProductId: "shop-product",
          validFrom: "2026-07-13"
        }
      ],
      expected: { observationId: null, price: null, state: "future" }
    },
    {
      name: "expired price",
      observations: [
        {
          currencyCode: "HUF",
          id: "expired",
          kind: "base" as const,
          observedAt: "2026-07-10T00:00:00.000Z",
          price: 500,
          shopProductId: "shop-product",
          validTo: "2026-07-11"
        }
      ],
      expected: { observationId: null, price: null, state: "expired" }
    },
    {
      name: "conditional price",
      observations: [
        {
          currencyCode: "HUF",
          id: "coupon",
          kind: "coupon" as const,
          observedAt: "2026-07-12T00:00:00.000Z",
          price: 350,
          shopProductId: "shop-product"
        }
      ],
      expected: { observationId: "coupon", price: 350, state: "conditional_only" }
    },
    {
      name: "superseded price",
      observations: [
        {
          currencyCode: "HUF",
          id: "superseded",
          kind: "base" as const,
          observedAt: "2026-07-12T00:00:00.000Z",
          price: 500,
          shopProductId: "shop-product",
          supersededByObservationId: "replacement"
        }
      ],
      expected: { observationId: null, price: null, state: "no_price" }
    }
  ])("classifies $name price observations", ({ observations, expected }) => {
    expect(
      selectApplicablePrice({
        currencyCode: "HUF",
        observations,
        shoppingDate: "2026-07-12"
      })
    ).toMatchObject(expected);
  });

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

  it("excludes incompatible packages instead of inventing a conversion", () => {
    expect(
      matchShoppingNeed({
        currencyCode: "HUF",
        requiredQuantity: 2,
        requiredUnit: "l",
        shoppingDate: "2026-07-12",
        candidates: [
          {
            shopProduct: {
              id: "soap",
              productId: "soap",
              shopMarketId: "market",
              displayName: "Soap 1 count",
              packageQuantity: 1,
              packageUnit: "count",
              status: "active"
            },
            priceObservations: []
          }
        ]
      })
    ).toEqual([]);
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
