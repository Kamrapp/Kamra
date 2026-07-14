import type { IngestionRawSnapshotRecord, ParsedShopProductRow } from "../v1/contracts.js";
import {
  lidlHuBrochureParserName,
  lidlHuBrochureParserVersion,
  lidlHuBrochureSourceName,
  parseLidlHuBrochureRows,
  type LidlHuBrochureSummary,
  type LidlHuPageText
} from "../sources/lidl-hu-brochure/source.js";

export const lidlHuBrochurePreviousParserVersion = "0.1.0";

export interface LidlBrochureParserRepairPlan {
  afterDuplicateRowCount: number;
  afterParserVersion: string;
  afterRowCount: number;
  beforeDuplicateRowCount: number;
  beforeParserVersion: string;
  beforeRowCount: number;
  parsedRows: ParsedShopProductRow[];
  snapshotId: string;
}

export function createLidlBrochureParserRepairPlan(
  snapshot: IngestionRawSnapshotRecord
): LidlBrochureParserRepairPlan {
  if (snapshot.sourceName !== lidlHuBrochureSourceName) {
    throw new Error("lidl_brochure_repair_source_mismatch");
  }

  if (snapshot.parserName !== lidlHuBrochureParserName) {
    throw new Error("lidl_brochure_repair_parser_mismatch");
  }

  const payload = parsePayload(snapshot.payloadText);
  const parsedRows = parseLidlHuBrochureRows(payload.brochure, payload.pages, snapshot.capturedAt);

  return {
    afterDuplicateRowCount: duplicateRowCount(parsedRows),
    afterParserVersion: lidlHuBrochureParserVersion,
    afterRowCount: parsedRows.length,
    beforeDuplicateRowCount: duplicateRowCount(snapshot.parsedRows),
    beforeParserVersion: snapshot.parserVersion,
    beforeRowCount: snapshot.parsedRows.length,
    parsedRows,
    snapshotId: snapshot.id
  };
}

function parsePayload(payloadText: string): {
  brochure: LidlHuBrochureSummary;
  pages: LidlHuPageText[];
} {
  let value: unknown;

  try {
    value = JSON.parse(payloadText);
  } catch {
    throw new Error("lidl_brochure_repair_payload_invalid_json");
  }

  if (!isRecord(value) || !isRecord(value["brochure"]) || !Array.isArray(value["pages"])) {
    throw new Error("lidl_brochure_repair_payload_shape_invalid");
  }

  return {
    brochure: value["brochure"] as unknown as LidlHuBrochureSummary,
    pages: value["pages"] as LidlHuPageText[]
  };
}

function duplicateRowCount(rows: readonly ParsedShopProductRow[]): number {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const identity = row.sourceRecordId?.trim() || row.sourceProductKey?.trim();
    if (!identity) continue;
    counts.set(identity, (counts.get(identity) ?? 0) + 1);
  }

  return [...counts.values()].reduce((total, count) => total + Math.max(0, count - 1), 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
