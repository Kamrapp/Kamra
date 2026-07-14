import { describe, expect, it } from "vitest";

import { assertCatalogV1SeedDataset } from "../../catalog/v1/validation.js";
import type { IngestionRawSnapshotRecord, ParsedShopProductRow } from "../v1/contracts.js";
import {
  createFailedSourceOfferProcessingDataset,
  createSourceOfferRecordFingerprint,
  processSourceOfferSnapshot,
  sourceOfferProcessorVersion
} from "./source-offer-processor.js";

const capturedAt = "2026-07-01T08:00:00.000Z";
const processedAt = "2026-07-01T09:00:00.000Z";

describe("Source offer catalog processor", () => {
  it("maps parsed rows into catalog records with separate price observations", () => {
    const snapshot = createSnapshot("coop-hu-offers", "coop-record-1", [
      {
        countryCode: "HU",
        displayName: "Pannónia sajt szeletelt",
        observedAt: capturedAt,
        priceObservations: [
          {
            currencyCode: "HUF",
            observedAt: capturedAt,
            price: 999,
            priceKind: "offer",
            unitPriceLabel: "1 998 Ft/kg",
            validFrom: "2026-06-24",
            validTo: "2026-06-30"
          },
          {
            currencyCode: "HUF",
            observedAt: capturedAt,
            price: 899,
            priceKind: "coupon",
            unitPriceLabel: "1 798 Ft/kg",
            validFrom: "2026-06-24",
            validTo: "2026-06-30"
          }
        ],
        sourceRecordId: "coop-record-1",
        sourceUrl: "https://www.coop.hu/akcios-termekek/",
        storeBrandKey: "coop-hu",
        validFrom: "2026-06-24",
        validTo: "2026-06-30"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result).toMatchObject({
      processedRowCount: 1,
      skippedRowCount: 0
    });
    expect(result.dataset.priceObservations).toHaveLength(2);
    expect(result.dataset.priceObservations.map((price) => price.priceKind)).toEqual([
      "offer",
      "coupon"
    ]);
    expect(result.dataset.stocks).toMatchObject([
      {
        location: {
          kind: "global_shop_availability",
          label: "COOP Hungary",
          locationKey: "availability:coop-hu",
          storeBrandKey: "coop-hu"
        },
        price: null,
        quantity: {
          amount: 1,
          packageCount: null,
          unit: "availability"
        }
      }
    ]);
  });

  it("keeps retailer identifiers separate from product identity", () => {
    const snapshot = createSnapshot("aldi-hu-offers", "aldi-record-1", [
      {
        countryCode: "HU",
        displayName: "Magyar trappista sajt",
        metadata: {
          itemNumbers: ["123456", "789012"]
        },
        observedAt: capturedAt,
        priceText: null,
        priceValue: null,
        sourceRecordId: "aldi-record-1",
        unitPriceText: "1 998 Ft/kg"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result.dataset.priceObservations).toEqual([]);
    expect(result.dataset.products[0]?.id).toBe("product_name_magyar_trappista_sajt");
    expect(result.dataset.productSourceIdentifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "retailer_product_id",
          sourceName: "aldi-hu-offers",
          value: "aldi-record-1"
        }),
        expect.objectContaining({
          kind: "retailer_item_number",
          sourceName: "aldi-hu-offers",
          value: "123456"
        }),
        expect.objectContaining({
          kind: "retailer_item_number",
          sourceName: "aldi-hu-offers",
          value: "789012"
        })
      ])
    );
  });

  it("keeps package-different same-name rows as separate fallback products", () => {
    const snapshot = createSnapshot("simple_html_table_shop", "simple-package-record", [
      {
        countryCode: "HU",
        displayName: "Kamra tej",
        packageLabel: "1 l",
        sourceProductKey: "SHTS-MILK-1L"
      },
      {
        countryCode: "HU",
        displayName: "Kamra tej",
        packageLabel: "500 ml",
        sourceProductKey: "SHTS-MILK-500ML"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result.dataset.products.map((product) => product.id)).toEqual([
      "product_name_kamra_tej_1_l",
      "product_name_kamra_tej_500_ml"
    ]);
  });

  it("uses the SimplePdfShop availability location for PDF source rows", () => {
    const snapshot = createSnapshot("simple_pdf_shop", "weekly-product-pdf", [
      {
        countryCode: "HU",
        displayName: "Kamra tej 1,5%",
        packageLabel: "1 l",
        sourceProductKey: "SPS-MILK-15",
        storeBrandKey: "simple-pdf-shop"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result.dataset.stocks).toMatchObject([
      {
        location: {
          label: "SimplePdfShop",
          locationKey: "availability:simple-pdf-shop",
          storeBrandKey: "simple-pdf-shop"
        }
      }
    ]);
  });

  it("uses the Lidl Hungary availability location for Lidl brochure rows", () => {
    const snapshot = createSnapshot("lidl-hu-brochure", "akcios-ujsag-27-het-2026", [
      {
        countryCode: "HU",
        displayName: "FLORA Vajízű kenhető keverék",
        sourceProductKey: "191660",
        storeBrandKey: "lidl-hu"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result.dataset.stocks).toMatchObject([
      {
        location: {
          label: "Lidl Hungary",
          locationKey: "availability:lidl-hu",
          storeBrandKey: "lidl-hu"
        }
      }
    ]);
  });

  it("deduplicates product records while keeping separate source records", () => {
    const snapshot = createSnapshot("mixed-source-test", "mixed-record-1", [
      {
        countryCode: "HU",
        displayName: "Kamra tej 1,5%",
        productIdentifiers: [
          {
            kind: "retailer_item_number",
            value: "retailer-a-1"
          }
        ],
        sourceName: "penny_hu_offers",
        sourceProductKey: "penny-milk"
      },
      {
        countryCode: "HU",
        displayName: "Kamra tej 1,5%",
        productIdentifiers: [
          {
            kind: "retailer_item_number",
            value: "retailer-b-1"
          }
        ],
        sourceName: "aldi-hu-offers",
        sourceProductKey: "aldi-milk"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result.dataset.products).toHaveLength(1);
    expect(result.dataset.products[0]).toMatchObject({
      id: "product_name_kamra_tej_1_5",
      normalizedName: "kamra tej 1,5%"
    });
    expect(result.dataset.products[0]?.origin).toHaveLength(2);
    expect(result.dataset.productSources).toHaveLength(2);
  });

  it("merges only by common identifiers or exact normalized names", () => {
    const snapshot = createSnapshot("mixed-source-test", "mixed-record-1", [
      {
        countryCode: "HU",
        displayName: "Kamra tej 1,5%",
        productIdentifiers: [
          {
            kind: "retailer_item_number",
            value: "retailer-a-1"
          }
        ],
        sourceName: "penny_hu_offers",
        sourceProductKey: "penny-milk"
      },
      {
        countryCode: "HU",
        displayName: "Kamra tej 1,5%",
        productIdentifiers: [
          {
            kind: "retailer_item_number",
            value: "retailer-b-1"
          }
        ],
        sourceName: "aldi-hu-offers",
        sourceProductKey: "aldi-milk"
      },
      {
        countryCode: "HU",
        displayName: "Completely different label",
        productIdentifiers: [
          {
            kind: "gtin",
            value: "5991234567890"
          }
        ],
        sourceName: "coop-hu-offers",
        sourceProductKey: "coop-milk"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result.dataset.products.map((product) => product.id)).toEqual([
      "product_name_kamra_tej_1_5",
      "product_gtin_5991234567890"
    ]);
  });

  it("keeps old flat price fields processable", () => {
    const snapshot = createSnapshot("penny_hu_offers", "penny-record-1", [
      {
        countryCode: "HU",
        displayName: "Durum spaghetti",
        observedAt: capturedAt,
        packageLabel: "500 g",
        priceValue: 449,
        sourceProductKey: "86-100016",
        unitPriceText: "898 Ft/kg",
        validFrom: "2026-06-23",
        validTo: "2026-06-29"
      }
    ]);

    const result = processSourceOfferSnapshot(snapshot, processedAt);

    expect(() => assertCatalogV1SeedDataset(result.dataset)).not.toThrow();
    expect(result.dataset.products[0]).toMatchObject({
      id: "product_name_durum_spaghetti_500_g",
      measurements: [
        {
          normalizedUnit: "g",
          normalizedValue: 500,
          unit: "g",
          value: 500
        }
      ],
      normalizedName: "durum spaghetti"
    });
    expect(result.dataset.priceObservations).toMatchObject([
      {
        price: {
          amount: 449,
          currencyCode: "HUF"
        },
        priceKind: "offer",
        unitPriceLabel: "898 Ft/kg",
        validFrom: "2026-06-23",
        validTo: "2026-06-29"
      }
    ]);
  });

  it("uses deterministic ids when the same snapshot is reprocessed", () => {
    const snapshot = createSnapshot("simple_html_table_shop", "simple-record-1", [
      {
        countryCode: "HU",
        displayName: "Felbarna kenyer",
        observedAt: capturedAt,
        packageLabel: "500 g",
        priceObservations: [
          {
            currencyCode: "HUF",
            observedAt: capturedAt,
            price: 449,
            unitPriceLabel: "898 Ft/kg"
          }
        ],
        sourceProductKey: "SHTS-BREAD-WHEAT",
        storeBrandKey: "simple-html-table-shop"
      }
    ]);

    const first = processSourceOfferSnapshot(snapshot, processedAt);
    const second = processSourceOfferSnapshot(snapshot, processedAt);

    expect(second.dataset).toEqual(first.dataset);
  });

  it("uses snapshot-specific processing fingerprints", () => {
    const first = createSnapshot("penny_hu_offers", "record-a", []);
    const second = {
      ...createSnapshot("penny_hu_offers", "record-b", []),
      contentHash: first.contentHash
    };

    expect(createSourceOfferRecordFingerprint(first)).not.toBe(
      createSourceOfferRecordFingerprint(second)
    );
  });

  it("creates failed processing states for bad snapshots", () => {
    const snapshot = createSnapshot("penny_hu_offers", "broken-record", []);
    const dataset = createFailedSourceOfferProcessingDataset(snapshot, processedAt, {
      code: "snapshot_processing_failed",
      message: "Example failure."
    });

    expect(() => assertCatalogV1SeedDataset(dataset)).not.toThrow();
    expect(dataset.sourceRecordProcessingStates).toMatchObject([
      {
        lastErrorCode: "snapshot_processing_failed",
        lastErrorMessage: "Example failure.",
        lastProcessedAt: null,
        processorVersion: sourceOfferProcessorVersion,
        recordFingerprint: createSourceOfferRecordFingerprint(snapshot),
        state: "failed"
      }
    ]);
  });
});

function createSnapshot(
  sourceName: string,
  sourceRecordId: string,
  parsedRows: ParsedShopProductRow[]
): IngestionRawSnapshotRecord {
  return {
    capturedAt,
    contentHash: `hash-${sourceName}-${sourceRecordId}`,
    contentType: "text/plain",
    crawlDate: "2026-07-01",
    crawlRunId: `test:${sourceName}:2026-07-01`,
    id: `${sourceName}:${sourceRecordId}:2026-07-01`,
    parserName: "test-parser",
    parserVersion: "0.0.0",
    parsedRows,
    payloadText: "test payload",
    sourceName,
    sourceRecordId,
    sourceUrl: `https://example.invalid/${sourceName}/${sourceRecordId}`,
    workflowName: "test-workflow"
  };
}
