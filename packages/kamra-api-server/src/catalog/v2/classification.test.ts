import { describe, expect, it } from "vitest";
import { migrateLegacyClassification } from "./classification.js";
import type { ProductTagAssignmentRecord, ProductTagRecord } from "../v1/contracts.js";

const origin = { capturedAt: "2026-07-11T00:00:00.000Z", kind: "seed" as const, producer: "test", sourceName: "test" };
const tag = (key: string, kind: ProductTagRecord["kind"], parentKey?: string | null): ProductTagRecord => ({ createdAt: origin.capturedAt, id: key, key, kind, label: key, matcherTerms: [], origin, parentKey, status: "active", updatedAt: origin.capturedAt });
const assignment = (tagKey: string): ProductTagAssignmentRecord => ({ assignedAt: origin.capturedAt, assignmentKind: "seed", id: `${tagKey}:p1`, origin, productId: "p1", score: 1, tagKey });

describe("legacy classification migration", () => {
  it("separates category concepts, attributes, and keyword hints", () => {
    const result = migrateLegacyClassification([tag("pasta", "category"), tag("spaghetti", "category", "pasta"), tag("gluten_free", "attribute"), tag("organic", "keyword")], [assignment("spaghetti"), assignment("gluten_free"), assignment("organic")]);
    expect(result.concepts.map((item) => item.key)).toEqual(["pasta", "spaghetti"]);
    expect(result.attributes.map((item) => item.key)).toEqual(["gluten_free"]);
    expect(result.relations).toMatchObject([{ child: { key: "spaghetti" }, parent: { key: "pasta" }, kind: "is_a" }]);
    expect(result.conceptAssignments).toHaveLength(1); expect(result.attributeAssignments).toHaveLength(1); expect(result.discardedKeywordCount).toBe(1);
  });

  it("reports broken parent and assignment references without fabricating records", () => {
    const result = migrateLegacyClassification([tag("pasta", "category", "missing")], [assignment("missing")]);
    expect(result.skippedRelationCount).toBe(1); expect(result.skippedAssignmentCount).toBe(1); expect(result.relations).toEqual([]);
  });
});
