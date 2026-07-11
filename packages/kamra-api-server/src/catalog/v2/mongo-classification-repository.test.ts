import { describe, expect, it } from "vitest";
import { createFakeDb } from "../../test-support/fake-mongo.js";
import type { ProductTagAssignmentRecord, ProductTagRecord } from "../v1/contracts.js";
import { MongoClassificationRepository } from "./mongo-classification-repository.js";

const origin = { capturedAt: "2026-07-11T00:00:00.000Z", kind: "seed" as const, producer: "test", sourceName: "test" };
const tag = (key: string, kind: ProductTagRecord["kind"], parentKey?: string | null): ProductTagRecord => ({ createdAt: origin.capturedAt, id: key, key, kind, label: key, matcherTerms: [], origin, parentKey, status: "active", updatedAt: origin.capturedAt });
const assignment = (tagKey: string): ProductTagAssignmentRecord => ({ assignedAt: origin.capturedAt, assignmentKind: "seed", id: `${tagKey}:p1`, origin, productId: "p1", score: 1, tagKey });

describe("MongoClassificationRepository", () => {
  it("is idempotent by stable ids and reports discarded legacy hints", async () => {
    const db = createFakeDb(); const repository = new MongoClassificationRepository(db);
    await repository.setupCollections();
    const input = [tag("pasta", "category"), tag("spaghetti", "category", "pasta"), tag("gluten_free", "attribute"), tag("hint", "keyword")];
    const first = await repository.migrateLegacy(input, [assignment("spaghetti"), assignment("gluten_free"), assignment("hint")]);
    const second = await repository.migrateLegacy(input, [assignment("spaghetti"), assignment("gluten_free"), assignment("hint")]);
    expect(first).toEqual(second);
    expect(db.__collections["product_concepts"]!.docs).toHaveLength(2);
    expect(db.__collections["product_concept_relations"]!.docs).toHaveLength(1);
    expect(first.discardedKeywordCount).toBe(1);
  });
});
