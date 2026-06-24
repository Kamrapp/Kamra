import { describe, expect, it } from "vitest";

import { parsePennyHuOffers } from "./source.js";

const fixture = `<script type="application/json" id="__NUXT_DATA__">[
  {"product-group-ajanlatok-demo":1},
  {"products":2},
  [3],
  {"category":4,"name":5,"packageLabel":6,"price":7,"productId":8,"sku":9,"slug":10},
  "Friss húsok",
  "GRILLKOLBÁSZ MIX",
  "darab",
  {"baseUnitShort":11,"regular":12,"validityEnd":13,"validityStart":14},
  "product-id-1",
  "86-100016",
  "grillkolbasz-mix-86100016",
  "KG",
  {"perStandardizedQuantity":15,"value":16},
  "2026-06-24",
  "2026-06-18",
  99900,
  149900
]</script>`;

describe("PENNY HU offers source", () => {
  it("parses Nuxt product data into ingestion rows", () => {
    const rows = parsePennyHuOffers(fixture, "2026-06-23T15:30:00.000Z");

    expect(rows).toEqual([
      {
        categoryLabel: "Friss húsok",
        countryCode: "HU",
        displayName: "GRILLKOLBÁSZ MIX",
        packageLabel: "darab",
        priceObservations: [
          {
            currencyCode: "HUF",
            observedAt: "2026-06-23T15:30:00.000Z",
            price: 1499,
            unitPriceLabel: "999 Ft/kg",
            validFrom: "2026-06-18",
            validTo: "2026-06-24"
          }
        ],
        sourceProductKey: "86-100016",
        stock: {
          availability: "infinite",
          countryCode: "HU"
        },
        storeBrandKey: "penny-hu"
      }
    ]);
  });
});
