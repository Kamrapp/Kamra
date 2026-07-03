import { describe, expect, it } from "vitest";

import type { IngestionRawSnapshotRecord } from "../v1/contracts.js";
import { buildSourceOfferReviewCandidate } from "./source-offer-candidate.js";

const capturedAt = "2026-07-01T08:00:00.000Z";

describe("Source offer review candidate builder", () => {
  it("prefers gtin-based confidence and keeps parsed price context", () => {
    const candidate = buildSourceOfferReviewCandidate(
      createSnapshot("lidl-hu-brochure", "row-1"),
      {
        countryCode: "HU",
        displayName: "FLORA Vajízű kenhető keverék",
        packageLabel: "250 g",
        priceObservations: [
          {
            currencyCode: "HUF",
            observedAt: capturedAt,
            price: 499,
            priceKind: "offer",
            unitPriceLabel: "1 996 Ft/kg"
          }
        ],
        productIdentifiers: [
          {
            kind: "gtin",
            value: "5991234567890"
          }
        ],
        rawName: "FLORA Vajízű kenhető keverék",
        sourceRecordId: "row-1",
        sourceUrl: "https://example.invalid/lidl/flora",
        storeBrandKey: "lidl-hu"
      },
      0
    );

    expect(candidate.candidate.matchConfidence).toBe("strong_identifier");
    expect(candidate.candidate.product).toMatchObject({
      kind: "grocery",
      measurements: [
        {
          normalizedUnit: "g",
          normalizedValue: 250,
          unit: "g",
          value: 250
        }
      ],
      name: "FLORA Vajízű kenhető keverék",
      normalizedName: "flora vajízű kenhető keverék"
    });
    expect(candidate.candidate.priceObservations).toHaveLength(1);
    expect(candidate.rawRowPreview).toMatchObject({
      sourceProductKey: "lidl-hu-brochure:row-1"
    });
  });

  it("falls back to strong source-key confidence when the row already has a source key", () => {
    const candidate = buildSourceOfferReviewCandidate(
      createSnapshot("penny_hu_offers", "row-2"),
      {
        countryCode: "HU",
        displayName: "Kamra tej 1,5%",
        sourceProductKey: "penny-milk-15",
        sourceRecordId: "row-2"
      },
      0
    );

    expect(candidate.candidate.matchConfidence).toBe("strong_source_key");
    expect(candidate.candidate.source.sourceProductKey).toBe("penny-milk-15");
  });

  it("falls back to source-scoped review confidence when only the source is known", () => {
    const candidate = buildSourceOfferReviewCandidate(
      createSnapshot("simple_html_table_shop", "row-3"),
      {
        countryCode: "HU",
        displayName: "Saját márkás tej",
        sourceRecordId: "row-3"
      },
      2
    );

    expect(candidate.candidate.matchConfidence).toBe("source_scoped_name");
    expect(candidate.candidate.source.sourceProductKey).toBe("simple_html_table_shop:row-3");
  });
});

function createSnapshot(sourceName: string, sourceRecordId: string): IngestionRawSnapshotRecord {
  return {
    capturedAt,
    contentHash: `hash-${sourceName}-${sourceRecordId}`,
    contentType: "text/plain",
    crawlDate: "2026-07-01",
    crawlRunId: `test:${sourceName}:2026-07-01`,
    id: `${sourceName}:${sourceRecordId}:2026-07-01`,
    parserName: "test-parser",
    parserVersion: "0.0.0",
    parsedRows: [],
    payloadText: "test payload",
    sourceName,
    sourceRecordId,
    sourceUrl: `https://example.invalid/${sourceName}/${sourceRecordId}`,
    workflowName: "test-workflow"
  };
}
