import { describe, expect, it } from "vitest";

import { parseAldiHuOffersText } from "./source.js";

describe("ALDI HU offers source", () => {
  it("keeps retailer item numbers as typed identifiers", () => {
    const rows = parseAldiHuOffersText(
      [
        "Akciós ajánlatok 2026.06.26-tól 2026.06.29-ig",
        "Magyar trappista sajt",
        "Cikkszám: 123456 / 789012 (1 998 Ft/kg)"
      ].join("\n"),
      "2026-06-27T08:00:00.000Z"
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      countryCode: "HU",
      displayName: "Magyar trappista sajt",
      sourceName: "aldi-hu-offers",
      sourceProductKey: "123456",
      unitPriceText: "1 998 Ft/kg",
      validFrom: "2026-06-26",
      validTo: "2026-06-29",
      productIdentifiers: [
        {
          issuer: "aldi.hu",
          kind: "retailer_item_number",
          value: "123456"
        },
        {
          issuer: "aldi.hu",
          kind: "retailer_item_number",
          value: "789012"
        }
      ]
    });
    expect(rows[0]?.priceObservations).toEqual([]);
  });
});
