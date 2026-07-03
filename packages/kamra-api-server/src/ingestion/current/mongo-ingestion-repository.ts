import type { Collection, Db, DeleteResult, Document, Filter } from "mongodb";

import type {
  IngestionRawSnapshotRecord,
  IngestionRunRecord,
  ParsedShopProductRow
} from "../v1/contracts.js";

interface IngestSnapshotInput {
  capturedAt: string;
  contentHash: string;
  contentType: string;
  crawlDate: string;
  crawlRunId: string;
  parserName: string;
  parserVersion: string;
  payloadText: string;
  parsedRows: ParsedShopProductRow[];
  sourceName: string;
  sourceRecordId: string;
  sourceUrl?: string | null;
  workflowName: string;
}

export interface IngestSnapshotResult {
  inserted: boolean;
  snapshot: IngestionRawSnapshotRecord;
}

export interface IngestionCleanupResult {
  deletedRuns: number;
  deletedSnapshots: number;
}

export interface ListRawSnapshotsOptions {
  limit?: number;
  sourceName?: string;
}

export class MongoIngestionRepository {
  private readonly rawSnapshotsCollection: Collection<IngestionRawSnapshotRecord>;
  private readonly runsCollection: Collection<IngestionRunRecord>;

  constructor(private readonly database: Db) {
    this.rawSnapshotsCollection = database.collection<IngestionRawSnapshotRecord>("ingestion_raw_snapshots");
    this.runsCollection = database.collection<IngestionRunRecord>("ingestion_runs");
  }

  async setupCollections(): Promise<void> {
    const existingCollections = new Set(
      (await this.database.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name)
    );

    if (!existingCollections.has("ingestion_runs")) {
      await this.database.createCollection("ingestion_runs");
    }
    if (!existingCollections.has("ingestion_raw_snapshots")) {
      await this.database.createCollection("ingestion_raw_snapshots");
    }

    await Promise.all([
      this.runsCollection.createIndex(
        { crawlRunId: 1 },
        { name: "ingestion_runs_crawl_run_id_unique", unique: true }
      ),
      this.rawSnapshotsCollection.createIndex(
        { sourceName: 1, sourceRecordId: 1, crawlDate: 1 },
        { name: "ingestion_snapshots_source_record_day_unique", unique: true }
      ),
      this.rawSnapshotsCollection.createIndex(
        { crawlRunId: 1 },
        { name: "ingestion_snapshots_crawl_run_id" }
      )
    ]);
  }

  async startRun(run: Omit<IngestionRunRecord, "completedAt" | "failedCount" | "insertedSnapshotCount" | "skippedSnapshotCount" | "status">): Promise<void> {
    const now = run.startedAt;
    await this.runsCollection.updateOne(
      { crawlRunId: run.crawlRunId },
      {
        $setOnInsert: {
          ...run,
          completedAt: null,
          failedCount: 0,
          insertedSnapshotCount: 0,
          skippedSnapshotCount: 0,
          status: "running",
          updatedAt: now
        }
      },
      { upsert: true }
    );
  }

  async ingestSnapshot(input: IngestSnapshotInput): Promise<IngestSnapshotResult> {
    const existing = await this.rawSnapshotsCollection.findOne({
      crawlDate: input.crawlDate,
      sourceName: input.sourceName,
      sourceRecordId: input.sourceRecordId
    });

    if (existing) {
      await this.incrementRun(input.crawlRunId, { skippedSnapshotCount: 1 });
      return {
        inserted: false,
        snapshot: existing
      };
    }

    const snapshot: IngestionRawSnapshotRecord = {
      ...input,
      id: `${input.sourceName}:${input.sourceRecordId}:${input.crawlDate}`,
      sourceUrl: input.sourceUrl ?? null
    };

    await this.rawSnapshotsCollection.insertOne(snapshot);
    await this.incrementRun(input.crawlRunId, { insertedSnapshotCount: 1 });

    return {
      inserted: true,
      snapshot
    };
  }

  async completeRun(crawlRunId: string, completedAt: string): Promise<void> {
    await this.runsCollection.updateOne(
      { crawlRunId },
      {
        $set: {
          completedAt,
          status: "completed",
          updatedAt: completedAt
        }
      }
    );
  }

  async cleanupByCrawlRunId(crawlRunId: string): Promise<IngestionCleanupResult> {
    const [snapshotsResult, runsResult] = await Promise.all([
      this.rawSnapshotsCollection.deleteMany({ crawlRunId }),
      this.runsCollection.deleteMany({ crawlRunId })
    ]);

    return {
      deletedRuns: deletedCount(runsResult),
      deletedSnapshots: deletedCount(snapshotsResult)
    };
  }

  async countSnapshotsForRun(crawlRunId: string): Promise<number> {
    return this.rawSnapshotsCollection.countDocuments({ crawlRunId });
  }

  async listRawSnapshots(options: ListRawSnapshotsOptions = {}): Promise<IngestionRawSnapshotRecord[]> {
    const filter: Filter<IngestionRawSnapshotRecord> = options.sourceName
      ? { sourceName: options.sourceName }
      : {};

    return this.rawSnapshotsCollection
      .find(filter)
      .sort({ capturedAt: -1 })
      .limit(options.limit ?? 50)
      .toArray();
  }

  async findRawSnapshotById(id: string): Promise<IngestionRawSnapshotRecord | null> {
    return await this.rawSnapshotsCollection.findOne({ id });
  }

  private async incrementRun(
    crawlRunId: string,
    increments: Partial<Pick<IngestionRunRecord, "failedCount" | "insertedSnapshotCount" | "skippedSnapshotCount">>
  ): Promise<void> {
    await this.runsCollection.updateOne(
      { crawlRunId },
      {
        $inc: increments as Document,
        $set: {
          updatedAt: new Date().toISOString()
        }
      } as Filter<IngestionRunRecord>
    );
  }
}

function deletedCount(result: DeleteResult): number {
  return result.deletedCount ?? 0;
}
