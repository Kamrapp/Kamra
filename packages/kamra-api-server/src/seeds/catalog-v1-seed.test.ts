import { describe, expect, it } from "vitest";

import {
  createCatalogV1Seed,
  runCatalogV1Seed,
  type SeedLedgerRecord,
  type CatalogV1SeedRepository
} from "./catalog-v1-seed.js";
import type { SeedPrompt } from "./seed-runner.js";

class InMemoryCatalogV1SeedRepository implements CatalogV1SeedRepository {
  readonly seedLedger: SeedLedgerRecord[] = [];

  async recordSeed(record: SeedLedgerRecord): Promise<void> {
    this.seedLedger.push(record);
  }

  async setup(): Promise<{ databaseName: string; ensuredCollections: string[] }> {
    return {
      databaseName: "kamra_test",
      ensuredCollections: ["products", "product_tags", "stocks"]
    };
  }

  async upsertDataset(): Promise<{
    migrationLedgerCount: number;
    productSourceCount: number;
    productTagAssignmentCount: number;
    productTagCount: number;
    productCount: number;
    stockCount: number;
  }> {
    return {
      migrationLedgerCount: 1,
      productSourceCount: 3,
      productTagAssignmentCount: 7,
      productTagCount: 4,
      productCount: 3,
      stockCount: 3
    };
  }
}

describe("runCatalogV1Seed", () => {
  it("records the catalog v1 seed ledger entry", async () => {
    const repository = new InMemoryCatalogV1SeedRepository();
    const result = await runCatalogV1Seed(
      repository,
      new Date("2026-06-23T12:10:00.000Z")
    );

    expect(result.databaseName).toBe("kamra_test");
    expect(result.seedName).toBe("catalog_v1_foundation");
    expect(repository.seedLedger).toHaveLength(1);
    expect(repository.seedLedger[0]).toMatchObject({
      seedName: "catalog_v1_foundation",
      status: "ok"
    });
  });

  it("runs from seed env configuration without prompting", async () => {
    const repository = new InMemoryCatalogV1SeedRepository();
    const seed = createCatalogV1Seed(repository);
    const prompt: SeedPrompt = {
      confirm: async () => {
        throw new Error("confirm should not be called");
      },
      secret: async () => {
        throw new Error("secret should not be called");
      },
      text: async () => {
        throw new Error("text should not be called");
      }
    };

    const result = await seed.run({
      env: {
        SEED_CATALOG_V1: "1"
      },
      prompt
    });

    expect(result).toMatchObject({
      outcome: "completed",
      seedName: "catalog_v1_foundation"
    });
  });
});
