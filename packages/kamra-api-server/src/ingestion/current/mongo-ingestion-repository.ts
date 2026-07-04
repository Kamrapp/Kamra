import type { DeleteResult, Document, Filter } from "mongodb";

import type {
  IngestionProductReviewItemRecord,
  IngestionRawSnapshotRecord,
  IngestionRunRecord,
  ParsedShopProductRow
} from "../v1/contracts.js";
import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import type { ProductReviewDecisionReason } from "../v1/review-contracts.js";
import type { ProductReviewCandidateDraft } from "../v1/review-contracts.js";
import { ingestionV1CollectionSchemas } from "../v1/schemas.js";
import {
  buildSourceOfferReviewCandidate,
  sourceOfferReviewCandidateBuilderName,
  sourceOfferReviewCandidateBuilderVersion
} from "../processing/source-offer-candidate.js";

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

export interface ListProductReviewItemsOptions {
  limit?: number;
  offset?: number;
  snapshotId?: string;
  sourceName?: string;
  status?: IngestionProductReviewItemRecord["status"][];
}

export interface MarkProductReviewItemDecisionInput {
  acceptedCatalogProductDeletedAt?: string | null;
  acceptedCatalogProductId?: string | null;
  declineReason?: ProductReviewDecisionReason | null;
  id: string;
  note?: string | null;
  decidedAt: string;
  reviewerId: string;
  reviewerName: string;
  status: "accepted" | "declined";
}

export interface UpdateProductReviewItemCandidateInput {
  candidate: ProductReviewCandidateDraft;
  id: string;
  updatedAt: string;
}

export class MongoIngestionRepository {
  private readonly productReviewItemsCollection: MongoCollectionLike<IngestionProductReviewItemRecord>;
  private readonly rawSnapshotsCollection: MongoCollectionLike<IngestionRawSnapshotRecord>;
  private readonly runsCollection: MongoCollectionLike<IngestionRunRecord>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.productReviewItemsCollection = database.collection<IngestionProductReviewItemRecord>(
      "ingestion_product_review_items"
    );
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
    if (!existingCollections.has("ingestion_product_review_items")) {
      await this.database.createCollection("ingestion_product_review_items", {
        validationAction: "error",
        validationLevel: "strict",
        validator: {
          $jsonSchema: ingestionV1CollectionSchemas.ingestion_product_review_items
        }
      });
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
      ),
      this.productReviewItemsCollection.createIndex(
        { snapshotId: 1, rowFingerprint: 1 },
        { name: "ingestion_product_review_items_snapshot_row_unique", unique: true }
      ),
      this.productReviewItemsCollection.createIndex(
        { sourceName: 1, status: 1, capturedAt: -1 },
        { name: "ingestion_product_review_items_source_status_captured_at" }
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

  async prepareProductReviewItems(snapshot: IngestionRawSnapshotRecord): Promise<IngestionProductReviewItemRecord[]> {
    const preparedAt = new Date().toISOString();
    const reviewItems = snapshot.parsedRows.map((row, rowIndex) => {
      const reviewCandidate = buildSourceOfferReviewCandidate(snapshot, row, rowIndex);
      const sourceRecordId = row.sourceRecordId ?? snapshot.sourceRecordId;

      return {
        acceptedCatalogProductDeletedAt: null,
        acceptedCatalogProductId: null,
        candidate: reviewCandidate.candidate,
        candidateBuilderName: sourceOfferReviewCandidateBuilderName,
        candidateBuilderVersion: sourceOfferReviewCandidateBuilderVersion,
        candidateMatch: reviewCandidate.candidate.matchConfidence,
        capturedAt: snapshot.capturedAt,
        createdAt: preparedAt,
        decision: null,
        id: `${snapshot.id}:${rowIndex}`,
        rawRowPreview: reviewCandidate.rawRowPreview,
        rowFingerprint: reviewCandidate.candidateFingerprint,
        rowIndex,
        snapshotId: snapshot.id,
        sourceName: reviewCandidate.rawRowPreview.sourceName ?? snapshot.sourceName,
        sourceRecordId,
        status: "pending",
        updatedAt: preparedAt
      } satisfies IngestionProductReviewItemRecord;
    });

    await this.upsertMany(this.productReviewItemsCollection, reviewItems);

    return reviewItems;
  }

  async listProductReviewItems(
    options: ListProductReviewItemsOptions = {}
  ): Promise<IngestionProductReviewItemRecord[]> {
    const filter: Filter<IngestionProductReviewItemRecord> = {};

    if (options.snapshotId) {
      filter.snapshotId = options.snapshotId;
    }
    if (options.sourceName) {
      filter.sourceName = options.sourceName;
    }
    if (options.status && options.status.length > 0) {
      filter.status = { $in: options.status };
    }

    let query = this.productReviewItemsCollection.find(filter).sort({ capturedAt: -1, rowIndex: 1 });
    if (typeof options.offset === "number" && options.offset > 0) {
      query = query.skip(options.offset);
    }
    if (typeof options.limit === "number" && options.limit > 0) {
      query = query.limit(options.limit);
    }

    return query.toArray();
  }

  async findProductReviewItemById(id: string): Promise<IngestionProductReviewItemRecord | null> {
    return this.productReviewItemsCollection.findOne({ id });
  }

  async updateProductReviewItemCandidate(input: UpdateProductReviewItemCandidateInput): Promise<boolean> {
    const result = await this.productReviewItemsCollection.updateOne(
      { id: input.id },
      {
        $set: {
          candidate: input.candidate,
          candidateMatch: input.candidate.matchConfidence,
          updatedAt: input.updatedAt
        }
      }
    );

    return (result.matchedCount ?? 0) > 0;
  }

  async markProductReviewItemDecision(input: MarkProductReviewItemDecisionInput): Promise<boolean> {
    const decision: {
      decidedAt: string;
      declineReason?: ProductReviewDecisionReason | null;
      note: string | null;
      reviewerId: string;
      reviewerName: string;
      state: "accepted" | "declined";
    } = {
      decidedAt: input.decidedAt,
      note: input.note ?? null,
      reviewerId: input.reviewerId,
      reviewerName: input.reviewerName,
      state: input.status
    };

    if (input.status === "declined") {
      decision.declineReason = input.declineReason ?? null;
    }

    try {
      const result = await this.productReviewItemsCollection.updateOne(
        { id: input.id },
        {
          $set: {
            acceptedCatalogProductDeletedAt: input.acceptedCatalogProductDeletedAt ?? null,
            acceptedCatalogProductId: input.acceptedCatalogProductId ?? null,
            decision,
            status: input.status,
            updatedAt: input.decidedAt
          }
        }
      );

      return (result.matchedCount ?? 0) > 0;
    } catch (error: unknown) {
      if (isMongoValidationError(error)) {
        writeServerLog("error", "Review item decision validation failed", {
          acceptedCatalogProductId: input.acceptedCatalogProductId ?? null,
          id: input.id,
          reviewStatus: input.status,
          validationError: summarizeMongoValidationError(error)
        });
      }

      throw error;
    }
  }

  private async upsertMany<T extends { id: string }>(
    collection: MongoCollectionLike<T>,
    records: readonly T[]
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const operations = records.map((record) => ({
      replaceOne: {
        filter: { id: record.id } as Filter<T>,
        replacement: record,
        upsert: true
      }
    }));

    await collection.bulkWrite(operations);
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

function isMongoValidationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as { code?: unknown }).code === 121;
}

function summarizeMongoValidationError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as {
    errInfo?: {
      details?: unknown;
      failingDocumentId?: unknown;
    };
    message?: unknown;
  };

  return {
    details: candidate.errInfo?.details ?? null,
    failingDocumentId: candidate.errInfo?.failingDocumentId ?? null,
    message: typeof candidate.message === "string" ? candidate.message : "unknown"
  };
}
