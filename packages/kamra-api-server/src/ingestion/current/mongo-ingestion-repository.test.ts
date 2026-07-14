import { describe, expect, it } from "vitest";

import { MongoIngestionRepository } from "./mongo-ingestion-repository.js";
import type { IngestionRawSnapshotRecord, ParsedShopProductRow } from "../v1/contracts.js";
import { ingestionV1CollectionNames } from "../v1/contracts.js";
import { createFakeDb } from "../../test-support/fake-mongo.js";

const capturedAt = "2026-07-01T08:00:00.000Z";

describe("MongoIngestionRepository", () => {
  it("creates all ingestion collections with strict JSON schema validation", async () => {
    const db = createFakeDb();
    const createCollectionCalls: Array<{ name: string; options?: Record<string, unknown> }> = [];
    const createCollection = db.createCollection.bind(db);
    db.createCollection = async (name, options) => {
      createCollectionCalls.push({ name, options });
      return createCollection(name, options);
    };
    db.listCollections = () => ({
      toArray: async () => []
    });
    const repository = new MongoIngestionRepository(db);

    await repository.setupCollections();

    expect(createCollectionCalls.map((call) => call.name).sort()).toEqual(
      [...ingestionV1CollectionNames].sort()
    );
    for (const call of createCollectionCalls) {
      expect(call.options).toMatchObject({
        validationAction: "error",
        validationLevel: "strict",
        validator: {
          $jsonSchema: expect.any(Object)
        }
      });
    }
  });

  it("creates the review collection and persists review items for a snapshot", async () => {
    const db = createFakeDb();
    const repository = new MongoIngestionRepository(db);

    await repository.setupCollections();

    const snapshot = createSnapshot([
      {
        countryCode: "HU",
        displayName: "Pilos UHT tej 2,8% 1 l",
        packageLabel: "1 l",
        productIdentifiers: [
          {
            kind: "gtin",
            value: "5991234567890"
          }
        ],
        sourceRecordId: "row-1",
        sourceUrl: "https://example.invalid/lidl/milk",
        storeBrandKey: "lidl-hu"
      }
    ]);

    const reviewItems = await repository.prepareProductReviewItems(snapshot);

    expect(reviewItems).toHaveLength(1);
    expect(reviewItems[0]).toMatchObject({
      candidateBuilderName: "SourceOfferReviewCandidateBuilder",
      candidateBuilderVersion: "1.0.0",
      candidateMatch: "strong_identifier",
      id: `${snapshot.id}:0`,
      rowIndex: 0,
      status: "pending"
    });
    expect(await repository.findProductReviewItemById(`${snapshot.id}:0`)).toMatchObject({
      candidateMatch: "strong_identifier",
      sourceName: "lidl-hu-brochure",
      status: "pending"
    });
    expect(db.__collections["ingestion_product_review_items"]).toBeDefined();
  });

  it("updates review decisions without losing the stored candidate", async () => {
    const db = createFakeDb();
    const repository = new MongoIngestionRepository(db);
    await repository.setupCollections();

    const snapshot = createSnapshot([
      {
        countryCode: "HU",
        displayName: "Kamra tej",
        sourceProductKey: "kamra-milk-1",
        sourceRecordId: "row-2"
      }
    ]);

    await repository.prepareProductReviewItems(snapshot);
    const updated = await repository.markProductReviewItemDecision({
      decidedAt: "2026-07-01T09:00:00.000Z",
      declineReason: "bad_name",
      id: `${snapshot.id}:0`,
      note: "Name is too generic.",
      reviewerId: "admin-1",
      reviewerName: "Admin",
      status: "declined"
    });

    expect(updated).toBe(true);
    expect(await repository.findProductReviewItemById(`${snapshot.id}:0`)).toMatchObject({
      decision: {
        declineReason: "bad_name",
        note: "Name is too generic.",
        reviewerId: "admin-1",
        reviewerName: "Admin",
        state: "declined"
      },
      status: "declined"
    });
  });

  it("updates a review item candidate from editor changes", async () => {
    const db = createFakeDb();
    const repository = new MongoIngestionRepository(db);
    await repository.setupCollections();

    const snapshot = createSnapshot([
      {
        countryCode: "HU",
        displayName: "Kamra tej",
        sourceProductKey: "kamra-milk-1",
        sourceRecordId: "row-2"
      }
    ]);

    const [reviewItem] = await repository.prepareProductReviewItems(snapshot);
    const updated = await repository.updateProductReviewItemCandidate({
      candidate: {
        ...reviewItem!.candidate,
        matchConfidence: "name_only",
        product: {
          ...reviewItem!.candidate.product,
          name: "Corrected Kamra tej"
        }
      },
      id: reviewItem!.id,
      updatedAt: "2026-07-01T10:00:00.000Z"
    });

    expect(updated).toBe(true);
    expect(await repository.findProductReviewItemById(reviewItem!.id)).toMatchObject({
      candidate: {
        matchConfidence: "name_only",
        product: {
          name: "Corrected Kamra tej"
        }
      },
      candidateMatch: "name_only",
      updatedAt: "2026-07-01T10:00:00.000Z"
    });
  });
});

function createSnapshot(parsedRows: ParsedShopProductRow[]): IngestionRawSnapshotRecord {
  return {
    capturedAt,
    contentHash: "hash",
    contentType: "text/plain",
    crawlDate: "2026-07-01",
    crawlRunId: "workflow:lidl-hu-brochure:2026-07-01",
    id: "lidl-hu-brochure:record-1:2026-07-01",
    parserName: "test-parser",
    parserVersion: "0.0.0",
    parsedRows,
    payloadText: "payload",
    sourceName: "lidl-hu-brochure",
    sourceRecordId: "record-1",
    sourceUrl: "https://example.invalid/lidl",
    workflowName: "workflow"
  };
}
