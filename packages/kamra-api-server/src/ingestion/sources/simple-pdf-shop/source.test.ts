import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  extractPdfTextLines,
  generateSimplePdfShopFixturePdf,
  hashPdfContent,
  parseSimplePdfShop
} from "./source.js";

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), "fixture.pdf");

describe("SimplePdfShop source", () => {
  it("generates a parseable PDF with product rows", async () => {
    const pdfBytes = await generateSimplePdfShopFixturePdf();
    const rows = await parseSimplePdfShop(pdfBytes, "2026-06-23T08:00:00.000Z");

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      countryCode: "HU",
      crawlContext:
        "SPS-MILK-15 | Kamra tej 1,5% | 1 l | tejtermek | 329 | 329 Ft/l | 2026-06-23 | 2026-06-29",
      displayName: "Kamra tej 1,5%",
      packageLabel: "1 l",
      sourceProductKey: "SPS-MILK-15",
      stock: {
        availability: "infinite",
        countryCode: "HU"
      },
      storeBrandKey: "simple-pdf-shop"
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
  });

  it("parses the committed PDF fixture", async () => {
    const fixtureBytes = await readFile(fixturePath);
    const rows = await parseSimplePdfShop(fixtureBytes, "2026-06-23T08:00:00.000Z");

    expect(rows.map((row) => row.sourceProductKey)).toEqual([
      "SPS-MILK-15",
      "SPS-BREAD-WHEAT",
      "SPS-EGG-M"
    ]);
  });

  it("uses a stable content hash for generated PDF bytes", async () => {
    const firstPdf = await generateSimplePdfShopFixturePdf();
    const secondPdf = await generateSimplePdfShopFixturePdf();

    expect(hashPdfContent(firstPdf)).toHaveLength(64);
    expect(hashPdfContent(firstPdf)).toBe(hashPdfContent(secondPdf));
  });

  it("extracts line-oriented PDF text for crawl debugging", async () => {
    const lines = await extractPdfTextLines(await generateSimplePdfShopFixturePdf());

    expect(lines).toContain("SimplePdfShop weekly prices");
    expect(lines).toContain(
      "sourceProductKey | displayName | packageLabel | categoryLabel | priceHuf | unitPriceLabel | validFrom | validTo"
    );
  });

  it("fails when the PDF does not contain the expected table header", async () => {
    await expect(
      parseSimplePdfShop(new Uint8Array([1, 2, 3]), "2026-06-23T08:00:00.000Z")
    ).rejects.toThrow();
  });
});
