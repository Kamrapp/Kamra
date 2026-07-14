import { describe, expect, it } from "vitest";
import { createFakeDb } from "../../test-support/fake-mongo.js";
import { MongoHouseholdProductConceptRepository } from "./mongo-household-product-concept-repository.js";

describe("MongoHouseholdProductConceptRepository", () => {
  it("lists household-local concepts alphabetically without leaking households", async () => {
    const repository = new MongoHouseholdProductConceptRepository(createFakeDb());
    await repository.create({
      createdAt: "2026-07-12T00:00:00.000Z",
      createdByUserId: "u",
      householdId: "h",
      key: "brown-bread",
      label: "Brown bread",
      revision: 0,
      status: "active",
      updatedAt: "2026-07-12T00:00:00.000Z",
      updatedByUserId: "u"
    });
    await repository.create({
      createdAt: "2026-07-12T00:00:00.000Z",
      createdByUserId: "u",
      householdId: "h",
      key: "apple",
      label: "Apple",
      revision: 0,
      status: "active",
      updatedAt: "2026-07-12T00:00:00.000Z",
      updatedByUserId: "u"
    });
    await repository.create({
      createdAt: "2026-07-12T00:00:00.000Z",
      createdByUserId: "u",
      householdId: "other",
      key: "milk",
      label: "Milk",
      revision: 0,
      status: "active",
      updatedAt: "2026-07-12T00:00:00.000Z",
      updatedByUserId: "u"
    });
    expect((await repository.list("h")).map((concept) => concept.label)).toEqual([
      "Apple",
      "Brown bread"
    ]);
  });

  it("rejects duplicate concept keys within one household", async () => {
    const repository = new MongoHouseholdProductConceptRepository(createFakeDb());
    const concept = {
      createdAt: "2026-07-12T00:00:00.000Z",
      createdByUserId: "u",
      householdId: "h",
      key: "brown-bread",
      label: "Brown bread",
      revision: 0,
      status: "active" as const,
      updatedAt: "2026-07-12T00:00:00.000Z",
      updatedByUserId: "u"
    };
    await repository.create(concept);
    await expect(repository.create({ ...concept, label: "brown bread" })).rejects.toThrow(
      "household_concept_already_exists"
    );
  });
});
