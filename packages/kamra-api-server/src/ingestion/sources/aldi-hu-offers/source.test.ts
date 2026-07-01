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
    expect(rows[0]?.crawlContext).toContain("Magyar trappista sajt");
    expect(rows[0]?.crawlContext).toContain("Cikkszám: 123456 / 789012");
  });

  it("uses the previous product heading when the item-number line is only a descriptor", () => {
    const rows = parseAldiHuOffersText(
      [
        "Akciók hétfőtől szerdáig, 2026.06.29-től 2026.07.01-ig",
        "MILSANI Laktózmentes UHT tej, 1 l/doboz",
        "1,5 % zsírtartalom (239 Ft/l), Cikkszám: 62908",
        "MUCCI Jégkrém, 900 ml/doboz",
        "citrom-lime ízű, (1 554,44 Ft/l), Cikkszám: 737294",
        "KING’S CROWN Fehér bab, 800 g (530 g)/doboz",
        "(658,49 Ft/kg), (töltőtömeg) Cikkszám: 846186"
      ].join("\n"),
      "2026-07-01T16:00:00.000Z"
    );

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      description: "1,5 % zsírtartalom",
      displayName: "MILSANI Laktózmentes UHT tej, 1 l/doboz",
      sourceProductKey: "62908",
      unitPriceText: "239 Ft/l"
    });
    expect(rows[0]?.crawlContext).toContain("MILSANI Laktózmentes UHT tej, 1 l/doboz");
    expect(rows[0]?.crawlContext).toContain("1,5 % zsírtartalom");
    expect(rows[1]).toMatchObject({
      description: "citrom-lime ízű",
      displayName: "MUCCI Jégkrém, 900 ml/doboz",
      sourceProductKey: "737294",
      unitPriceText: "1 554,44 Ft/l"
    });
    expect(rows[2]).toMatchObject({
      description: "töltőtömeg",
      displayName: "KING’S CROWN Fehér bab, 800 g (530 g)/doboz",
      sourceProductKey: "846186",
      unitPriceText: "658,49 Ft/kg"
    });
  });
});
