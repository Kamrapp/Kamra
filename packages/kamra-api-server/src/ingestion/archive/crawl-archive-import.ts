import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import type { MongoDatabaseLike } from "../../db/mongo-like.js";
import type { IngestionRawSnapshotRecord, IngestionRunRecord } from "../v1/contracts.js";
import {
  crawlArchiveSchemaVersion,
  stableStringify,
  type CrawlArchiveManifest
} from "./crawl-archive.js";

export interface CrawlArchiveImportResult {
  conflicts: string[];
  dryRun: boolean;
  insertedRuns: number;
  insertedSnapshots: number;
  skippedRuns: number;
  skippedSnapshots: number;
}

interface ImportPlan<T> {
  conflicts: string[];
  inserts: T[];
  skipped: number;
}

export async function importCrawlArchive(input: {
  apply?: boolean;
  database: MongoDatabaseLike;
  archiveDirectory: string;
}): Promise<CrawlArchiveImportResult> {
  const archiveDirectory = resolve(input.archiveDirectory);
  const manifest = await readManifest(archiveDirectory);
  const [runs, snapshots] = await Promise.all([
    readArchiveRecords<IngestionRunRecord>(
      archiveDirectory,
      manifest.files.runs,
      manifest.uncompressedSha256.runs
    ),
    readArchiveRecords<IngestionRawSnapshotRecord>(
      archiveDirectory,
      manifest.files.snapshots,
      manifest.uncompressedSha256.snapshots
    )
  ]);
  if (
    runs.length !== manifest.recordCounts.runs ||
    snapshots.length !== manifest.recordCounts.snapshots
  )
    throw new Error("archive_record_count_mismatch");

  const runPlan = await planRuns(input.database, runs);
  const snapshotPlan = await planSnapshots(input.database, snapshots);
  const conflicts = [...runPlan.conflicts, ...snapshotPlan.conflicts];
  const result: CrawlArchiveImportResult = {
    conflicts,
    dryRun: input.apply !== true,
    insertedRuns: 0,
    insertedSnapshots: 0,
    skippedRuns: runPlan.skipped,
    skippedSnapshots: snapshotPlan.skipped
  };
  if (conflicts.length > 0 || input.apply !== true) {
    return result;
  }

  const runsCollection = input.database.collection<IngestionRunRecord>("ingestion_runs");
  const snapshotsCollection =
    input.database.collection<IngestionRawSnapshotRecord>("ingestion_raw_snapshots");
  for (const run of runPlan.inserts) {
    if (await runsCollection.findOne({ crawlRunId: run.crawlRunId }))
      throw new Error(`archive_import_conflict_during_apply:run:${run.crawlRunId}`);
    await runsCollection.insertOne(run);
    result.insertedRuns += 1;
  }
  for (const snapshot of snapshotPlan.inserts) {
    const existingById = await snapshotsCollection.findOne({ id: snapshot.id });
    const existingByNaturalKey = await snapshotsCollection.findOne({
      crawlDate: snapshot.crawlDate,
      sourceName: snapshot.sourceName,
      sourceRecordId: snapshot.sourceRecordId
    });
    if (existingById || existingByNaturalKey)
      throw new Error(`archive_import_conflict_during_apply:snapshot:${snapshot.id}`);
    await snapshotsCollection.insertOne(snapshot);
    result.insertedSnapshots += 1;
  }
  return result;
}

async function readManifest(archiveDirectory: string): Promise<CrawlArchiveManifest> {
  const manifest = JSON.parse(
    await readFile(resolveInsideArchive(archiveDirectory, "manifest.json"), "utf8")
  ) as Partial<CrawlArchiveManifest>;
  if (
    manifest.archiveSchemaVersion !== crawlArchiveSchemaVersion ||
    manifest.files?.runs !== "runs.jsonl.gz" ||
    manifest.files?.snapshots !== "snapshots.jsonl.gz" ||
    manifest.includedCollections?.join(",") !== "ingestion_runs,ingestion_raw_snapshots" ||
    !manifest.recordCounts ||
    !manifest.uncompressedSha256
  )
    throw new Error("unsupported_crawl_archive_manifest");
  return manifest as CrawlArchiveManifest;
}

async function readArchiveRecords<T>(
  archiveDirectory: string,
  archiveFile: string,
  expectedSha256: string
): Promise<T[]> {
  const hash = createHash("sha256");
  const records: T[] = [];
  const input = createReadStream(resolveInsideArchive(archiveDirectory, archiveFile)).pipe(
    createGunzip()
  );
  const lines = createInterface({ input });
  for await (const line of lines) {
    if (!line.trim()) continue;
    hash.update(`${line}\n`, "utf8");
    try {
      records.push(JSON.parse(line) as T);
    } catch {
      throw new Error(`invalid_archive_json:${archiveFile}`);
    }
  }
  if (hash.digest("hex") !== expectedSha256)
    throw new Error(`archive_checksum_mismatch:${archiveFile}`);
  return records;
}

async function planRuns(
  database: MongoDatabaseLike,
  records: IngestionRunRecord[]
): Promise<ImportPlan<IngestionRunRecord>> {
  const plan: ImportPlan<IngestionRunRecord> = { conflicts: [], inserts: [], skipped: 0 };
  const collection = database.collection<IngestionRunRecord>("ingestion_runs");
  for (const record of records) {
    const existing = await collection.findOne({ crawlRunId: record.crawlRunId });
    if (!existing) {
      plan.inserts.push(record);
    } else if (sameRecord(existing, record)) {
      plan.skipped += 1;
    } else {
      plan.conflicts.push(`run:${record.crawlRunId}`);
    }
  }
  return plan;
}

async function planSnapshots(
  database: MongoDatabaseLike,
  records: IngestionRawSnapshotRecord[]
): Promise<ImportPlan<IngestionRawSnapshotRecord>> {
  const plan: ImportPlan<IngestionRawSnapshotRecord> = { conflicts: [], inserts: [], skipped: 0 };
  const collection = database.collection<IngestionRawSnapshotRecord>("ingestion_raw_snapshots");
  for (const record of records) {
    const existingById = await collection.findOne({ id: record.id });
    const existingByNaturalKey = await collection.findOne({
      crawlDate: record.crawlDate,
      sourceName: record.sourceName,
      sourceRecordId: record.sourceRecordId
    });
    const existing = existingById ?? existingByNaturalKey;
    if (!existing) {
      plan.inserts.push(record);
    } else if (sameRecord(existing, record)) {
      plan.skipped += 1;
    } else {
      plan.conflicts.push(`snapshot:${record.id}`);
    }
  }
  return plan;
}

function sameRecord(left: object, right: object): boolean {
  return stableStringify(withoutMongoId(left)) === stableStringify(withoutMongoId(right));
}

function withoutMongoId(record: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record as Record<string, unknown>).filter(([key]) => key !== "_id")
  );
}

function resolveInsideArchive(archiveDirectory: string, fileName: string): string {
  if (basename(fileName) !== fileName) throw new Error("archive_file_path_invalid");
  return resolve(archiveDirectory, fileName);
}
