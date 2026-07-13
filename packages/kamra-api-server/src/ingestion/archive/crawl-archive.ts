import { createHash } from "node:crypto";
import { appendFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { Document } from "mongodb";
import type { IngestionRawSnapshotRecord, IngestionRunRecord } from "../v1/contracts.js";

export const crawlArchiveSchemaVersion = "crawl-archive-v1" as const;

export interface CrawlArchiveManifest {
  archiveSchemaVersion: typeof crawlArchiveSchemaVersion;
  createdAt: string;
  databaseLabel: string;
  files: {
    runs: string;
    snapshots: string;
  };
  includedCollections: ["ingestion_runs", "ingestion_raw_snapshots"];
  recordCounts: {
    runs: number;
    snapshots: number;
  };
  uncompressedSha256: {
    runs: string;
    snapshots: string;
  };
}

export interface CrawlArchiveExportResult {
  manifest: CrawlArchiveManifest;
  outputDirectory: string;
}

interface ExportCollectionResult {
  count: number;
  sha256: string;
}

const pageSize = 250;

export async function exportCrawlArchive(input: {
  database: MongoDatabaseLike;
  databaseLabel: string;
  outputDirectory: string;
}): Promise<CrawlArchiveExportResult> {
  const outputDirectory = input.outputDirectory;
  await mkdir(outputDirectory, { recursive: true });
  const existingEntries = await readDirectoryEntries(outputDirectory);
  if (existingEntries.length > 0) throw new Error("archive_output_directory_must_be_empty");

  const runPath = `${outputDirectory}/runs.jsonl`;
  const snapshotPath = `${outputDirectory}/snapshots.jsonl`;
  const runExport = await exportCollection(
    input.database.collection<IngestionRunRecord>("ingestion_runs"),
    runPath
  );
  const snapshotExport = await exportCollection(
    input.database.collection<IngestionRawSnapshotRecord>("ingestion_raw_snapshots"),
    snapshotPath
  );
  const runCountAfter = await input.database.collection("ingestion_runs").countDocuments({});
  const snapshotCountAfter = await input.database
    .collection("ingestion_raw_snapshots")
    .countDocuments({});

  if (runCountAfter !== runExport.count || snapshotCountAfter !== snapshotExport.count) {
    await rm(outputDirectory, { recursive: true, force: true });
    throw new Error("archive_source_changed_during_export");
  }

  await gzipFile(runPath, `${outputDirectory}/runs.jsonl.gz`);
  await gzipFile(snapshotPath, `${outputDirectory}/snapshots.jsonl.gz`);
  await rm(runPath);
  await rm(snapshotPath);

  const manifest: CrawlArchiveManifest = {
    archiveSchemaVersion: crawlArchiveSchemaVersion,
    createdAt: new Date().toISOString(),
    databaseLabel: input.databaseLabel,
    files: {
      runs: "runs.jsonl.gz",
      snapshots: "snapshots.jsonl.gz"
    },
    includedCollections: ["ingestion_runs", "ingestion_raw_snapshots"],
    recordCounts: {
      runs: runExport.count,
      snapshots: snapshotExport.count
    },
    uncompressedSha256: {
      runs: runExport.sha256,
      snapshots: snapshotExport.sha256
    }
  };
  await writeFile(
    `${outputDirectory}/manifest.json`,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  return { manifest, outputDirectory };
}

async function exportCollection<T extends Document>(
  collection: MongoCollectionLike<T>,
  outputPath: string
): Promise<ExportCollectionResult> {
  const initialCount = await collection.countDocuments({});
  await writeFile(outputPath, "", "utf8");
  const hash = createHash("sha256");
  let count = 0;

  for (let offset = 0; offset < initialCount; offset += pageSize) {
    const page = (await collection
      .find({}, { projection: { _id: 0 } })
      .sort({ id: 1 })
      .skip(offset)
      .limit(pageSize)
      .toArray()) as T[];
    if (page.length === 0) break;
    const content = page.map((record) => `${stableStringify(record)}\n`).join("");
    hash.update(content, "utf8");
    await appendFile(outputPath, content, "utf8");
    count += page.length;
  }

  if (count !== initialCount) throw new Error("archive_collection_page_changed_during_export");
  return { count, sha256: hash.digest("hex") };
}

async function gzipFile(inputPath: string, outputPath: string): Promise<void> {
  await pipeline(
    createReadStream(inputPath),
    createGzip({ level: 9 }),
    createWriteStream(outputPath)
  );
}

async function readDirectoryEntries(directory: string): Promise<string[]> {
  return readdir(directory);
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortObjectKeys(value));
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortObjectKeys(nested)])
  );
}
