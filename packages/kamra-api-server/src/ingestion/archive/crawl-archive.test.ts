import { createHash } from "node:crypto";
import { gunzip } from "node:zlib";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { createFakeDb, FakeCollection } from "../../test-support/fake-mongo.js";
import { exportCrawlArchive, stableStringify } from "./crawl-archive.js";
import { importCrawlArchive } from "./crawl-archive-import.js";

const gunzipAsync = promisify(gunzip);

describe("crawl archive export", () => {
  it("writes deterministic raw collections, checksums, and a manifest", async () => {
    const outputDirectory = await mkdtemp("kamra-crawl-archive-");
    const database = createFakeDb({
      ingestion_runs: new FakeCollection("ingestion_runs", [
        { id: "run-1", crawlRunId: "run-1", status: "completed" }
      ]),
      ingestion_raw_snapshots: new FakeCollection("ingestion_raw_snapshots", [
        { id: "snapshot-1", sourceName: "synthetic", payloadText: "raw" }
      ])
    });

    try {
      const result = await exportCrawlArchive({
        database,
        databaseLabel: "test",
        outputDirectory
      });
      const manifest = JSON.parse(await readFile(`${outputDirectory}/manifest.json`, "utf8")) as {
        recordCounts: { runs: number; snapshots: number };
        uncompressedSha256: { runs: string; snapshots: string };
      };
      const runs = await gunzipAsync(await readFile(`${outputDirectory}/runs.jsonl.gz`));
      const snapshots = await gunzipAsync(await readFile(`${outputDirectory}/snapshots.jsonl.gz`));

      expect(result.manifest.recordCounts).toEqual({ runs: 1, snapshots: 1 });
      expect(manifest.recordCounts).toEqual({ runs: 1, snapshots: 1 });
      expect(createHash("sha256").update(runs).digest("hex")).toBe(
        manifest.uncompressedSha256.runs
      );
      expect(createHash("sha256").update(snapshots).digest("hex")).toBe(
        manifest.uncompressedSha256.snapshots
      );
      expect(runs.toString()).toContain('"crawlRunId":"run-1"');
      expect(snapshots.toString()).toContain('"payloadText":"raw"');
      expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });

  it("rejects a non-empty output directory", async () => {
    const outputDirectory = await mkdtemp("kamra-crawl-archive-");
    const database = createFakeDb();
    await writeFile(`${outputDirectory}/existing.txt`, "keep", "utf8");

    await expect(
      exportCrawlArchive({ database, databaseLabel: "test", outputDirectory })
    ).rejects.toThrow("archive_output_directory_must_be_empty");
    await rm(outputDirectory, { recursive: true, force: true });
  });

  it("dry-runs and idempotently imports verified raw records", async () => {
    const outputDirectory = await mkdtemp("kamra-crawl-archive-import-");
    const database = createFakeDb({
      ingestion_runs: new FakeCollection("ingestion_runs", [
        { id: "run-existing", crawlRunId: "run-existing", status: "completed" }
      ]),
      ingestion_raw_snapshots: new FakeCollection("ingestion_raw_snapshots")
    });
    const sourceDatabase = createFakeDb({
      ingestion_runs: new FakeCollection("ingestion_runs", [
        { id: "run-new", crawlRunId: "run-new", status: "completed" }
      ]),
      ingestion_raw_snapshots: new FakeCollection("ingestion_raw_snapshots", [
        {
          capturedAt: "2026-07-13T00:00:00.000Z",
          contentHash: "hash",
          contentType: "text/html",
          crawlDate: "2026-07-13",
          crawlRunId: "run-new",
          id: "snapshot-new",
          parserName: "test",
          parserVersion: "1",
          parsedRows: [],
          payloadText: "raw",
          sourceName: "synthetic",
          sourceRecordId: "record-new",
          workflowName: "test"
        }
      ])
    });

    try {
      await exportCrawlArchive({
        database: sourceDatabase,
        databaseLabel: "source",
        outputDirectory
      });
      const dryRun = await importCrawlArchive({ archiveDirectory: outputDirectory, database });
      expect(dryRun).toMatchObject({ dryRun: true, insertedRuns: 0, insertedSnapshots: 0 });
      expect(dryRun.conflicts).toEqual([]);
      const applied = await importCrawlArchive({
        apply: true,
        archiveDirectory: outputDirectory,
        database
      });
      expect(applied).toMatchObject({ insertedRuns: 1, insertedSnapshots: 1 });
      const repeated = await importCrawlArchive({
        apply: true,
        archiveDirectory: outputDirectory,
        database
      });
      expect(repeated).toMatchObject({ skippedRuns: 1, skippedSnapshots: 1 });
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });

  it("reports raw identity conflicts without applying inserts", async () => {
    const outputDirectory = await mkdtemp("kamra-crawl-archive-conflict-");
    const sourceDatabase = createFakeDb({
      ingestion_runs: new FakeCollection("ingestion_runs"),
      ingestion_raw_snapshots: new FakeCollection("ingestion_raw_snapshots", [
        {
          capturedAt: "2026-07-13T00:00:00.000Z",
          contentHash: "new-hash",
          contentType: "text/html",
          crawlDate: "2026-07-13",
          crawlRunId: "run-new",
          id: "snapshot-new",
          parserName: "test",
          parserVersion: "1",
          parsedRows: [],
          payloadText: "new",
          sourceName: "synthetic",
          sourceRecordId: "record-new",
          workflowName: "test"
        }
      ])
    });
    const database = createFakeDb({
      ingestion_runs: new FakeCollection("ingestion_runs"),
      ingestion_raw_snapshots: new FakeCollection("ingestion_raw_snapshots", [
        {
          capturedAt: "2026-07-13T00:00:00.000Z",
          contentHash: "old-hash",
          contentType: "text/html",
          crawlDate: "2026-07-13",
          crawlRunId: "run-old",
          id: "snapshot-old",
          parserName: "test",
          parserVersion: "1",
          parsedRows: [],
          payloadText: "old",
          sourceName: "synthetic",
          sourceRecordId: "record-new",
          workflowName: "test"
        }
      ])
    });

    try {
      await exportCrawlArchive({
        database: sourceDatabase,
        databaseLabel: "source",
        outputDirectory
      });
      const result = await importCrawlArchive({
        apply: true,
        archiveDirectory: outputDirectory,
        database
      });
      expect(result.conflicts).toEqual(["snapshot:snapshot-new"]);
      expect(result.insertedSnapshots).toBe(0);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});
