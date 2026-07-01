import { describe, expect, it } from "vitest";

import { parseCoopHuOffersText } from "./source.js";

describe("COOP HU offers source", () => {
  it("keeps coupon prices separate from normal offer prices", () => {
    const rows = parseCoopHuOffersText(
      [
        "FRISS AKCIÓK",
        "Érvényes: 2026. 06. 24. - 2026. 06. 30.",
        "Pannónia sajt szeletelt",
        "999 Ft/db",
        "1 998 Ft/kg",
        "KUPONOS ÁR!",
        "899 Ft/db",
        "1 798 Ft/kg"
      ].join("\n"),
      "2026-06-27T08:00:00.000Z"
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      countryCode: "HU",
      displayName: "Pannónia sajt szeletelt",
      priceText: "999 Ft/db",
      priceValue: 999,
      sourceName: "coop-hu-offers",
      unitPriceText: "1 998 Ft/kg",
      validFrom: "2026-06-24",
      validTo: "2026-06-30"
    });
    expect(rows[0]?.priceObservations).toEqual([
      {
        currencyCode: "HUF",
        observedAt: "2026-06-27T08:00:00.000Z",
        price: 999,
        priceKind: "offer",
        unitPriceLabel: "1 998 Ft/kg",
        validFrom: "2026-06-24",
        validTo: "2026-06-30"
      },
      {
        currencyCode: "HUF",
        observedAt: "2026-06-27T08:00:00.000Z",
        price: 899,
        priceKind: "coupon",
        unitPriceLabel: "1 798 Ft/kg",
        validFrom: "2026-06-24",
        validTo: "2026-06-30"
      }
    ]);
    expect(rows[0]?.metadata).toMatchObject({
      couponPriceText: "899 Ft/db",
      couponUnitPriceText: "1 798 Ft/kg"
    });
  });
});
