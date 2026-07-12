import { createCatalogV1SeedDataset } from "../catalog/v1/fixtures.js";
import type { CatalogV1SeedDataset } from "../catalog/v1/contracts.js";
import { assertCatalogV1SeedDataset } from "../catalog/v1/validation.js";
import type { SeedDefinition } from "./seed-runner.js";

export const catalogV1SeedName = "catalog_v1_foundation";
export const seedCatalogV1EnabledEnvName = "SEED_CATALOG_V1";

export interface SeedLedgerRecord {
  completedAt: Date;
  details: unknown;
  seedName: string;
  status: "ok";
}

export interface CatalogV1SeedRepository {
  recordSeed(record: SeedLedgerRecord): Promise<void>;
  setup(): Promise<{ databaseName: string; ensuredCollections: string[] }>;
  upsertDataset(dataset: CatalogV1SeedDataset): Promise<{
    migrationLedgerCount: number;
    productSourceCount: number;
    productTagAssignmentCount: number;
    productTagCount: number;
    productCount: number;
    stockCount: number;
  }>;
}

export async function runCatalogV1Seed(
  repository: CatalogV1SeedRepository,
  now = new Date()
): Promise<{
  databaseName: string;
  ensuredCollections: string[];
  seedName: typeof catalogV1SeedName;
}> {
  const dataset = createCatalogV1SeedDataset();
  assertCatalogV1SeedDataset(dataset);

  const setup = await repository.setup();
  const counts = await repository.upsertDataset(dataset);

  await repository.recordSeed({
    completedAt: now,
    details: {
      collectionCounts: counts,
      databaseName: setup.databaseName
    },
    seedName: catalogV1SeedName,
    status: "ok"
  });

  return {
    databaseName: setup.databaseName,
    ensuredCollections: setup.ensuredCollections,
    seedName: catalogV1SeedName
  };
}

export function createCatalogV1Seed(repository: CatalogV1SeedRepository): SeedDefinition {
  return {
    configured: isCatalogV1SeedConfigured,
    label: "catalog v1 sample data",
    name: catalogV1SeedName,
    optional: true,
    run: async () => {
      const result = await runCatalogV1Seed(repository);

      return {
        details: {
          databaseName: result.databaseName,
          ensuredCollections: result.ensuredCollections
        },
        outcome: "completed",
        seedName: catalogV1SeedName
      };
    }
  };
}

function isCatalogV1SeedConfigured(env: NodeJS.ProcessEnv): boolean {
  return env[seedCatalogV1EnabledEnvName] === "1";
}
