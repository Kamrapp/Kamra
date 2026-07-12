import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";

import { hashPassword } from "../../auth/password-hash.js";
import type { UserDocument } from "../../auth/user-auth.js";
import { writeServerLog } from "../../logging/kamra-logger.js";
import type { SeedDefinition, SeedExecutionContext } from "../../seeds/seed-runner.js";
import type { SeedLedgerRecord } from "../../seeds/admin-identity-seed.js";
import type {
  HouseholdFeatureFlagRecord,
  HouseholdLocalProductRecord,
  HouseholdMembershipRecord,
  HouseholdPurchasePriceObservationRecord,
  HouseholdRecord,
  HouseholdShopRecord,
  HouseholdShoppingListRecord,
  HouseholdStockItemRecord
} from "../v1/contracts.js";
import { MongoHouseholdRepository } from "./mongo-household-repository.js";
import type { HouseholdProduct, StockAllocation, StockBatch, StockMovement, StockTarget, TrackingUnit } from "../v2/contracts.js";

export const demoHouseholdSeedName = "demo_household";
export const seedDemoHouseholdPasswordEnvName = "SEED_DEMO_HOUSEHOLD_PASSWORD";
const demoHouseholdId = "household1";
const demoHouseholdOwnerUserId = "usera";
const demoHouseholdUserIds = [demoHouseholdOwnerUserId, "userb"] as const;

export interface DemoHouseholdSeedInput {
  userPassword: string;
}

export interface DemoHouseholdSeedCounts {
  deletedUsers: number;
  deletedHouseholds: number;
  deletedMemberships: number;
  deletedLocalProducts: number;
  deletedStockItems: number;
  deletedPurchasePriceObservations: number;
  deletedShoppingLists: number;
  users: number;
  households: number;
  memberships: number;
  localProducts: number;
  purchasePriceObservations: number;
  shops: number;
  shoppingLists: number;
  stockItems: number;
}

export interface DemoHouseholdSeedRepository {
  recordSeed(record: SeedLedgerRecord): Promise<void>;
  reseedDemoHousehold(input: DemoHouseholdSeedInput, now?: Date): Promise<DemoHouseholdSeedCounts>;
  setup(): Promise<{ databaseName: string; ensuredCollections: string[] }>;
}

export async function runDemoHouseholdSeed(
  input: DemoHouseholdSeedInput,
  repository: DemoHouseholdSeedRepository,
  now = new Date()
): Promise<{
  databaseName: string;
  ensuredCollections: string[];
  seedName: typeof demoHouseholdSeedName;
}> {
  const setup = await repository.setup();
  const counts = await repository.reseedDemoHousehold(input, now);

  await repository.recordSeed({
    completedAt: now,
    details: {
      counts,
      databaseName: setup.databaseName
    },
    seedName: demoHouseholdSeedName,
    status: "ok"
  });

  return {
    databaseName: setup.databaseName,
    ensuredCollections: setup.ensuredCollections,
    seedName: demoHouseholdSeedName
  };
}

export function createDemoHouseholdSeed(
  repository: DemoHouseholdSeedRepository
): SeedDefinition {
  return {
    configured: isDemoHouseholdSeedConfigured,
    label: "demo household",
    name: demoHouseholdSeedName,
    optional: true,
    run: async (context: SeedExecutionContext) => {
      const input = await readDemoHouseholdSeedInput(context);
      const result = await runDemoHouseholdSeed(input, repository);

      return {
        details: {
          databaseName: result.databaseName,
          ensuredCollections: result.ensuredCollections
        },
        outcome: "completed",
        seedName: demoHouseholdSeedName
      };
    }
  };
}

function isDemoHouseholdSeedConfigured(env: NodeJS.ProcessEnv): boolean {
  return Boolean(readSeedEnvValue(env, seedDemoHouseholdPasswordEnvName));
}

async function readDemoHouseholdSeedInput(
  context: SeedExecutionContext
): Promise<DemoHouseholdSeedInput> {
  const password = readSeedEnvValue(context.env, seedDemoHouseholdPasswordEnvName)
    ?? await context.prompt.secret("Demo household user password");

  if (!password) {
    throw new Error(`${seedDemoHouseholdPasswordEnvName} is required for the demo household seed.`);
  }

  return {
    userPassword: password
  };
}

function readSeedEnvValue(env: NodeJS.ProcessEnv, name: string): string | null {
  return env[name]?.trim() || null;
}

export class MongoHouseholdDemoSeedRepository implements DemoHouseholdSeedRepository {
  private readonly householdRepository: MongoHouseholdRepository;
  private readonly seedLedgerCollection: MongoCollectionLike<SeedLedgerRecord>;
  private readonly usersCollection: MongoCollectionLike<UserDocument>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.householdRepository = new MongoHouseholdRepository(database);
    this.seedLedgerCollection = database.collection<SeedLedgerRecord>("seed_ledger");
    this.usersCollection = database.collection<UserDocument>("users");
  }

  async setup(): Promise<{ databaseName: string; ensuredCollections: string[] }> {
    const householdSetup = await this.householdRepository.setupCollections();

    await Promise.all([
      this.usersCollection.createIndex(
        { email: 1 },
        { name: "users_email_unique", unique: true }
      ),
      this.seedLedgerCollection.createIndex(
        { seedName: 1, completedAt: -1 },
        { name: "seed_ledger_seed_completed_at" }
      )
    ]);
    await Promise.all([
      this.database.collection("household_products").createIndex({ id: 1 }, { name: "household_products_id_unique", unique: true }),
      this.database.collection("household_stock_targets").createIndex({ id: 1 }, { name: "household_stock_targets_id_unique", unique: true }),
      this.database.collection("household_stock_batches").createIndex({ id: 1 }, { name: "household_stock_batches_id_unique", unique: true }),
      this.database.collection("household_stock_allocations").createIndex({ id: 1 }, { name: "household_stock_allocations_id_unique", unique: true }),
      this.database.collection("household_stock_movements").createIndex({ id: 1 }, { name: "household_stock_movements_id_unique", unique: true }),
      this.database.collection("household_domain_operations").createIndex({ id: 1 }, { name: "household_domain_operations_id_unique", unique: true })
    ]);

    return {
      databaseName: householdSetup.databaseName,
      ensuredCollections: [...householdSetup.ensuredCollections, "seed_ledger", "users"]
    };
  }

  async reseedDemoHousehold(
    input: DemoHouseholdSeedInput,
    now = new Date()
  ): Promise<DemoHouseholdSeedCounts> {
    const passwordHash = await hashPassword(input.userPassword);
    const dataset = createDemoHouseholdSeedDataset(now, passwordHash);

    const deletedUsers = await this.usersCollection.deleteMany({
      email: { $in: [...demoHouseholdUserIds] }
    });

    const deletedHouseholdData = await this.householdRepository.clearSeedHouseholdData({
      householdIds: [demoHouseholdId]
    });
    await Promise.all([
      "household_products",
      "household_stock_targets",
      "household_stock_batches",
      "household_stock_allocations",
      "household_stock_movements",
      "household_domain_operations",
      "household_shopping_need_lists"
    ].map(async (collectionName) => await this.database.collection(collectionName).deleteMany({ householdId: demoHouseholdId })));

    await this.upsertDemoUsers(dataset.users);
    await this.householdRepository.upsertSeedDataset({
      householdFeatureFlags: dataset.householdFeatureFlags,
      households: dataset.households,
      householdLocalProducts: dataset.householdLocalProducts,
      householdMemberships: dataset.householdMemberships,
      householdPurchasePriceObservations: dataset.householdPurchasePriceObservations,
      householdShops: dataset.householdShops,
      householdShoppingLists: dataset.householdShoppingLists,
      householdStockItems: dataset.householdStockItems
    });
    await seedDemoHouseholdV2Data(this.database, now);

    const counts: DemoHouseholdSeedCounts = {
      deletedHouseholds: deletedHouseholdData.deletedHouseholds,
      deletedLocalProducts: deletedHouseholdData.deletedLocalProducts,
      deletedMemberships: deletedHouseholdData.deletedMemberships,
      deletedPurchasePriceObservations: deletedHouseholdData.deletedPurchasePriceObservations,
      deletedShoppingLists: deletedHouseholdData.deletedShoppingLists,
      deletedStockItems: deletedHouseholdData.deletedStockItems,
      deletedUsers: deletedUsers.deletedCount ?? 0,
      households: dataset.households.length,
      localProducts: dataset.householdLocalProducts.length,
      memberships: dataset.householdMemberships.length,
      purchasePriceObservations: dataset.householdPurchasePriceObservations.length,
      shops: dataset.householdShops.length,
      shoppingLists: dataset.householdShoppingLists.length,
      stockItems: dataset.householdStockItems.length,
      users: dataset.users.length
    };

    writeServerLog("info", "Demo household reseeded", {
      counts
    });

    return counts;
  }

  async recordSeed(record: SeedLedgerRecord): Promise<void> {
    await this.seedLedgerCollection.insertOne(record);
  }

  private async upsertDemoUsers(users: UserDocument[]): Promise<void> {
    await Promise.all(users.map(async (user) => {
      await this.usersCollection.updateOne(
        { email: user.email },
        {
          $set: {
            authProvider: user.authProvider,
            passwordHash: user.passwordHash,
            profile: user.profile ?? {},
            role: user.role,
            status: user.status,
            updatedAt: user.updatedAt
          },
          $setOnInsert: {
            createdAt: user.createdAt,
            email: user.email
          }
        },
        {
          upsert: true
        }
      );
    }));
  }
}

export function createDemoHouseholdSeedDataset(
  now: Date,
  passwordHash: UserDocument["passwordHash"]
): {
  households: HouseholdRecord[];
  householdLocalProducts: HouseholdLocalProductRecord[];
  householdMemberships: HouseholdMembershipRecord[];
  householdPurchasePriceObservations: HouseholdPurchasePriceObservationRecord[];
  householdFeatureFlags: HouseholdFeatureFlagRecord[];
  householdShops: HouseholdShopRecord[];
  householdShoppingLists: HouseholdShoppingListRecord[];
  householdStockItems: HouseholdStockItemRecord[];
  users: UserDocument[];
} {
  const createdAt = now.toISOString();
  const users: UserDocument[] = demoHouseholdUserIds.map((email) => ({
    authProvider: "bootstrap_credentials",
    createdAt: now,
    email,
    passwordHash,
    role: "user",
    status: "active",
    updatedAt: now
  }));
  const household: HouseholdRecord = {
    allowExpiredItems: true,
    createdAt,
    createdByUserId: demoHouseholdOwnerUserId,
    defaultCalculatedMaxLimitMultiplier: 2,
    favouriteShopId: null,
    id: demoHouseholdId,
    name: "Hungarian nature household",
    status: "active",
    updatedAt: createdAt
  };
  const memberships: HouseholdMembershipRecord[] = demoHouseholdUserIds.map((userId, index) => ({
    createdAt,
    householdId: household.id,
    id: `membership_${demoHouseholdId}_${userId}`,
    role: index === 0 ? "owner" : "member",
    status: "active",
    updatedAt: createdAt,
    userId
  }));

  const seedRows = [
    {
      catalogProductId: null,
      currentAmount: 0.2,
      displayName: "Kenyér",
      idealMaxLimit: 1,
      initialAmount: 1,
      minLimit: 0.5,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -2),
      stockGroupKey: "kenyer",
      unit: "kg"
    },
    {
      catalogProductId: null,
      currentAmount: 1.8,
      displayName: "Tej",
      idealMaxLimit: 4,
      initialAmount: 2,
      minLimit: 2,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -3),
      stockGroupKey: "tej",
      unit: "l"
    },
    {
      catalogProductId: null,
      currentAmount: 4,
      displayName: "Vegyes lekvárok",
      idealMaxLimit: 6,
      initialAmount: 4,
      minLimit: 3,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -7),
      stockGroupKey: "vegyes_lekvarok",
      unit: "uveg"
    },
    {
      catalogProductId: null,
      currentAmount: 0,
      displayName: "Pelenka",
      idealMaxLimit: 80,
      initialAmount: 40,
      minLimit: 40,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -30),
      stockGroupKey: "pelenka",
      unit: "db"
    },
    {
      catalogProductId: null,
      currentAmount: 1.2,
      displayName: "Alma",
      idealMaxLimit: 1.6,
      initialAmount: 1.5,
      minLimit: 0.4,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -6),
      stockGroupKey: "alma",
      unit: "kg"
    },
    {
      catalogProductId: null,
      currentAmount: 0.22,
      displayName: "Répa",
      idealMaxLimit: 0.5,
      initialAmount: 0.3,
      minLimit: 0.2,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -4),
      stockGroupKey: "repa",
      unit: "kg"
    },
    {
      catalogProductId: null,
      currentAmount: 0.3,
      displayName: "Mosószer",
      idealMaxLimit: 2,
      initialAmount: 2,
      minLimit: 1,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -21),
      stockGroupKey: "mososzer",
      unit: "l"
    },
    {
      catalogProductId: null,
      currentAmount: 9,
      displayName: "WC papír",
      idealMaxLimit: 16,
      initialAmount: 16,
      minLimit: 8,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -10),
      stockGroupKey: "wc_papir",
      unit: "tekercs"
    },
    {
      catalogProductId: null,
      currentAmount: 5,
      displayName: "Tojás",
      idealMaxLimit: 12,
      initialAmount: 6,
      minLimit: 6,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -5),
      stockGroupKey: "tojas",
      unit: "db"
    },
    {
      catalogProductId: null,
      currentAmount: 0,
      displayName: "Rizs",
      idealMaxLimit: 2,
      initialAmount: 1,
      minLimit: 1,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -45),
      stockGroupKey: "rizs",
      unit: "kg"
    },
    {
      catalogProductId: null,
      currentAmount: 2.5,
      displayName: "Cukor",
      idealMaxLimit: 3,
      initialAmount: 3,
      minLimit: 1,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -12),
      stockGroupKey: "cukor",
      unit: "kg"
    },
    {
      catalogProductId: null,
      currentAmount: 1,
      displayName: "Tusfürdő",
      idealMaxLimit: 2,
      initialAmount: 1,
      minLimit: 1,
      productSourceId: null,
      stockedAt: offsetIsoDate(now, -1),
      stockGroupKey: "tusfurdo",
      unit: "flakon"
    }
  ] satisfies Array<{
    catalogProductId: string | null;
    currentAmount: number;
    displayName: string;
    idealMaxLimit: number;
    initialAmount: number;
    minLimit: number;
    productSourceId: string | null;
    stockedAt: string;
    stockGroupKey: string;
    unit: string;
  }>;

  const householdLocalProducts: HouseholdLocalProductRecord[] = seedRows.map((row) => ({
    catalogProductId: row.catalogProductId,
    catalogProductNameSnapshot: row.catalogProductId ? row.displayName : null,
    createdAt,
    createdByUserId: demoHouseholdOwnerUserId,
    displayName: row.displayName,
    householdId: household.id,
    id: createDemoHouseholdProductId(row.stockGroupKey),
    productSourceId: row.productSourceId,
    stockGroupKey: row.stockGroupKey,
    status: "active",
    updatedAt: createdAt,
    updatedByUserId: demoHouseholdOwnerUserId
  }));

  const householdStockItems: HouseholdStockItemRecord[] = seedRows.map((row) => ({
    catalogProductId: row.catalogProductId,
    catalogProductNameSnapshot: row.catalogProductId ? row.displayName : null,
    createdAt,
    createdByUserId: demoHouseholdOwnerUserId,
    currentAmount: row.currentAmount,
    displayName: row.displayName,
    householdId: household.id,
    householdProductId: createDemoHouseholdProductId(row.stockGroupKey),
    id: `household_stock_${demoHouseholdId}_${row.stockGroupKey}`,
    idealMaxLimit: row.idealMaxLimit,
    initialAmount: row.initialAmount,
    minLimit: row.minLimit,
    note: null,
    productSourceId: row.productSourceId,
    stockedAt: row.stockedAt,
    stockGroupKey: row.stockGroupKey,
    status: "active",
    unit: row.unit,
    updatedAt: createdAt,
    updatedByUserId: demoHouseholdOwnerUserId
  }));

  const householdShops: HouseholdShopRecord[] = [
    createSeedShop(createdAt, "shop_hu_aldi", "ALDI Hungary", ["aldi-hu-offers"], ["aldi-hu"]),
    createSeedShop(createdAt, "shop_hu_coop", "COOP Hungary", ["coop-hu-offers"], ["coop-hu"]),
    createSeedShop(createdAt, "shop_hu_lidl", "Lidl Hungary", ["lidl-hu-brochure"], ["lidl-hu"]),
    createSeedShop(createdAt, "shop_hu_penny", "PENNY Hungary", ["penny_hu_offers"], ["penny-hu"])
  ];

  return {
    households: [household],
    householdFeatureFlags: [],
    householdLocalProducts,
    householdMemberships: memberships,
    householdPurchasePriceObservations: [],
    householdShops,
    householdShoppingLists: [],
    householdStockItems,
    users
  };
}

async function seedDemoHouseholdV2Data(database: MongoDatabaseLike, now: Date): Promise<void> {
  const timestamp = now.toISOString();
  const date = (days: number): string => offsetIsoDate(now, days).slice(0, 10);
  const milkTarget: StockTarget = { acceptanceCriteria: { acceptedAttributesAny: [], acceptedConceptsAny: [], excludedAttributesAny: [], requiredAttributesAll: [], requiredConceptsAll: [] }, consumptionPolicy: "earliest_expiry_first", createdAt: timestamp, createdByUserId: demoHouseholdOwnerUserId, displayName: "Tej (bármelyik termék)", expiryWarningDays: 5, householdId: demoHouseholdId, id: "stock-target:household1:milk", minimumQuantity: 1, revision: 0, status: "active", targetQuantity: 3, trackingUnit: "l", updatedAt: timestamp, updatedByUserId: demoHouseholdOwnerUserId };
  const products: HouseholdProduct[] = [
    { classificationRevision: 0, createdAt: timestamp, createdByUserId: demoHouseholdOwnerUserId, directAttributes: [], directConcepts: [], displayName: "Pilos 1.5% tej", householdId: demoHouseholdId, id: "household-product:household1:pilos-milk", identityKind: "manual", identitySnapshot: { brand: "Pilos", measurementLabel: "1.5%" }, revision: 0, status: "active", updatedAt: timestamp, updatedByUserId: demoHouseholdOwnerUserId },
    { classificationRevision: 0, createdAt: timestamp, createdByUserId: demoHouseholdOwnerUserId, directAttributes: [], directConcepts: [], displayName: "Mizo laktózmentes tej", householdId: demoHouseholdId, id: "household-product:household1:mizo-milk", identityKind: "manual", identitySnapshot: { brand: "Mizo" }, revision: 0, status: "active", updatedAt: timestamp, updatedByUserId: demoHouseholdOwnerUserId },
    { classificationRevision: 0, createdAt: timestamp, createdByUserId: demoHouseholdOwnerUserId, directAttributes: [], directConcepts: [], displayName: "Kézzel felvitt joghurt", householdId: demoHouseholdId, id: "household-product:household1:yogurt", identityKind: "manual", identitySnapshot: {}, revision: 0, status: "active", updatedAt: timestamp, updatedByUserId: demoHouseholdOwnerUserId }
  ];
  const batch = (id: string, displayName: string, quantity: number, acquiredOn: string, expiryOn: string | null, householdProductId: string, unit: TrackingUnit): StockBatch => ({ acquiredOn, acquisitionSnapshot: { displayName }, classificationSnapshot: { capturedAt: timestamp, directAttributes: [], directConcepts: [], effectiveConcepts: [], source: "manual" }, createdAt: timestamp, createdByUserId: demoHouseholdOwnerUserId, expiryOn, householdId: demoHouseholdId, householdProductId, id, originalQuantity: quantity, remainingQuantity: quantity, revision: 0, status: "available", unit, updatedAt: timestamp, updatedByUserId: demoHouseholdOwnerUserId });
  const batches: StockBatch[] = [
    batch("stock-batch:demo-pilos-milk", "Pilos 1.5% tej", 1.5, date(-10), date(12), products[0]!.id, "l"),
    batch("stock-batch:demo-mizo-milk", "Mizo laktózmentes tej", 1, date(-4), date(8), products[1]!.id, "l"),
    batch("stock-batch:demo-expired-yogurt", "Kézzel felvitt joghurt", 4, date(-2), date(-12), products[2]!.id, "custom:db")
  ];
  const allocations: StockAllocation[] = batches.slice(0, 2).map((item, index) => ({ acceptanceResult: "accepted", allocatedQuantity: item.remainingQuantity, createdAt: timestamp, createdByUserId: demoHouseholdOwnerUserId, householdId: demoHouseholdId, id: `stock-allocation:demo-milk-${index + 1}`, revision: 0, status: "active", stockBatchId: item.id, stockTargetId: milkTarget.id, unit: item.unit, updatedAt: timestamp, updatedByUserId: demoHouseholdOwnerUserId }));
  const movements: StockMovement[] = batches.map((item) => ({ actorUserId: demoHouseholdOwnerUserId, createdAt: timestamp, householdId: demoHouseholdId, id: `stock-movement:${item.id}:opening`, kind: "migration_opening_balance", occurrenceAt: item.acquiredOn, operationId: `demo-seed:${item.id}`, quantityDelta: item.originalQuantity, resultingQuantity: item.remainingQuantity, stockBatchId: item.id, stockTargetId: allocations.find((allocation) => allocation.stockBatchId === item.id)?.stockTargetId, unit: item.unit }));
  await insertSeedRecords(database.collection<HouseholdProduct>("household_products"), products);
  await insertSeedRecords(database.collection<StockTarget>("household_stock_targets"), [milkTarget]);
  await insertSeedRecords(database.collection<StockBatch>("household_stock_batches"), batches);
  await insertSeedRecords(database.collection<StockAllocation>("household_stock_allocations"), allocations);
  await insertSeedRecords(database.collection<StockMovement>("household_stock_movements"), movements);
}

async function insertSeedRecords<T extends { id: string }>(collection: MongoCollectionLike<T>, records: readonly T[]): Promise<void> {
  for (const record of records) await collection.insertOne(record as never);
}

function createDemoHouseholdProductId(stockGroupKey: string): string {
  return `household_product_${demoHouseholdId}_${stockGroupKey}`;
}

function createSeedShop(
  createdAt: string,
  id: string,
  label: string,
  sourceNames: string[],
  storeBrandKeys: string[]
): HouseholdShopRecord {
  return {
    countryCode: "HU",
    createdAt,
    id,
    label,
    sourceNames,
    status: "active",
    storeBrandKeys,
    updatedAt: createdAt
  };
}

function offsetIsoDate(now: Date, days: number): string {
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}
