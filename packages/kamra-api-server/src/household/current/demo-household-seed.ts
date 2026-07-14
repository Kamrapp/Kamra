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
import { householdV1CollectionSchemas } from "../v1/schemas.js";
import { MongoHouseholdRepository } from "./mongo-household-repository.js";
import type {
  HouseholdProduct,
  ProductGroup,
  StockAllocation,
  StockBatch,
  StockMovement,
  StockTarget,
  TargetPolicy,
  TrackingUnit
} from "../v2/contracts.js";

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

export interface DemoHouseholdTeardownCounts {
  deletedHouseholds: number;
  deletedLocalProducts: number;
  deletedMemberships: number;
  deletedPurchasePriceObservations: number;
  deletedShoppingLists: number;
  deletedStockItems: number;
  deletedV2Records: number;
  deletedSeedLedgerRecords: number;
  deletedUsers: number;
}

export interface DemoHouseholdSeedRepository {
  recordSeed(record: SeedLedgerRecord): Promise<void>;
  reseedDemoHousehold(input: DemoHouseholdSeedInput, now?: Date): Promise<DemoHouseholdSeedCounts>;
  teardownDemoHousehold(): Promise<DemoHouseholdTeardownCounts>;
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

export function createDemoHouseholdSeed(repository: DemoHouseholdSeedRepository): SeedDefinition {
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
  const password =
    readSeedEnvValue(context.env, seedDemoHouseholdPasswordEnvName) ??
    (await context.prompt.secret("Demo household user password"));

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
    await assertCurrentHouseholdValidator(this.database);

    await Promise.all([
      this.usersCollection.createIndex({ email: 1 }, { name: "users_email_unique", unique: true }),
      this.seedLedgerCollection.createIndex(
        { seedName: 1, completedAt: -1 },
        { name: "seed_ledger_seed_completed_at" }
      )
    ]);
    await Promise.all([
      this.database
        .collection("household_products")
        .createIndex({ id: 1 }, { name: "household_products_id_unique", unique: true }),
      this.database
        .collection("household_stock_targets")
        .createIndex({ id: 1 }, { name: "household_stock_targets_id_unique", unique: true }),
      this.database
        .collection("household_stock_batches")
        .createIndex({ id: 1 }, { name: "household_stock_batches_id_unique", unique: true }),
      this.database
        .collection("household_stock_allocations")
        .createIndex({ id: 1 }, { name: "household_stock_allocations_id_unique", unique: true }),
      this.database
        .collection("household_stock_movements")
        .createIndex({ id: 1 }, { name: "household_stock_movements_id_unique", unique: true }),
      this.database
        .collection("household_domain_operations")
        .createIndex({ id: 1 }, { name: "household_domain_operations_id_unique", unique: true })
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

    const teardownCounts = await this.teardownDemoHousehold();

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
      deletedHouseholds: teardownCounts.deletedHouseholds,
      deletedLocalProducts: teardownCounts.deletedLocalProducts,
      deletedMemberships: teardownCounts.deletedMemberships,
      deletedPurchasePriceObservations: teardownCounts.deletedPurchasePriceObservations,
      deletedShoppingLists: teardownCounts.deletedShoppingLists,
      deletedStockItems: teardownCounts.deletedStockItems,
      deletedUsers: teardownCounts.deletedUsers,
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

  async teardownDemoHousehold(): Promise<DemoHouseholdTeardownCounts> {
    const deletedUsers = await this.usersCollection.deleteMany({
      email: { $in: [...demoHouseholdUserIds] }
    });
    const deletedHouseholdData = await this.householdRepository.clearSeedHouseholdData({
      householdIds: [demoHouseholdId]
    });
    const deletedHouseholdScopedRecords = await Promise.all(
      [
        "household_feature_flags",
        "household_product_concepts",
        "household_products",
        "household_product_groups",
        "household_stock_targets",
        "household_stock_batches",
        "household_stock_allocations",
        "household_stock_movements",
        "household_domain_operations",
        "household_shopping_need_lists",
        "household_shopping_trips",
        "ingestion_submissions"
      ].map(async (collectionName) => {
        const result = await this.database
          .collection(collectionName)
          .deleteMany({ householdId: demoHouseholdId });
        return result.deletedCount ?? 0;
      })
    );
    const deletedSeedLedgerRecords = await this.seedLedgerCollection.deleteMany({
      seedName: demoHouseholdSeedName
    });

    return {
      deletedLocalProducts: deletedHouseholdData.deletedLocalProducts,
      deletedMemberships: deletedHouseholdData.deletedMemberships,
      deletedPurchasePriceObservations: deletedHouseholdData.deletedPurchasePriceObservations,
      deletedShoppingLists: deletedHouseholdData.deletedShoppingLists,
      deletedStockItems: deletedHouseholdData.deletedStockItems,
      deletedV2Records: deletedHouseholdScopedRecords.reduce((total, count) => total + count, 0),
      deletedHouseholds: deletedHouseholdData.deletedHouseholds,
      deletedSeedLedgerRecords: deletedSeedLedgerRecords.deletedCount ?? 0,
      deletedUsers: deletedUsers.deletedCount ?? 0
    };
  }

  async recordSeed(record: SeedLedgerRecord): Promise<void> {
    await this.seedLedgerCollection.insertOne(record);
  }

  private async upsertDemoUsers(users: UserDocument[]): Promise<void> {
    await Promise.all(
      users.map(async (user) => {
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
      })
    );
  }
}

async function assertCurrentHouseholdValidator(database: MongoDatabaseLike): Promise<void> {
  const result = await database.command({ listCollections: 1 });
  const cursor = isRecord(result["cursor"]) ? result["cursor"] : null;
  const firstBatch = Array.isArray(cursor?.["firstBatch"]) ? cursor["firstBatch"] : [];
  const validatorProblems: string[] = [];

  for (const [collectionName, expectedSchema] of Object.entries(householdV1CollectionSchemas)) {
    const collection = firstBatch.find(
      (entry) => isRecord(entry) && entry["name"] === collectionName
    );
    if (!isRecord(collection)) {
      continue;
    }

    const options = isRecord(collection["options"]) ? collection["options"] : null;
    const validator = options && isRecord(options["validator"]) ? options["validator"] : null;
    const jsonSchema =
      validator && isRecord(validator["$jsonSchema"]) ? validator["$jsonSchema"] : null;
    if (!jsonSchema) {
      continue;
    }

    const actualProperties = isRecord(jsonSchema["properties"]) ? jsonSchema["properties"] : {};
    const expectedProperties = isRecord(expectedSchema["properties"])
      ? expectedSchema["properties"]
      : {};
    const actualRequired = Array.isArray(jsonSchema["required"])
      ? jsonSchema["required"].filter((value): value is string => typeof value === "string")
      : [];
    const expectedRequired = Array.isArray(expectedSchema["required"])
      ? expectedSchema["required"].filter((value): value is string => typeof value === "string")
      : [];
    const missingProperties = Object.keys(expectedProperties).filter(
      (property) => !(property in actualProperties)
    );
    const missingRequired = expectedRequired.filter(
      (property) => !actualRequired.includes(property)
    );
    const enumMismatches = Object.entries(expectedProperties)
      .filter(([property, propertySchema]) => {
        const expectedEnum =
          isRecord(propertySchema) && Array.isArray(propertySchema["enum"])
            ? propertySchema["enum"]
            : null;
        if (!expectedEnum) {
          return false;
        }

        const actualEnum = isRecord(actualProperties[property])
          ? actualProperties[property]["enum"]
          : null;
        return (
          !Array.isArray(actualEnum) || expectedEnum.some((value) => !actualEnum.includes(value))
        );
      })
      .map(([property]) => property);

    if (missingProperties.length || missingRequired.length || enumMismatches.length) {
      const details = [
        missingProperties.length ? `missing properties: ${missingProperties.join(", ")}` : null,
        missingRequired.length ? `missing required fields: ${missingRequired.join(", ")}` : null,
        enumMismatches.length ? `outdated enum fields: ${enumMismatches.join(", ")}` : null
      ]
        .filter((detail): detail is string => detail !== null)
        .join("; ");
      validatorProblems.push(`${collectionName} (${details})`);
    }
  }

  if (validatorProblems.length === 0) {
    return;
  }

  throw new Error(
    `Demo household seed requires current household validators in database '${database.databaseName}'. ${validatorProblems.join(" | ")} Run the database-maintenance validator actions, including household-group-shopping-distribution-v2 (Run all; do not only mark them complete), then retry npm run seed:demo-household.`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    groupTargetShoppingDistributionMode: "split_evenly",
    groupTargetShoppingMode: "add_products_and_group_item",
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
  const policy = (
    minimumQuantity: number,
    desiredQuantity: number,
    trackingUnit: TrackingUnit
  ): TargetPolicy => ({
    consumptionPolicy: "earliest_expiry_first",
    desiredQuantity,
    expiryWarningDays: 5,
    minimumQuantity,
    trackingUnit
  });
  const group = (
    id: string,
    displayName: string,
    trackingUnit: TrackingUnit,
    targetPolicy?: TargetPolicy,
    groupTargetShoppingDistributionModeOverride: ProductGroup["groupTargetShoppingDistributionModeOverride"] = "default",
    groupTargetShoppingModeOverride: ProductGroup["groupTargetShoppingModeOverride"] = "default"
  ): ProductGroup => ({
    createdAt: timestamp,
    createdByUserId: demoHouseholdOwnerUserId,
    displayName,
    groupTargetShoppingDistributionModeOverride,
    groupTargetShoppingModeOverride,
    householdId: demoHouseholdId,
    id: `product-group:${demoHouseholdId}:${id}`,
    revision: 0,
    status: "active",
    targetPolicy: targetPolicy ?? null,
    trackingUnit,
    updatedAt: timestamp,
    updatedByUserId: demoHouseholdOwnerUserId
  });
  const groups: ProductGroup[] = [
    group("milk", "Tej", "l", policy(2, 4, "l")),
    group("bread", "Kenyér", "kg", policy(1, 2, "kg")),
    group("vegetables", "Zöldségek", "kg"),
    group("fruit", "Gyümölcsök", "kg", undefined, "latest"),
    group("nuts", "Egészséges rágcsálnivalók", "kg"),
    group("empty", "Ünnepi sütés", "kg")
  ];
  const groupId = (id: string): string =>
    groups.find((candidate) => candidate.id.endsWith(`:${id}`))!.id;
  const product = (
    id: string,
    displayName: string,
    trackingUnit: TrackingUnit,
    productGroupId: string | null,
    targetPolicy?: TargetPolicy,
    identitySnapshot: HouseholdProduct["identitySnapshot"] = {}
  ): HouseholdProduct => ({
    classificationRevision: 0,
    createdAt: timestamp,
    createdByUserId: demoHouseholdOwnerUserId,
    defaultTrackingUnit: trackingUnit,
    directAttributes: [],
    directConcepts: [],
    displayName,
    householdId: demoHouseholdId,
    id: `household-product:${demoHouseholdId}:${id}`,
    identityKind: "manual",
    identitySnapshot,
    productGroupId,
    revision: 0,
    status: "active",
    targetPolicy: targetPolicy ?? null,
    updatedAt: timestamp,
    updatedByUserId: demoHouseholdOwnerUserId
  });
  const products: HouseholdProduct[] = [
    product("pilos-milk", "Pilos 1.5% tej", "l", groupId("milk"), undefined, {
      brand: "Pilos",
      measurementLabel: "1.5%"
    }),
    product("mizo-milk", "Mizo laktózmentes tej", "l", groupId("milk"), undefined, {
      brand: "Mizo"
    }),
    product("white-bread", "Fehér kenyér", "kg", groupId("bread")),
    product("rye-bread", "Rozskenyér", "kg", groupId("bread")),
    product("tomato", "Paradicsom", "kg", groupId("vegetables")),
    product("cucumber", "Uborka", "kg", groupId("vegetables")),
    product("eggplant", "Padlizsán", "kg", groupId("vegetables")),
    product("apple", "Alma", "kg", groupId("fruit")),
    product("kiwi", "Kiwi", "kg", groupId("fruit")),
    product("blueberry", "Áfonya", "kg", groupId("fruit")),
    product("walnuts", "Dió", "kg", groupId("nuts")),
    product("yogurt", "Kézzel felvitt joghurt", "custom:db", null),
    product("diapers", "Pelenka", "count", null, policy(10, 20, "count")),
    product("sponge", "Mosogatószivacs", "count", null),
    product("softener", "Öblítő", "l", null)
  ];
  const productId = (id: string): string =>
    products.find((candidate) => candidate.id.endsWith(`:${id}`))!.id;
  const batch = (
    id: string,
    displayName: string,
    quantity: number,
    acquiredOn: string,
    expiryOn: string | null,
    householdProductId: string,
    unit: TrackingUnit
  ): StockBatch => ({
    acquiredOn,
    acquisitionSnapshot: { displayName },
    classificationSnapshot: {
      capturedAt: timestamp,
      directAttributes: [],
      directConcepts: [],
      effectiveConcepts: [],
      source: "manual"
    },
    createdAt: timestamp,
    createdByUserId: demoHouseholdOwnerUserId,
    expiryOn,
    householdId: demoHouseholdId,
    householdProductId,
    id: `stock-batch:${demoHouseholdId}:${id}`,
    originalQuantity: quantity,
    remainingQuantity: quantity,
    revision: 0,
    status: "available",
    unit,
    updatedAt: timestamp,
    updatedByUserId: demoHouseholdOwnerUserId
  });
  const milkBatches = [
    batch(
      "pilos-milk-tomorrow",
      "Pilos 1.5% tej",
      1.5,
      date(-10),
      date(1),
      productId("pilos-milk"),
      "l"
    ),
    batch(
      "mizo-milk-week",
      "Mizo laktózmentes tej",
      1,
      date(-4),
      date(7),
      productId("mizo-milk"),
      "l"
    ),
    batch(
      "mizo-milk-later",
      "Mizo laktózmentes tej",
      0.5,
      date(-1),
      date(14),
      productId("mizo-milk"),
      "l"
    )
  ];
  const batches: StockBatch[] = [
    ...milkBatches,
    batch(
      "white-bread-fresh",
      "Fehér kenyér",
      0.5,
      date(-1),
      date(3),
      productId("white-bread"),
      "kg"
    ),
    batch(
      "white-bread-later",
      "Fehér kenyér",
      0.5,
      date(-2),
      date(8),
      productId("white-bread"),
      "kg"
    ),
    batch("rye-bread", "Rozskenyér", 1.2, date(-3), date(6), productId("rye-bread"), "kg"),
    batch("tomato", "Paradicsom", 1, date(-1), date(4), productId("tomato"), "kg"),
    batch("cucumber", "Uborka", 0.7, date(-1), date(3), productId("cucumber"), "kg"),
    batch("eggplant", "Padlizsán", 0.8, date(-2), date(5), productId("eggplant"), "kg"),
    batch("apple-old", "Alma", 1, date(-9), date(-1), productId("apple"), "kg"),
    batch("apple-fresh", "Alma", 1.5, date(-1), date(10), productId("apple"), "kg"),
    batch("kiwi", "Kiwi", 0.8, date(-2), date(6), productId("kiwi"), "kg"),
    batch("blueberry", "Áfonya", 0.25, date(-1), date(2), productId("blueberry"), "kg"),
    batch("walnuts", "Dió", 0.5, date(-20), null, productId("walnuts"), "kg"),
    batch(
      "expired-yogurt",
      "Kézzel felvitt joghurt",
      4,
      date(-2),
      date(-12),
      productId("yogurt"),
      "custom:db"
    ),
    batch("diapers", "Pelenka", 6, date(-2), null, productId("diapers"), "count"),
    batch("sponge", "Mosogatószivacs", 3, date(-5), null, productId("sponge"), "count"),
    batch("softener", "Öblítő", 1, date(-8), date(30), productId("softener"), "l")
  ];
  const milkTarget: StockTarget = {
    acceptanceCriteria: {
      acceptedAttributesAny: [],
      acceptedConceptsAny: [],
      excludedAttributesAny: [],
      requiredAttributesAll: [],
      requiredConceptsAll: []
    },
    consumptionPolicy: "earliest_expiry_first",
    createdAt: timestamp,
    createdByUserId: demoHouseholdOwnerUserId,
    displayName: "Tej (bármelyik termék)",
    expiryWarningDays: 5,
    householdId: demoHouseholdId,
    id: "stock-target:household1:milk",
    minimumQuantity: 2,
    revision: 0,
    status: "active",
    targetQuantity: 4,
    trackingUnit: "l",
    updatedAt: timestamp,
    updatedByUserId: demoHouseholdOwnerUserId
  };
  const allocations: StockAllocation[] = milkBatches.map((item, index) => ({
    acceptanceResult: "accepted",
    allocatedQuantity: item.remainingQuantity,
    createdAt: timestamp,
    createdByUserId: demoHouseholdOwnerUserId,
    householdId: demoHouseholdId,
    id: `stock-allocation:demo-milk-${index + 1}`,
    revision: 0,
    status: "active",
    stockBatchId: item.id,
    stockTargetId: milkTarget.id,
    unit: item.unit,
    updatedAt: timestamp,
    updatedByUserId: demoHouseholdOwnerUserId
  }));
  const movements: StockMovement[] = batches.map((item) => ({
    actorUserId: demoHouseholdOwnerUserId,
    createdAt: timestamp,
    householdId: demoHouseholdId,
    id: `stock-movement:${item.id}:opening`,
    kind: "migration_opening_balance",
    occurrenceAt: item.acquiredOn,
    operationId: `demo-seed:${item.id}`,
    quantityDelta: item.originalQuantity,
    resultingQuantity: item.remainingQuantity,
    stockBatchId: item.id,
    stockTargetId: allocations.find((allocation) => allocation.stockBatchId === item.id)
      ?.stockTargetId,
    unit: item.unit
  }));
  await insertSeedRecords(database.collection<ProductGroup>("household_product_groups"), groups);
  await insertSeedRecords(database.collection<HouseholdProduct>("household_products"), products);
  await insertSeedRecords(database.collection<StockTarget>("household_stock_targets"), [
    milkTarget
  ]);
  await insertSeedRecords(database.collection<StockBatch>("household_stock_batches"), batches);
  await insertSeedRecords(
    database.collection<StockAllocation>("household_stock_allocations"),
    allocations
  );
  await insertSeedRecords(
    database.collection<StockMovement>("household_stock_movements"),
    movements
  );
}

async function insertSeedRecords<T extends { id: string }>(
  collection: MongoCollectionLike<T>,
  records: readonly T[]
): Promise<void> {
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
