import { describe, expect, it } from "vitest";
import type { IngestionRawSnapshotRecord } from "../v1/contracts.js";
import {
  createLidlBrochureParserRepairPlan,
  lidlHuBrochurePreviousParserVersion
} from "./lidl-brochure-parser-repair.js";

describe("Lidl brochure parser repair", () => {
  it("plans a historical row correction without changing the raw payload", () => {
    const payloadText = JSON.stringify({
      brochure: {
        endDate: "2026-07-01",
        flyerId: "flyer-26",
        pageNumbers: [24],
        pdfUrl: "https://example.invalid/lidl.pdf",
        slug: "akcios-ujsag-26-het-2026",
        sourceUrl: "https://example.invalid/lidl/26",
        startDate: "2026-06-25",
        title: "Akciós újság – 26. hét"
      },
      pages: [
        {
          lines: [
            "BALLINO",
            "Tölcséres jégkrém",
            "Pisztáciás",
            "120 g; 1 kg = 1 492 Ft",
            "5503268",
            "179",
            "Ft",
            "BALLINO",
            "BALLINO",
            "Tölcséres j",
            "Tölcséres j",
            "Pisztáciás",
            "Pisztáciás",
            "120 g; 1 kg = 1 492 Ft",
            "120 g; 1 kg = 1 492 Ft",
            "5503268",
            "5503268",
            "179",
            "Lidl Plus-szal"
          ],
          pageNumber: 24
        }
      ]
    });
    const snapshot = {
      capturedAt: "2026-07-02T09:00:00.000Z",
      contentHash: "hash",
      contentType: "application/json",
      crawlDate: "2026-07-02",
      crawlRunId: "run",
      id: "lidl-hu-brochure:akcios-ujsag-26-het-2026:2026-07-02",
      parserName: "LidlHuBrochurePdfParser",
      parserVersion: lidlHuBrochurePreviousParserVersion,
      parsedRows: [
        {
          countryCode: "HU",
          displayName: "duplicated",
          sourceRecordId: "akcios-ujsag-26-het-2026:page-24:item-5503268",
          sourceProductKey: "5503268"
        },
        {
          countryCode: "HU",
          displayName: "duplicated again",
          sourceRecordId: "akcios-ujsag-26-het-2026:page-24:item-5503268",
          sourceProductKey: "5503268"
        }
      ],
      payloadText,
      sourceName: "lidl-hu-brochure",
      sourceRecordId: "akcios-ujsag-26-het-2026",
      workflowName: "lidl-hu-brochure-pdf"
    } satisfies IngestionRawSnapshotRecord;

    const plan = createLidlBrochureParserRepairPlan(snapshot);

    expect(plan).toMatchObject({
      afterDuplicateRowCount: 0,
      afterParserVersion: "0.1.1",
      beforeDuplicateRowCount: 1,
      beforeParserVersion: lidlHuBrochurePreviousParserVersion,
      beforeRowCount: 2,
      snapshotId: snapshot.id
    });
    expect(plan.parsedRows).toHaveLength(1);
    expect(snapshot.payloadText).toBe(payloadText);
  });
});
