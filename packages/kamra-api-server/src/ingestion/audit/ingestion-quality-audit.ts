import { createHash } from "node:crypto";
import type {
  IngestionRawSnapshotRecord,
  IngestionRunRecord,
  ParsedShopProductIdentifier,
  ParsedShopProductRow
} from "../v1/contracts.js";
import { stableStringify } from "../archive/crawl-archive.js";

export const ingestionCorrectionOverlaySchemaVersion = "ingestion-correction-overlay-v1" as const;

export type IngestionAuditSeverity = "error" | "warning";

export interface IngestionQualityIssue {
  code: string;
  message: string;
  rowIndex?: number;
  severity: IngestionAuditSeverity;
  snapshotId?: string;
  sourceName?: string;
}

export interface IngestionQualityReport {
  issueLimit: number;
  issues: IngestionQualityIssue[];
  issuesTruncated: boolean;
  rows: number;
  snapshots: number;
  sources: Array<{
    issues: number;
    rows: number;
    snapshots: number;
    sourceName: string;
  }>;
  runs: number;
}

export interface IngestionCorrectionFields {
  categoryLabel?: string | null;
  description?: string | null;
  displayName?: string;
  packageLabel?: string | null;
  priceValue?: number | null;
  productIdentifiers?: ParsedShopProductIdentifier[];
  sourceProductKey?: string | null;
  unitPriceText?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface IngestionCorrectionOverlay {
  correctedFields: IngestionCorrectionFields;
  reason: string;
  reviewedAt: string;
  reviewer: {
    id: string;
    name: string;
  };
  rowIndex: number;
  schemaVersion: typeof ingestionCorrectionOverlaySchemaVersion;
  snapshotId: string;
  sourceFingerprint: string;
  tool: {
    name: string;
    version: string;
  };
}

const allowedCorrectionFields = new Set<keyof IngestionCorrectionFields>([
  "categoryLabel",
  "description",
  "displayName",
  "packageLabel",
  "priceValue",
  "productIdentifiers",
  "sourceProductKey",
  "unitPriceText",
  "validFrom",
  "validTo"
]);

export function auditIngestionQuality(input: {
  issueLimit?: number;
  runs: readonly IngestionRunRecord[];
  snapshots: readonly IngestionRawSnapshotRecord[];
}): IngestionQualityReport {
  const issueLimit = Math.max(1, Math.floor(input.issueLimit ?? 500));
  const issues: IngestionQualityIssue[] = [];
  const sourceStats = new Map<string, { issues: number; rows: number; snapshots: number }>();
  let issuesTruncated = false;
  let rows = 0;

  const addIssue = (issue: IngestionQualityIssue): void => {
    const source = issue.sourceName ?? "<unknown>";
    const stats = sourceStats.get(source) ?? { issues: 0, rows: 0, snapshots: 0 };
    stats.issues += 1;
    sourceStats.set(source, stats);
    if (issues.length < issueLimit) issues.push(issue);
    else issuesTruncated = true;
  };

  const runIds = new Set<string>();
  for (const run of input.runs) {
    if (!nonEmpty(run.crawlRunId)) addIssue(issue("run_missing_id", "Crawl run id is empty."));
    if (runIds.has(run.crawlRunId)) {
      addIssue(issue("duplicate_crawl_run_id", `Crawl run id is duplicated: ${run.crawlRunId}.`));
    }
    runIds.add(run.crawlRunId);
    if (run.status === "completed" && !nonEmpty(run.completedAt)) {
      addIssue(
        issue("completed_run_missing_timestamp", "Completed crawl run has no completedAt.", {
          sourceName: run.sourceName
        })
      );
    }
    if (run.failedCount < 0 || run.insertedSnapshotCount < 0 || run.skippedSnapshotCount < 0) {
      addIssue(
        issue("negative_run_count", `Crawl run ${run.crawlRunId} contains a negative count.`, {
          sourceName: run.sourceName
        })
      );
    }
  }

  const snapshotIdentity = new Set<string>();
  for (const snapshot of input.snapshots) {
    const stats = sourceStats.get(snapshot.sourceName) ?? { issues: 0, rows: 0, snapshots: 0 };
    stats.snapshots += 1;
    sourceStats.set(snapshot.sourceName, stats);
    const identity = `${snapshot.sourceName}:${snapshot.sourceRecordId}:${snapshot.crawlDate}`;
    if (snapshotIdentity.has(identity)) {
      addIssue(
        issue("duplicate_snapshot_identity", `Snapshot identity is duplicated: ${identity}.`, {
          snapshotId: snapshot.id,
          sourceName: snapshot.sourceName
        })
      );
    }
    snapshotIdentity.add(identity);
    if (snapshot.id !== identity) {
      addIssue(
        issue(
          "snapshot_id_mismatch",
          `Snapshot id does not match its stable identity: ${snapshot.id}.`,
          {
            snapshotId: snapshot.id,
            sourceName: snapshot.sourceName
          }
        )
      );
    }
    if (!nonEmpty(snapshot.contentHash))
      addIssue(
        issue(
          "snapshot_missing_content_hash",
          "Snapshot content hash is empty.",
          snapshotRef(snapshot)
        )
      );
    if (!nonEmpty(snapshot.parserName) || !nonEmpty(snapshot.parserVersion)) {
      addIssue(
        issue(
          "snapshot_missing_parser_identity",
          "Snapshot parser identity is incomplete.",
          snapshotRef(snapshot)
        )
      );
    }
    if (!runIds.has(snapshot.crawlRunId)) {
      addIssue(
        issue(
          "snapshot_missing_crawl_run",
          `Snapshot references unknown crawl run: ${snapshot.crawlRunId}.`,
          snapshotRef(snapshot)
        )
      );
    }

    const rowIdentities = new Set<string>();
    for (const [rowIndex, row] of snapshot.parsedRows.entries()) {
      rows += 1;
      const rowStats = sourceStats.get(snapshot.sourceName) ?? { issues: 0, rows: 0, snapshots: 0 };
      rowStats.rows += 1;
      sourceStats.set(snapshot.sourceName, rowStats);
      auditRow(row, snapshot, rowIndex, rowIdentities, addIssue);
    }
  }

  return {
    issueLimit,
    issues: issues.sort(compareIssues),
    issuesTruncated,
    rows,
    snapshots: input.snapshots.length,
    sources: [...sourceStats.entries()]
      .map(([sourceName, stats]) => ({ sourceName, ...stats }))
      .sort((left, right) => left.sourceName.localeCompare(right.sourceName)),
    runs: input.runs.length
  };
}

export function assertIngestionCorrectionOverlay(
  value: unknown
): asserts value is IngestionCorrectionOverlay {
  if (!isRecord(value)) throw new Error("correction_overlay_must_be_an_object");
  if (value["schemaVersion"] !== ingestionCorrectionOverlaySchemaVersion)
    throw new Error("correction_overlay_schema_version_not_supported");
  if (!nonEmpty(value["snapshotId"]) || !nonEmpty(value["sourceFingerprint"]))
    throw new Error("correction_overlay_identity_required");
  if (!Number.isInteger(value["rowIndex"]) || Number(value["rowIndex"]) < 0)
    throw new Error("correction_overlay_row_index_invalid");
  if (!nonEmpty(value["reason"]) || !isIsoDateTime(value["reviewedAt"]))
    throw new Error("correction_overlay_review_metadata_invalid");
  if (
    !isRecord(value["tool"]) ||
    !nonEmpty(value["tool"]["name"]) ||
    !nonEmpty(value["tool"]["version"])
  )
    throw new Error("correction_overlay_tool_invalid");
  if (
    !isRecord(value["reviewer"]) ||
    !nonEmpty(value["reviewer"]["id"]) ||
    !nonEmpty(value["reviewer"]["name"])
  )
    throw new Error("correction_overlay_reviewer_invalid");
  if (!isRecord(value["correctedFields"]) || Object.keys(value["correctedFields"]).length === 0)
    throw new Error("correction_overlay_fields_required");

  for (const [key, fieldValue] of Object.entries(value["correctedFields"])) {
    if (!allowedCorrectionFields.has(key as keyof IngestionCorrectionFields))
      throw new Error(`correction_overlay_field_not_allowed:${key}`);
    if (key === "displayName" && !nonEmpty(fieldValue))
      throw new Error("correction_overlay_display_name_invalid");
    if (
      key === "priceValue" &&
      fieldValue !== null &&
      (!isFiniteNumber(fieldValue) || Number(fieldValue) < 0)
    )
      throw new Error("correction_overlay_price_invalid");
    if (key === "productIdentifiers" && !isIdentifierList(fieldValue))
      throw new Error("correction_overlay_identifiers_invalid");
  }
}

export function createIngestionCorrectionSourceFingerprint(
  snapshot: IngestionRawSnapshotRecord,
  rowIndex: number
): string {
  const row = snapshot.parsedRows[rowIndex];
  if (!row) throw new Error("correction_overlay_row_not_found");
  return createHash("sha256")
    .update(
      stableStringify({
        contentHash: snapshot.contentHash,
        row,
        rowIndex,
        snapshotId: snapshot.id
      }),
      "utf8"
    )
    .digest("hex");
}

export function applyIngestionCorrectionOverlays(
  snapshot: IngestionRawSnapshotRecord,
  overlays: readonly IngestionCorrectionOverlay[]
): IngestionRawSnapshotRecord {
  const applicable = overlays.filter((overlay) => overlay.snapshotId === snapshot.id);
  if (applicable.length === 0) return snapshot;
  const rowIndexes = new Set<number>();
  for (const overlay of applicable) {
    assertIngestionCorrectionOverlay(overlay);
    if (rowIndexes.has(overlay.rowIndex)) throw new Error("correction_overlay_duplicate_row");
    if (!snapshot.parsedRows[overlay.rowIndex]) throw new Error("correction_overlay_row_not_found");
    rowIndexes.add(overlay.rowIndex);
  }
  const parsedRows = snapshot.parsedRows.map((row, rowIndex) => {
    const overlay = applicable.find((candidate) => candidate.rowIndex === rowIndex);
    if (!overlay) return row;
    assertIngestionCorrectionOverlay(overlay);
    if (
      overlay.sourceFingerprint !== createIngestionCorrectionSourceFingerprint(snapshot, rowIndex)
    )
      throw new Error(`correction_overlay_source_conflict:${snapshot.id}:${rowIndex}`);
    const correctedRow = { ...row };
    for (const [key, value] of Object.entries(overlay.correctedFields)) {
      if (value === null) delete correctedRow[key as keyof typeof correctedRow];
      else Object.assign(correctedRow, { [key]: value });
    }
    return correctedRow;
  });
  return { ...snapshot, parsedRows };
}

function auditRow(
  row: ParsedShopProductRow,
  snapshot: IngestionRawSnapshotRecord,
  rowIndex: number,
  rowIdentities: Set<string>,
  addIssue: (issue: IngestionQualityIssue) => void
): void {
  const reference = { rowIndex, snapshotId: snapshot.id, sourceName: snapshot.sourceName };
  if (!nonEmpty(row.displayName))
    addIssue(issue("row_missing_display_name", "Parsed row has no display name.", reference));
  const rowIdentity = row.sourceRecordId?.trim() || row.sourceProductKey?.trim();
  if (!rowIdentity)
    addIssue(
      issue(
        "row_missing_source_identity",
        "Parsed row has no source record or product key.",
        reference
      )
    );
  if (rowIdentity && rowIdentities.has(rowIdentity))
    addIssue(
      issue(
        "duplicate_row_identity",
        `Parsed row identity is duplicated: ${rowIdentity}.`,
        reference
      )
    );
  if (rowIdentity) rowIdentities.add(rowIdentity);
  if (row.sourceName && row.sourceName !== snapshot.sourceName)
    addIssue(
      issue("row_source_mismatch", "Parsed row source differs from its snapshot source.", reference)
    );
  if (row.countryCode !== "HU")
    addIssue(
      issue(
        "row_country_mismatch",
        "Parsed row is outside the configured HU source boundary.",
        reference
      )
    );
  if (
    row.priceValue !== undefined &&
    row.priceValue !== null &&
    (!isFiniteNumber(row.priceValue) || row.priceValue < 0)
  )
    addIssue(issue("row_price_invalid", "Parsed row price is negative or not finite.", reference));

  for (const observation of row.priceObservations ?? []) {
    if (!isFiniteNumber(observation.price) || observation.price < 0)
      addIssue(
        issue(
          "observation_price_invalid",
          "Price observation is negative or not finite.",
          reference
        )
      );
    if (observation.validFrom && !isIsoDateTime(observation.validFrom))
      addIssue(
        issue(
          "observation_start_invalid",
          "Price observation validFrom is not a valid date.",
          reference
        )
      );
    if (observation.validTo && !isIsoDateTime(observation.validTo))
      addIssue(
        issue(
          "observation_end_invalid",
          "Price observation validTo is not a valid date.",
          reference
        )
      );
    if (observation.validFrom && observation.validTo && observation.validFrom > observation.validTo)
      addIssue(
        issue(
          "observation_range_reversed",
          "Price observation validity range is reversed.",
          reference
        )
      );
  }
  if (row.validFrom && !isIsoDateTime(row.validFrom))
    addIssue(issue("row_start_invalid", "Parsed row validFrom is not a valid date.", reference));
  if (row.validTo && !isIsoDateTime(row.validTo))
    addIssue(issue("row_end_invalid", "Parsed row validTo is not a valid date.", reference));
  if (row.validFrom && row.validTo && row.validFrom > row.validTo)
    addIssue(issue("row_range_reversed", "Parsed row validity range is reversed.", reference));

  const identifiers = row.productIdentifiers ?? [];
  const identifierKeys = new Set<string>();
  for (const identifier of identifiers) {
    const key = `${identifier.kind}:${identifier.issuer ?? ""}:${identifier.value}`;
    if (!nonEmpty(identifier.value))
      addIssue(issue("identifier_missing_value", "Product identifier has no value.", reference));
    if (identifierKeys.has(key))
      addIssue(
        issue(
          "duplicate_product_identifier",
          `Product identifier is duplicated: ${key}.`,
          reference
        )
      );
    identifierKeys.add(key);
  }
}

function issue(
  code: string,
  message: string,
  reference: Partial<IngestionQualityIssue> = {}
): IngestionQualityIssue {
  return { code, message, severity: "error", ...reference };
}

function snapshotRef(snapshot: IngestionRawSnapshotRecord): Partial<IngestionQualityIssue> {
  return { snapshotId: snapshot.id, sourceName: snapshot.sourceName };
}

function compareIssues(left: IngestionQualityIssue, right: IngestionQualityIssue): number {
  return `${left.snapshotId ?? ""}:${left.rowIndex ?? -1}:${left.code}`.localeCompare(
    `${right.snapshotId ?? ""}:${right.rowIndex ?? -1}:${right.code}`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isIdentifierList(value: unknown): value is ParsedShopProductIdentifier[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        nonEmpty(item["kind"]) &&
        nonEmpty(item["value"]) &&
        (item["issuer"] === undefined ||
          item["issuer"] === null ||
          typeof item["issuer"] === "string")
    )
  );
}
