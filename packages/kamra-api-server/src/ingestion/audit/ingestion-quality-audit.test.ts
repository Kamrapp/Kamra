import { describe, expect, it } from "vitest";
import type { IngestionRawSnapshotRecord, IngestionRunRecord } from "../v1/contracts.js";
import {
  applyIngestionCorrectionOverlays,
  assertIngestionCorrectionOverlay,
  auditIngestionQuality,
  createIngestionCorrectionSourceFingerprint,
  ingestionCorrectionOverlaySchemaVersion
} from "./ingestion-quality-audit.js";

const run: IngestionRunRecord = {
  crawlDate: "2026-07-13",
  crawlRunId: "run-1",
  createdAt: "2026-07-13T09:00:00.000Z",
  failedCount: 0,
  insertedSnapshotCount: 1,
  skippedSnapshotCount: 0,
  sourceName: "synthetic",
  startedAt: "2026-07-13T09:00:00.000Z",
  status: "completed",
  updatedAt: "2026-07-13T09:00:00.000Z",
  workflowName: "synthetic",
  completedAt: "2026-07-13T09:01:00.000Z",
  id: "run-1"
};

function snapshot(rows: IngestionRawSnapshotRecord["parsedRows"]): IngestionRawSnapshotRecord {
  return {
    capturedAt: "2026-07-13T09:01:00.000Z",
    contentHash: "hash",
    contentType: "text/html",
    crawlDate: "2026-07-13",
    crawlRunId: "run-1",
    id: "synthetic:page-1:2026-07-13",
    parsedRows: rows,
    parserName: "synthetic",
    parserVersion: "1.0.0",
    payloadText: "raw",
    sourceName: "synthetic",
    sourceRecordId: "page-1",
    workflowName: "synthetic"
  };
}

describe("ingestion quality audit", () => {
  it("reports duplicate and malformed source rows without mutating input", () => {
    const source = snapshot([
      { countryCode: "HU", displayName: "", sourceRecordId: "row-1" },
      { countryCode: "HU", displayName: "same", sourceRecordId: "row-1", priceValue: -1 }
    ]);
    const report = auditIngestionQuality({ issueLimit: 10, runs: [run], snapshots: [source] });

    expect(report.rows).toBe(2);
    expect(report.issues.map((item) => item.code)).toEqual([
      "row_missing_display_name",
      "duplicate_row_identity",
      "row_price_invalid"
    ]);
    expect(source.parsedRows).toHaveLength(2);
  });

  it("bounds issues and validates a correction overlay separately from raw data", () => {
    const source = snapshot([
      { countryCode: "HU", displayName: "", sourceRecordId: "row-1", priceValue: -1 }
    ]);
    const report = auditIngestionQuality({ issueLimit: 1, runs: [run], snapshots: [source] });
    expect(report.issues).toHaveLength(1);
    expect(report.issuesTruncated).toBe(true);

    expect(() =>
      assertIngestionCorrectionOverlay({
        correctedFields: { displayName: "Corrected milk" },
        reason: "Verified against the source page.",
        reviewedAt: "2026-07-13T10:00:00.000Z",
        reviewer: { id: "admin", name: "Admin" },
        rowIndex: 0,
        schemaVersion: ingestionCorrectionOverlaySchemaVersion,
        snapshotId: source.id,
        sourceFingerprint: "fingerprint",
        tool: { name: "manual-review", version: "1.0.0" }
      })
    ).not.toThrow();
    expect(() =>
      assertIngestionCorrectionOverlay({
        correctedFields: { payloadText: "must not copy raw payload" },
        reason: "bad",
        reviewedAt: "2026-07-13T10:00:00.000Z",
        reviewer: { id: "admin", name: "Admin" },
        rowIndex: 0,
        schemaVersion: ingestionCorrectionOverlaySchemaVersion,
        snapshotId: source.id,
        sourceFingerprint: "fingerprint",
        tool: { name: "manual-review", version: "1.0.0" }
      })
    ).toThrow("correction_overlay_field_not_allowed:payloadText");
  });

  it("applies a reviewed row correction without changing the raw snapshot", () => {
    const source = snapshot([{ countryCode: "HU", displayName: "Tej", sourceRecordId: "row-1" }]);
    const overlay = {
      correctedFields: { displayName: "Corrected milk" },
      reason: "Verified against the source page.",
      reviewedAt: "2026-07-13T10:00:00.000Z",
      reviewer: { id: "admin", name: "Admin" },
      rowIndex: 0,
      schemaVersion: ingestionCorrectionOverlaySchemaVersion,
      snapshotId: source.id,
      sourceFingerprint: createIngestionCorrectionSourceFingerprint(source, 0),
      tool: { name: "manual-review", version: "1.0.0" }
    } as const;
    const corrected = applyIngestionCorrectionOverlays(source, [overlay]);

    expect(corrected.parsedRows[0]?.displayName).toBe("Corrected milk");
    expect(source.parsedRows[0]?.displayName).toBe("Tej");
    expect(() =>
      applyIngestionCorrectionOverlays(source, [
        { ...overlay, sourceFingerprint: "stale-fingerprint" }
      ])
    ).toThrow("correction_overlay_source_conflict");
  });
});
