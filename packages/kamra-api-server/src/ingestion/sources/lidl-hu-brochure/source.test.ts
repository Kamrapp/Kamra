import { describe, expect, it } from "vitest";

import {
  discoverLidlHuBrochureSlugs,
  hashLidlHuBrochureContent,
  parseLidlHuBrochureRows,
  parseLidlHuBrochureSummary
} from "./source.js";

describe("Lidl HU brochure source", () => {
  it("discovers brochure slugs from the Lidl brochure index page", () => {
    const html = `
      <a href="/l/hu/ujsag/akcios-ujsag-27-het-2026/ar/0?lf=HHZ">Akciós újság</a>
      <a href="https://www.lidl.hu/l/hu/ujsag/akcios-ujsag-nonfood-27-het-2026/ar/0?lf=HHZ">Nonfood</a>
      <a href="/l/hu/ujsag/akcios-ujsag-27-het-2026/ar/0?lf=HHZ">Duplicate</a>
    `;

    expect(discoverLidlHuBrochureSlugs(html)).toEqual([
      "akcios-ujsag-27-het-2026",
      "akcios-ujsag-nonfood-27-het-2026"
    ]);
  });

  it("keeps food brochure summaries and ignores nonfood brochures", () => {
    const food = parseLidlHuBrochureSummary(
      JSON.stringify({
        success: true,
        flyer: {
          flyerUrlAbsolute: "https://www.lidl.hu/l/hu/ujsag/akcios-ujsag-27-het-2026/ar/0?lf=HHZ",
          id: "019f0432-abb7-753a-99c4-90190967c94f",
          offerEndDate: "2026-07-08",
          offerStartDate: "2026-07-02",
          pages: [
            {
              number: 1,
              pageType: "page"
            },
            {
              number: 2,
              pageType: "online"
            }
          ],
          pdfUrl: "https://example.invalid/lidl.pdf",
          slug: "akcios-ujsag-27-het-2026",
          title: "Akciós újság – 27. hét"
        }
      }),
      "akcios-ujsag-27-het-2026"
    );

    const nonfood = parseLidlHuBrochureSummary(
      JSON.stringify({
        success: true,
        flyer: {
          id: "nonfood",
          pdfUrl: "https://example.invalid/nonfood.pdf",
          slug: "akcios-ujsag-nonfood-27-het-2026",
          title: "Nonfood kínálatunk - 27. hét"
        }
      }),
      "akcios-ujsag-nonfood-27-het-2026"
    );

    expect(food).toMatchObject({
      endDate: "2026-07-08",
      flyerId: "019f0432-abb7-753a-99c4-90190967c94f",
      pageNumbers: [1],
      slug: "akcios-ujsag-27-het-2026",
      startDate: "2026-07-02",
      title: "Akciós újság – 27. hét"
    });
    expect(nonfood).toBeNull();
  });

  it("parses anchored product rows from noisy PDF page text", () => {
    const brochure = {
      endDate: "2026-07-08",
      flyerId: "019f0432-abb7-753a-99c4-90190967c94f",
      pageNumbers: [6],
      pdfUrl: "https://example.invalid/lidl.pdf",
      slug: "akcios-ujsag-27-het-2026",
      sourceUrl: "https://www.lidl.hu/l/hu/ujsag/akcios-ujsag-27-het-2026/ar/0?lf=HHZ",
      startDate: "2026-07-02",
      title: "Akciós újság – 27. hét"
    };
    const rows = parseLidlHuBrochureRows(
      brochure,
      [
        {
          pageNumber: 6,
          lines: [
            "FLORA",
            "Vajízű kenhető",
            "keverék",
            "225 g; 1 kg = 2 663 Ft",
            "191660",
            "599",
            "Szuper ár!",
            "FLORA",
            "ProActiv",
            "margarin",
            "Original / kardio",
            "400 g; 1 kg = 1 948 Ft",
            "192701 / 225908",
            "779",
            "Szuper ár!"
          ]
        }
      ],
      "2026-07-02T09:00:00.000Z"
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      displayName: "FLORA Vajízű kenhető keverék",
      packageLabel: "225 g; 1 kg = 2 663 Ft",
      priceObservations: [
        {
          price: 599,
          unitPriceLabel: "1 kg = 2 663 Ft",
          validFrom: "2026-07-02",
          validTo: "2026-07-08"
        }
      ],
      productIdentifiers: [
        {
          issuer: "lidl.hu",
          kind: "retailer_item_number",
          value: "191660"
        }
      ],
      sourceName: "lidl-hu-brochure",
      sourceProductKey: "191660",
      storeBrandKey: "lidl-hu"
    });
    expect(rows[1]?.sourceProductKey).toBe("192701/225908");
  });

  it("handles split package lines and multi-line item numbers without promoting fragments", () => {
    const brochure = {
      endDate: "2026-07-01",
      flyerId: "019eeee7-f889-7eb5-9d8d-f146b96e8847",
      pageNumbers: [9],
      pdfUrl: "https://example.invalid/lidl.pdf",
      slug: "akcios-ujsag-26-het-2026",
      sourceUrl: "https://www.lidl.hu/l/hu/ujsag/akcios-ujsag-26-het-2026/ar/0?lf=HHZ",
      startDate: "2026-06-25",
      title: "Akciós újság – 26. hét"
    };

    const rows = parseLidlHuBrochureRows(
      brochure,
      [
        {
          pageNumber: 9,
          lines: [
            "PILOS",
            "Cérnácska",
            "Hevített-gyúrt füstölt sajt",
            "100",
            "g; 1 kg = 4",
            "990 Ft",
            "7500057",
            "499",
            "Szuper ár!",
            "PÖTTYÖS",
            "Ízesített tejital",
            "Többféle",
            "300",
            "ml; 1 l = 1",
            "330 Ft",
            "6419752 / 6419753 /",
            "6412141 / 6414876",
            "399",
            "-20%",
            "499",
            "Ft",
            "Jó választás",
            "a hazai",
            "PILOS",
            "Tejföl",
            "Zsírtartalom: 12%",
            "1000",
            "g",
            "6403367",
            "679",
            "779",
            "Ft"
          ]
        }
      ],
      "2026-07-02T09:00:00.000Z"
    );

    expect(
      rows.map((row) => ({
        key: row.sourceProductKey,
        name: row.displayName,
        packageLabel: row.packageLabel,
        price: row.priceObservations?.[0]?.price ?? null
      }))
    ).toEqual([
      {
        key: "7500057",
        name: "PILOS Cérnácska Hevített-gyúrt füstölt sajt",
        packageLabel: "100 g; 1 kg = 4 990 Ft",
        price: 499
      },
      {
        key: "6419752/6419753/6412141/6414876",
        name: "PÖTTYÖS Ízesített tejital Többféle",
        packageLabel: "300 ml; 1 l = 1 330 Ft",
        price: 399
      },
      {
        key: "6403367",
        name: "PILOS Tejföl",
        packageLabel: "1000 g",
        price: 679
      }
    ]);
  });

  it("uses a stable PDF byte hash", () => {
    const bytes = new Uint8Array([1, 2, 3]);

    expect(hashLidlHuBrochureContent(bytes)).toHaveLength(64);
    expect(hashLidlHuBrochureContent(bytes)).toBe(hashLidlHuBrochureContent(bytes));
  });
});
