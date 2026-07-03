import { describe, expect, it } from "vitest";

import {
  hashSourceContent,
  parseSimpleHtmlTableShop,
  simpleHtmlTableShopFixture
} from "./source.js";

describe("SimpleHtmlTableShop source", () => {
  it("parses product rows with separate price observations", () => {
    const rows = parseSimpleHtmlTableShop(simpleHtmlTableShopFixture, "2026-06-23T08:00:00.000Z");

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      countryCode: "HU",
      displayName: "Kamra tej 1,5%",
      packageLabel: "1 l",
      sourceProductKey: "SHTS-MILK-15",
      stock: {
        availability: "infinite",
        countryCode: "HU"
      },
      storeBrandKey: "simple-html-table-shop"
    });
    expect(rows[0]?.priceObservations).toEqual([
      {
        currencyCode: "HUF",
        observedAt: "2026-06-23T08:00:00.000Z",
        price: 329,
        unitPriceLabel: "329 Ft/l",
        validFrom: "2026-06-23",
        validTo: "2026-06-29"
      }
    ]);
    expect(rows[0]?.crawlContext).toContain("<td>SHTS-MILK-15</td>");
  });

  it("uses a stable content hash for idempotency", () => {
    expect(hashSourceContent(simpleHtmlTableShopFixture)).toHaveLength(64);
    expect(hashSourceContent(simpleHtmlTableShopFixture)).toBe(hashSourceContent(simpleHtmlTableShopFixture));
  });
});
