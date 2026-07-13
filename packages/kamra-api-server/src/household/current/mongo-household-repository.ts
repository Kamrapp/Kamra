import type { AnyBulkWriteOperation, Filter } from "mongodb";

import type {
  MongoCollectionLike,
  MongoDatabaseLike,
  MongoTransactionClientLike
} from "../../db/mongo-like.js";
import { runMongoTransaction } from "../../db/mongo-transaction.js";
import type {
  CreateHouseholdRequest,
  CreateHouseholdStockItemRequest,
  DeleteHouseholdStockItemRequest,
  HouseholdFeatureFlagKey,
  HouseholdFeatureFlagRecord,
  HouseholdListItem,
  HouseholdLocalProductListItem,
  HouseholdLocalProductRecord,
  HouseholdMembershipRecord,
  HouseholdPurchasePriceObservationRecord,
  HouseholdRecord,
  HouseholdShopRecord,
  HouseholdShoppingListRecord,
  HouseholdStockItemListItem,
  HouseholdStockItemRecord,
  HouseholdStockPageRequest,
  HouseholdStockPageResponse,
  UpdateHouseholdStockItemRequest
} from "../v1/contracts.js";
import { householdV1CollectionSchemas } from "../v1/schemas.js";
import { classifyHouseholdStockStatus } from "./stock-status.js";

interface CollectionIndexPlan {
  indexes: {
    key: Record<string, 1 | -1>;
    options?: Record<string, unknown>;
  }[];
  name: keyof typeof householdV1CollectionSchemas;
}

export const householdResetScopes = [
  "shopping_list",
  "batches",
  "products_and_batches",
  "groups_products_and_batches",
  "all_household_data",
  "delete_household"
] as const;
export type HouseholdResetScope = (typeof householdResetScopes)[number];

const shoppingListResetCollections = [
  "household_shopping_lists",
  "household_shopping_need_lists",
  "household_shopping_trips"
] as const;
const batchResetCollections = [
  "household_stock_items",
  "household_stock_batches",
  "household_stock_allocations",
  "household_stock_movements",
  "household_domain_operations"
] as const;
const productResetCollections = [
  "household_local_products",
  "household_products",
  "household_purchase_price_observations"
] as const;
const groupResetCollections = ["household_product_groups", "household_stock_targets"] as const;
const allHouseholdContentCollections = [
  ...shoppingListResetCollections,
  ...batchResetCollections,
  ...productResetCollections,
  ...groupResetCollections,
  "household_invitations"
] as const;

const collectionPlans: CollectionIndexPlan[] = [
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "households_id_unique", unique: true }
      },
      {
        key: { createdByUserId: 1, status: 1 },
        options: { name: "households_creator_status" }
      }
    ],
    name: "households"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_memberships_id_unique", unique: true }
      },
      {
        key: { householdId: 1, userId: 1 },
        options: { name: "household_memberships_household_user_unique", unique: true }
      },
      {
        key: { userId: 1, status: 1 },
        options: { name: "household_memberships_user_status" }
      },
      {
        key: { householdId: 1, status: 1 },
        options: { name: "household_memberships_household_status" }
      }
    ],
    name: "household_memberships"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_invitations_id_unique", unique: true }
      },
      {
        key: { householdId: 1, email: 1, status: 1 },
        options: { name: "household_invitations_household_email_status" }
      },
      {
        key: { email: 1, status: 1, createdAt: -1 },
        options: { name: "household_invitations_email_status_created_at" }
      }
    ],
    name: "household_invitations"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_local_products_id_unique", unique: true }
      },
      {
        key: { householdId: 1, displayName: 1 },
        options: { name: "household_local_products_household_display" }
      },
      {
        key: { householdId: 1, stockGroupKey: 1, status: 1 },
        options: { name: "household_local_products_household_group_status" }
      }
    ],
    name: "household_local_products"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_feature_flags_id_unique", unique: true }
      },
      {
        key: { key: 1 },
        options: { name: "household_feature_flags_key_unique", unique: true }
      }
    ],
    name: "household_feature_flags"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_purchase_price_observations_id_unique", unique: true }
      },
      {
        key: { householdId: 1, observedAt: -1 },
        options: { name: "household_purchase_price_observations_household_observed_at" }
      },
      {
        key: { shoppingListId: 1, shoppingListLineId: 1 },
        options: { name: "household_purchase_price_observations_list_line" }
      }
    ],
    name: "household_purchase_price_observations"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_shopping_lists_id_unique", unique: true }
      },
      {
        key: { householdId: 1, createdAt: -1 },
        options: { name: "household_shopping_lists_household_created_at" }
      },
      {
        key: { householdId: 1, status: 1, updatedAt: -1 },
        options: { name: "household_shopping_lists_household_status_updated_at" }
      }
    ],
    name: "household_shopping_lists"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_shops_id_unique", unique: true }
      },
      {
        key: { status: 1, label: 1 },
        options: { name: "household_shops_status_label" }
      }
    ],
    name: "household_shops"
  },
  {
    indexes: [
      {
        key: { id: 1 },
        options: { name: "household_stock_items_id_unique", unique: true }
      },
      {
        key: { householdId: 1, householdProductId: 1 },
        options: { name: "household_stock_items_household_product_unique", unique: true }
      },
      {
        key: { householdId: 1, stockGroupKey: 1, status: 1 },
        options: { name: "household_stock_items_household_group_status" }
      },
      {
        key: { householdId: 1, status: 1 },
        options: { name: "household_stock_items_household_status" }
      }
    ],
    name: "household_stock_items"
  }
];

export interface HouseholdSetupSummary {
  createdCollections: string[];
  databaseName: string;
  ensuredCollections: string[];
  existingCollections: string[];
  skippedValidatorUpdates: string[];
}

export interface HouseholdValidatorUpgradeResult {
  createdCollections: string[];
  databaseName: string;
  upgradedCollections: string[];
}

export interface HouseholdFieldsMigrationResult {
  updatedCount: number;
}

export interface CreateHouseholdInput extends CreateHouseholdRequest {
  createdAt: string;
  createdByUserId: string;
  id: string;
}

export interface CreateHouseholdResult {
  household: HouseholdListItem;
}

export interface HouseholdSeedDataset {
  householdFeatureFlags?: HouseholdFeatureFlagRecord[];
  households: HouseholdRecord[];
  householdLocalProducts: HouseholdLocalProductRecord[];
  householdMemberships: HouseholdMembershipRecord[];
  householdPurchasePriceObservations: HouseholdPurchasePriceObservationRecord[];
  householdShops: HouseholdShopRecord[];
  householdShoppingLists: HouseholdShoppingListRecord[];
  householdStockItems: HouseholdStockItemRecord[];
}

export class MongoHouseholdRepository {
  private readonly householdFeatureFlagsCollection: MongoCollectionLike<HouseholdFeatureFlagRecord>;
  private readonly householdsCollection: MongoCollectionLike<HouseholdRecord>;
  private readonly householdMembershipsCollection: MongoCollectionLike<HouseholdMembershipRecord>;
  private readonly householdLocalProductsCollection: MongoCollectionLike<HouseholdLocalProductRecord>;
  private readonly householdPurchasePriceObservationsCollection: MongoCollectionLike<HouseholdPurchasePriceObservationRecord>;
  private readonly householdShoppingListsCollection: MongoCollectionLike<HouseholdShoppingListRecord>;
  private readonly householdShopsCollection: MongoCollectionLike<HouseholdShopRecord>;
  private readonly householdStockItemsCollection: MongoCollectionLike<HouseholdStockItemRecord>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.householdFeatureFlagsCollection =
      database.collection<HouseholdFeatureFlagRecord>("household_feature_flags");
    this.householdsCollection = database.collection<HouseholdRecord>("households");
    this.householdMembershipsCollection =
      database.collection<HouseholdMembershipRecord>("household_memberships");
    this.householdLocalProductsCollection = database.collection<HouseholdLocalProductRecord>(
      "household_local_products"
    );
    this.householdPurchasePriceObservationsCollection =
      database.collection<HouseholdPurchasePriceObservationRecord>(
        "household_purchase_price_observations"
      );
    this.householdShoppingListsCollection = database.collection<HouseholdShoppingListRecord>(
      "household_shopping_lists"
    );
    this.householdShopsCollection = database.collection<HouseholdShopRecord>("household_shops");
    this.householdStockItemsCollection =
      database.collection<HouseholdStockItemRecord>("household_stock_items");
  }

  async setupCollections(): Promise<HouseholdSetupSummary> {
    const existingCollections = new Set(
      (await this.database.listCollections({}, { nameOnly: true }).toArray()).map(
        (entry) => entry.name
      )
    );
    const createdCollections: string[] = [];
    const existingHouseholdCollections: string[] = [];

    for (const [collectionName, schema] of Object.entries(householdV1CollectionSchemas) as Array<
      [
        keyof typeof householdV1CollectionSchemas,
        (typeof householdV1CollectionSchemas)[keyof typeof householdV1CollectionSchemas]
      ]
    >) {
      if (!existingCollections.has(collectionName)) {
        await this.database.createCollection(collectionName, {
          validationAction: "error",
          validationLevel: "strict",
          validator: {
            $jsonSchema: schema
          }
        });
        existingCollections.add(collectionName);
        createdCollections.push(collectionName);
      } else {
        const collection = this.database.collection(collectionName);
        const existingDocumentCount = await collection.countDocuments({}, { limit: 1 });
        if (existingDocumentCount === 0) {
          await collection.drop();
          await this.database.createCollection(collectionName, {
            validationAction: "error",
            validationLevel: "strict",
            validator: {
              $jsonSchema: schema
            }
          });
          createdCollections.push(collectionName);
        } else {
          existingHouseholdCollections.push(collectionName);
        }
      }
    }

    await Promise.all(
      collectionPlans.map(async (plan) => {
        const collection = this.database.collection(plan.name);
        for (const index of plan.indexes) {
          await collection.createIndex(index.key, index.options);
        }
      })
    );

    return {
      createdCollections,
      databaseName: this.database.databaseName,
      ensuredCollections: collectionPlans.map((plan) => plan.name),
      existingCollections: existingHouseholdCollections,
      skippedValidatorUpdates: existingHouseholdCollections
    };
  }

  async upgradeHouseholdValidators(): Promise<HouseholdValidatorUpgradeResult> {
    const existingCollections = new Set(
      (await this.database.listCollections({}, { nameOnly: true }).toArray()).map(
        (entry) => entry.name
      )
    );
    const createdCollections: string[] = [];
    const upgradedCollections: string[] = [];

    for (const [collectionName, schema] of Object.entries(householdV1CollectionSchemas)) {
      if (!existingCollections.has(collectionName)) {
        await this.database.createCollection(collectionName, {
          validationAction: "error",
          validationLevel: "strict",
          validator: {
            $jsonSchema: schema
          }
        });
        createdCollections.push(collectionName);
        existingCollections.add(collectionName);
        continue;
      }

      await this.database.command({
        collMod: collectionName,
        validationAction: "error",
        validationLevel: "strict",
        validator: {
          $jsonSchema: schema
        }
      });
      upgradedCollections.push(collectionName);
    }

    return {
      createdCollections,
      databaseName: this.database.databaseName,
      upgradedCollections
    };
  }

  async migrateHouseholdDefaultFields(): Promise<HouseholdFieldsMigrationResult> {
    let updatedCount = 0;
    const households = await this.householdsCollection.find({}).toArray();

    for (const household of households) {
      const fieldsToSet: Record<string, number | boolean | null | string> = {};
      if (household.defaultCalculatedMaxLimitMultiplier === undefined) {
        fieldsToSet["defaultCalculatedMaxLimitMultiplier"] = 2;
      }
      if (household.allowExpiredItems === undefined) {
        fieldsToSet["allowExpiredItems"] = true;
      }
      if (household.favouriteShopId === undefined) {
        fieldsToSet["favouriteShopId"] = null;
      }
      if (household.groupTargetShoppingMode === undefined) {
        fieldsToSet["groupTargetShoppingMode"] = "add_products_and_group_item";
      }
      if (Object.keys(fieldsToSet).length === 0) {
        continue;
      }

      await this.householdsCollection.updateOne(
        { id: household.id },
        {
          $set: {
            ...fieldsToSet,
            updatedAt: household.updatedAt
          }
        }
      );
      updatedCount += 1;
    }

    return { updatedCount };
  }

  async createHousehold(input: CreateHouseholdInput): Promise<CreateHouseholdResult> {
    const createdAt = input.createdAt;
    const household: HouseholdRecord = {
      createdAt,
      createdByUserId: input.createdByUserId,
      allowExpiredItems: true,
      groupTargetShoppingMode: "add_products_and_group_item",
      id: input.id,
      name: input.name,
      status: "active",
      updatedAt: createdAt
    };
    const membership: HouseholdMembershipRecord = {
      createdAt,
      householdId: input.id,
      id: `membership_${stableSlug(input.id)}_${stableSlug(input.createdByUserId)}`,
      role: "owner",
      status: "active",
      updatedAt: createdAt,
      userId: input.createdByUserId
    };

    await this.householdsCollection.insertOne(household);
    await this.householdMembershipsCollection.insertOne(membership);

    return {
      household: this.toHouseholdListItem(household, 1, "owner")
    };
  }

  async migrateExpiredItemPolicy(): Promise<HouseholdFieldsMigrationResult> {
    let updatedCount = 0;
    const households = await this.householdsCollection.find({}).toArray();
    for (const household of households) {
      if (household.allowExpiredItems !== undefined) continue;
      await this.householdsCollection.updateOne(
        { id: household.id },
        { $set: { allowExpiredItems: true, updatedAt: household.updatedAt } }
      );
      updatedCount += 1;
    }
    return { updatedCount };
  }

  async migrateGroupTargetShoppingMode(): Promise<HouseholdFieldsMigrationResult> {
    let updatedCount = 0;
    const households = await this.householdsCollection.find({}).toArray();
    for (const household of households) {
      if (household.groupTargetShoppingMode !== undefined) continue;
      await this.householdsCollection.updateOne(
        { id: household.id },
        {
          $set: {
            groupTargetShoppingMode: "add_products_and_group_item",
            updatedAt: household.updatedAt
          }
        }
      );
      updatedCount += 1;
    }
    return { updatedCount };
  }

  async updateHouseholdSettings(input: {
    allowExpiredItems?: boolean;
    defaultCalculatedMaxLimitMultiplier?: number;
    groupTargetShoppingMode?: HouseholdRecord["groupTargetShoppingMode"];
    householdId: string;
    name?: string;
    updatedAt: string;
    userId: string;
  }): Promise<{
    allowExpiredItems: boolean;
    defaultCalculatedMaxLimitMultiplier: number;
    groupTargetShoppingMode: NonNullable<HouseholdRecord["groupTargetShoppingMode"]>;
    name: string;
  }> {
    const household = await this.householdsCollection.findOne({ id: input.householdId });
    if (!household) throw new Error("household_not_found");
    const membership = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "owner",
      status: "active",
      userId: input.userId
    });
    if (!membership) throw new Error("household_owner_required");
    const changes = {
      ...(input.allowExpiredItems === undefined
        ? {}
        : { allowExpiredItems: input.allowExpiredItems }),
      ...(input.defaultCalculatedMaxLimitMultiplier === undefined
        ? {}
        : { defaultCalculatedMaxLimitMultiplier: input.defaultCalculatedMaxLimitMultiplier }),
      ...(input.groupTargetShoppingMode === undefined
        ? {}
        : { groupTargetShoppingMode: input.groupTargetShoppingMode }),
      ...(input.name === undefined ? {} : { name: input.name }),
      updatedAt: input.updatedAt
    };
    await this.householdsCollection.updateOne({ id: input.householdId }, { $set: changes });
    return {
      allowExpiredItems: input.allowExpiredItems ?? household.allowExpiredItems ?? true,
      defaultCalculatedMaxLimitMultiplier:
        input.defaultCalculatedMaxLimitMultiplier ??
        household.defaultCalculatedMaxLimitMultiplier ??
        2,
      groupTargetShoppingMode:
        input.groupTargetShoppingMode ??
        household.groupTargetShoppingMode ??
        "add_products_and_group_item",
      name: input.name ?? household.name
    };
  }

  async resetHouseholdContent(input: {
    householdId: string;
    scope: HouseholdResetScope;
    transactionClient: MongoTransactionClientLike;
    userId: string;
  }): Promise<{ deleted: Record<string, number>; scope: HouseholdResetScope }> {
    const household = await this.householdsCollection.findOne({ id: input.householdId });
    if (!household) throw new Error("household_not_found");
    const membership = await this.householdMembershipsCollection.findOne({
      householdId: input.householdId,
      role: "owner",
      status: "active",
      userId: input.userId
    });
    if (!membership) throw new Error("household_owner_required");

    const collections: readonly string[] =
      input.scope === "shopping_list"
        ? shoppingListResetCollections
        : input.scope === "batches"
          ? batchResetCollections
          : input.scope === "products_and_batches"
            ? [...batchResetCollections, ...productResetCollections]
            : input.scope === "groups_products_and_batches"
              ? [...batchResetCollections, ...productResetCollections, ...groupResetCollections]
              : allHouseholdContentCollections;

    return await runMongoTransaction(input.transactionClient, async (session) => {
      const deleted: Record<string, number> = {};
      for (const collectionName of collections) {
        const result = await this.database
          .collection(collectionName)
          .deleteMany({ householdId: input.householdId }, { session });
        deleted[collectionName] = result.deletedCount ?? 0;
      }
      if (input.scope === "delete_household") {
        const memberships = await this.householdMembershipsCollection.deleteMany(
          { householdId: input.householdId },
          { session }
        );
        const households = await this.householdsCollection.deleteMany(
          { id: input.householdId },
          { session }
        );
        deleted["household_memberships"] = memberships.deletedCount ?? 0;
        deleted["households"] = households.deletedCount ?? 0;
      }
      return { deleted, scope: input.scope };
    });
  }

  async listHouseholdsForUser(userId: string): Promise<HouseholdListItem[]> {
    const memberships = await this.householdMembershipsCollection
      .find({
        status: "active",
        userId
      })
      .toArray();
    if (memberships.length === 0) {
      return [];
    }

    const householdIds = memberships.map((membership) => membership.householdId);
    const [households, allMemberships] = await Promise.all([
      this.householdsCollection
        .find({
          id: { $in: householdIds },
          status: "active"
        })
        .sort({ name: 1 })
        .toArray(),
      this.householdMembershipsCollection
        .find({
          householdId: { $in: householdIds },
          status: "active"
        })
        .toArray()
    ]);

    const membershipByHouseholdId = new Map<string, HouseholdMembershipRecord>();
    for (const membership of memberships) {
      membershipByHouseholdId.set(membership.householdId, membership);
    }

    const memberCountByHouseholdId = new Map<string, number>();
    for (const membership of allMemberships) {
      memberCountByHouseholdId.set(
        membership.householdId,
        (memberCountByHouseholdId.get(membership.householdId) ?? 0) + 1
      );
    }

    return households.map((household) =>
      this.toHouseholdListItem(
        household,
        memberCountByHouseholdId.get(household.id) ?? 0,
        membershipByHouseholdId.get(household.id)?.role ?? "member"
      )
    );
  }

  async getHouseholdStockPage(
    input: HouseholdStockPageRequest & { userId: string }
  ): Promise<HouseholdStockPageResponse | null> {
    const household = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!household) {
      return null;
    }

    const membership = await this.householdMembershipsCollection.findOne({
      householdId: household.id,
      status: "active",
      userId: input.userId
    });
    const [localProducts, stockItems, memberCount] = await Promise.all([
      this.householdLocalProductsCollection
        .find({
          householdId: household.id,
          status: "active"
        })
        .sort({ displayName: 1 })
        .toArray(),
      this.householdStockItemsCollection
        .find({
          householdId: household.id,
          status: "active"
        })
        .sort({ displayName: 1 })
        .toArray(),
      this.householdMembershipsCollection.countDocuments({
        householdId: household.id,
        status: "active"
      })
    ]);

    return {
      household: this.toHouseholdListItem(household, memberCount, membership?.role ?? "member"),
      localProducts: localProducts.map(toHouseholdLocalProductListItem),
      stockItems: stockItems.map(toHouseholdStockItemListItem)
    };
  }

  async createHouseholdStockItem(
    input: CreateHouseholdStockItemRequest & {
      createdAt: string;
      createdByUserId: string;
      userId: string;
    }
  ): Promise<HouseholdStockPageResponse | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    const householdProductId =
      input.householdProductId?.trim() ||
      createHouseholdProductId(input.householdId, input.stockGroupKey, input.displayName);
    const localProduct = await this.resolveLocalProductForStockCreate(input, householdProductId);
    if (!localProduct) {
      return null;
    }

    const initialAmount = input.initialAmount ?? input.currentAmount;
    const stockItem: HouseholdStockItemRecord = {
      catalogProductId: localProduct.catalogProductId ?? null,
      catalogProductNameSnapshot: localProduct.catalogProductNameSnapshot ?? null,
      createdAt: input.createdAt,
      createdByUserId: input.createdByUserId,
      currentAmount: input.currentAmount,
      displayName: localProduct.displayName,
      gtin: localProduct.gtin ?? null,
      householdId: input.householdId,
      householdProductId,
      id: createHouseholdStockItemId(input.householdId, householdProductId, input.stockedAt),
      idealMaxLimit: input.idealMaxLimit ?? null,
      initialAmount,
      minLimit: input.minLimit,
      note: input.note ?? null,
      productSourceId: localProduct.productSourceId ?? null,
      sourceName: localProduct.sourceName ?? null,
      sourceProductUrl: localProduct.sourceProductUrl ?? null,
      stockedAt: input.stockedAt,
      stockGroupKey: localProduct.stockGroupKey,
      status: "active",
      unit: input.unit,
      updatedAt: input.createdAt,
      updatedByUserId: input.createdByUserId
    };

    if (!input.householdProductId?.trim()) {
      await this.householdLocalProductsCollection.insertOne(localProduct);
    }
    await this.householdStockItemsCollection.insertOne(stockItem);

    return await this.getHouseholdStockPage({
      householdId: input.householdId,
      userId: input.userId
    });
  }

  async updateHouseholdStockItem(
    input: UpdateHouseholdStockItemRequest & {
      updatedAt: string;
      updatedByUserId: string;
      userId: string;
    }
  ): Promise<HouseholdStockPageResponse | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    const stockItem = await this.householdStockItemsCollection.findOne({
      householdId: input.householdId,
      id: input.id,
      status: "active"
    });
    if (!stockItem) {
      return null;
    }

    const localProduct = await this.householdLocalProductsCollection.findOne({
      householdId: input.householdId,
      id: stockItem.householdProductId,
      status: "active"
    });
    if (!localProduct) {
      return null;
    }

    const nextDisplayName = input.displayName ?? localProduct.displayName;
    const nextStockGroupKey = input.stockGroupKey ?? localProduct.stockGroupKey;
    const nextGtin = input.gtin !== undefined ? (input.gtin ?? null) : (localProduct.gtin ?? null);
    const nextSourceName =
      input.sourceName !== undefined
        ? (input.sourceName ?? null)
        : (localProduct.sourceName ?? null);
    const nextSourceProductUrl =
      input.sourceProductUrl !== undefined
        ? (input.sourceProductUrl ?? null)
        : (localProduct.sourceProductUrl ?? null);
    const nextCatalogProductId =
      input.catalogProductId !== undefined
        ? (input.catalogProductId ?? null)
        : (localProduct.catalogProductId ?? null);
    const nextCatalogProductNameSnapshot =
      input.catalogProductNameSnapshot !== undefined
        ? (input.catalogProductNameSnapshot ?? null)
        : (localProduct.catalogProductNameSnapshot ?? null);
    const nextProductSourceId =
      input.productSourceId !== undefined
        ? (input.productSourceId ?? null)
        : (localProduct.productSourceId ?? null);
    const nextCurrentAmount = input.currentAmount ?? stockItem.currentAmount;
    const nextIdealMaxLimit =
      input.idealMaxLimit !== undefined
        ? (input.idealMaxLimit ?? null)
        : (stockItem.idealMaxLimit ?? null);
    const nextInitialAmount = input.initialAmount ?? stockItem.initialAmount;
    const nextMinLimit = input.minLimit ?? stockItem.minLimit;
    const nextNote = input.note !== undefined ? (input.note ?? null) : (stockItem.note ?? null);
    const nextStockedAt = input.stockedAt ?? stockItem.stockedAt;
    const nextUnit = input.unit ?? stockItem.unit;

    await this.householdLocalProductsCollection.updateOne(
      {
        householdId: input.householdId,
        id: localProduct.id,
        status: "active"
      },
      {
        $set: {
          catalogProductId: nextCatalogProductId,
          catalogProductNameSnapshot: nextCatalogProductNameSnapshot,
          displayName: nextDisplayName,
          gtin: nextGtin,
          productSourceId: nextProductSourceId,
          sourceName: nextSourceName,
          sourceProductUrl: nextSourceProductUrl,
          stockGroupKey: nextStockGroupKey,
          updatedAt: input.updatedAt,
          updatedByUserId: input.updatedByUserId
        }
      }
    );

    await this.householdStockItemsCollection.updateOne(
      {
        householdId: input.householdId,
        id: input.id,
        status: "active"
      },
      {
        $set: {
          catalogProductId: nextCatalogProductId,
          catalogProductNameSnapshot: nextCatalogProductNameSnapshot,
          currentAmount: nextCurrentAmount,
          displayName: nextDisplayName,
          gtin: nextGtin,
          idealMaxLimit: nextIdealMaxLimit,
          initialAmount: nextInitialAmount,
          minLimit: nextMinLimit,
          note: nextNote,
          productSourceId: nextProductSourceId,
          sourceName: nextSourceName,
          sourceProductUrl: nextSourceProductUrl,
          stockedAt: nextStockedAt,
          stockGroupKey: nextStockGroupKey,
          unit: nextUnit,
          updatedAt: input.updatedAt,
          updatedByUserId: input.updatedByUserId
        }
      }
    );

    return await this.getHouseholdStockPage({
      householdId: input.householdId,
      userId: input.userId
    });
  }

  async archiveHouseholdStockItem(
    input: DeleteHouseholdStockItemRequest & {
      updatedAt: string;
      updatedByUserId: string;
      userId: string;
    }
  ): Promise<HouseholdStockPageResponse | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    const stockItem = await this.householdStockItemsCollection.findOne({
      householdId: input.householdId,
      id: input.id,
      status: "active"
    });
    if (!stockItem) {
      return null;
    }

    await this.householdStockItemsCollection.updateOne(
      {
        householdId: input.householdId,
        id: input.id,
        status: "active"
      },
      {
        $set: {
          status: "archived",
          updatedAt: input.updatedAt,
          updatedByUserId: input.updatedByUserId
        }
      }
    );

    const remainingActiveStockCount = await this.householdStockItemsCollection.countDocuments({
      householdId: input.householdId,
      householdProductId: stockItem.householdProductId,
      status: "active"
    });
    if (remainingActiveStockCount === 0) {
      await this.householdLocalProductsCollection.updateOne(
        {
          householdId: input.householdId,
          id: stockItem.householdProductId,
          status: "active"
        },
        {
          $set: {
            status: "archived",
            updatedAt: input.updatedAt,
            updatedByUserId: input.updatedByUserId
          }
        }
      );
    }

    return await this.getHouseholdStockPage({
      householdId: input.householdId,
      userId: input.userId
    });
  }

  async archiveHouseholdLocalProduct(input: {
    householdId: string;
    id: string;
    updatedAt: string;
    updatedByUserId: string;
    userId: string;
  }): Promise<HouseholdStockPageResponse | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    const localProduct = await this.householdLocalProductsCollection.findOne({
      householdId: input.householdId,
      id: input.id,
      status: "active"
    });
    if (!localProduct) {
      return null;
    }

    await this.householdLocalProductsCollection.updateOne(
      {
        householdId: input.householdId,
        id: input.id,
        status: "active"
      },
      {
        $set: {
          status: "archived",
          updatedAt: input.updatedAt,
          updatedByUserId: input.updatedByUserId
        }
      }
    );

    await this.householdStockItemsCollection.updateMany(
      {
        householdId: input.householdId,
        householdProductId: input.id,
        status: "active"
      },
      {
        $set: {
          status: "archived",
          updatedAt: input.updatedAt,
          updatedByUserId: input.updatedByUserId
        }
      }
    );

    return await this.getHouseholdStockPage({
      householdId: input.householdId,
      userId: input.userId
    });
  }

  async upsertSeedDataset(dataset: HouseholdSeedDataset): Promise<void> {
    await this.upsertMany(
      this.householdFeatureFlagsCollection,
      dataset.householdFeatureFlags ?? []
    );
    await this.upsertMany(this.householdsCollection, dataset.households);
    await this.upsertMany(this.householdMembershipsCollection, dataset.householdMemberships);
    await this.upsertMany(this.householdLocalProductsCollection, dataset.householdLocalProducts);
    await this.upsertMany(
      this.householdPurchasePriceObservationsCollection,
      dataset.householdPurchasePriceObservations
    );
    await this.upsertMany(this.householdShoppingListsCollection, dataset.householdShoppingLists);
    await this.upsertMany(this.householdShopsCollection, dataset.householdShops);
    await this.upsertMany(this.householdStockItemsCollection, dataset.householdStockItems);
  }

  async clearSeedHouseholdData(ids: { householdIds: string[] }): Promise<{
    deletedHouseholds: number;
    deletedLocalProducts: number;
    deletedMemberships: number;
    deletedPurchasePriceObservations: number;
    deletedShoppingLists: number;
    deletedStockItems: number;
  }> {
    await this.database.collection("household_invitations").deleteMany({
      householdId: { $in: ids.householdIds }
    });
    const [
      deletedMemberships,
      deletedLocalProducts,
      deletedPurchasePriceObservations,
      deletedShoppingLists,
      deletedStockItems,
      deletedHouseholds
    ] = await Promise.all([
      this.householdMembershipsCollection.deleteMany({
        householdId: { $in: ids.householdIds }
      }),
      this.householdLocalProductsCollection.deleteMany({
        householdId: { $in: ids.householdIds }
      }),
      this.householdPurchasePriceObservationsCollection.deleteMany({
        householdId: { $in: ids.householdIds }
      }),
      this.householdShoppingListsCollection.deleteMany({
        householdId: { $in: ids.householdIds }
      }),
      this.householdStockItemsCollection.deleteMany({
        householdId: { $in: ids.householdIds }
      }),
      this.householdsCollection.deleteMany({
        id: { $in: ids.householdIds }
      })
    ]);

    return {
      deletedHouseholds: deletedHouseholds.deletedCount ?? 0,
      deletedLocalProducts: deletedLocalProducts.deletedCount ?? 0,
      deletedMemberships: deletedMemberships.deletedCount ?? 0,
      deletedPurchasePriceObservations: deletedPurchasePriceObservations.deletedCount ?? 0,
      deletedShoppingLists: deletedShoppingLists.deletedCount ?? 0,
      deletedStockItems: deletedStockItems.deletedCount ?? 0
    };
  }

  async listShops(): Promise<HouseholdShopRecord[]> {
    return await this.householdShopsCollection
      .find({
        status: "active"
      })
      .sort({ label: 1 })
      .toArray();
  }

  async listFeatureFlags(): Promise<HouseholdFeatureFlagRecord[]> {
    return await this.householdFeatureFlagsCollection.find({}).sort({ key: 1 }).toArray();
  }

  async readFeatureFlag(
    key: HouseholdFeatureFlagKey,
    defaultEnabled: boolean
  ): Promise<{ enabled: boolean; key: HouseholdFeatureFlagKey }> {
    const record = await this.householdFeatureFlagsCollection.findOne({ key });
    return {
      enabled: record?.enabled ?? defaultEnabled,
      key
    };
  }

  async updateFeatureFlag(input: {
    enabled: boolean;
    key: HouseholdFeatureFlagKey;
    updatedAt: string;
    updatedByUserId: string;
  }): Promise<HouseholdFeatureFlagRecord> {
    await this.householdFeatureFlagsCollection.updateOne(
      {
        key: input.key
      },
      {
        $set: {
          enabled: input.enabled,
          updatedAt: input.updatedAt,
          updatedByUserId: input.updatedByUserId
        },
        $setOnInsert: {
          createdAt: input.updatedAt,
          id: `household_feature_flag_${stableSlug(input.key)}`,
          key: input.key
        }
      },
      {
        upsert: true
      }
    );

    return (await this.householdFeatureFlagsCollection.findOne({
      key: input.key
    })) as HouseholdFeatureFlagRecord;
  }

  async findShopById(id: string): Promise<HouseholdShopRecord | null> {
    return await this.householdShopsCollection.findOne({
      id,
      status: "active"
    });
  }

  async createShoppingList(
    input: HouseholdShoppingListRecord & { userId: string }
  ): Promise<HouseholdShoppingListRecord | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    const shoppingList: HouseholdShoppingListRecord = {
      createdAt: input.createdAt,
      createdByUserId: input.createdByUserId,
      householdId: input.householdId,
      id: input.id,
      items: input.items,
      schemaVersion: input.schemaVersion,
      scale: input.scale,
      shopId: input.shopId,
      status: input.status,
      stockAppliedAt: input.stockAppliedAt,
      updatedAt: input.updatedAt,
      updatedByUserId: input.updatedByUserId
    };

    await this.householdShoppingListsCollection.insertOne(shoppingList);
    return await this.householdShoppingListsCollection.findOne({ id: input.id });
  }

  async getLatestShoppingList(input: {
    householdId: string;
    userId: string;
  }): Promise<HouseholdShoppingListRecord | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    return await this.householdShoppingListsCollection
      .find({
        householdId: input.householdId,
        status: { $in: ["active", "completed"] }
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()
      .then((items) => items[0] ?? null);
  }

  async getShoppingList(input: {
    householdId: string;
    id: string;
    userId: string;
  }): Promise<HouseholdShoppingListRecord | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    return await this.householdShoppingListsCollection.findOne({
      householdId: input.householdId,
      id: input.id
    });
  }

  async updateShoppingList(input: {
    householdId: string;
    id: string;
    items?: HouseholdShoppingListRecord["items"];
    shopId?: string | null;
    status?: HouseholdShoppingListRecord["status"];
    stockAppliedAt?: string | null;
    updatedAt: string;
    updatedByUserId: string;
    userId: string;
  }): Promise<HouseholdShoppingListRecord | null> {
    const accessibleHousehold = await this.findAccessibleHousehold(input.userId, input.householdId);
    if (!accessibleHousehold) {
      return null;
    }

    const updateFields: Partial<HouseholdShoppingListRecord> = {
      updatedAt: input.updatedAt,
      updatedByUserId: input.updatedByUserId
    };
    if (input.items !== undefined) {
      updateFields.items = input.items;
    }
    if (input.shopId !== undefined) {
      updateFields.shopId = input.shopId;
    }
    if (input.status !== undefined) {
      updateFields.status = input.status;
    }
    if (input.stockAppliedAt !== undefined) {
      updateFields.stockAppliedAt = input.stockAppliedAt;
    }

    await this.householdShoppingListsCollection.updateOne(
      {
        householdId: input.householdId,
        id: input.id
      },
      {
        $set: updateFields
      }
    );

    return await this.householdShoppingListsCollection.findOne({
      householdId: input.householdId,
      id: input.id
    });
  }

  async upsertHouseholdPurchasePriceObservations(
    records: readonly HouseholdPurchasePriceObservationRecord[]
  ): Promise<void> {
    await this.upsertMany(this.householdPurchasePriceObservationsCollection, records);
  }

  private async findAccessibleHousehold(
    userId: string,
    householdId: string
  ): Promise<HouseholdRecord | null> {
    const membership = await this.householdMembershipsCollection.findOne({
      householdId,
      status: "active",
      userId
    });
    if (!membership) {
      return null;
    }

    return await this.householdsCollection.findOne({
      id: householdId,
      status: "active"
    });
  }

  private async resolveLocalProductForStockCreate(
    input: CreateHouseholdStockItemRequest & {
      createdAt: string;
      createdByUserId: string;
    },
    householdProductId: string
  ): Promise<HouseholdLocalProductRecord | null> {
    if (input.householdProductId?.trim()) {
      return await this.householdLocalProductsCollection.findOne({
        householdId: input.householdId,
        id: householdProductId,
        status: "active"
      });
    }

    return {
      catalogProductId: input.catalogProductId ?? null,
      catalogProductNameSnapshot: input.catalogProductNameSnapshot ?? null,
      createdAt: input.createdAt,
      createdByUserId: input.createdByUserId,
      displayName: input.displayName,
      gtin: input.gtin ?? null,
      householdId: input.householdId,
      id: householdProductId,
      productSourceId: input.productSourceId ?? null,
      sourceName: input.sourceName ?? null,
      sourceProductUrl: input.sourceProductUrl ?? null,
      stockGroupKey: input.stockGroupKey,
      status: "active",
      updatedAt: input.createdAt,
      updatedByUserId: input.createdByUserId
    };
  }

  private toHouseholdListItem(
    household: HouseholdRecord,
    memberCount: number,
    membershipRole: HouseholdListItem["membershipRole"] = "member"
  ): HouseholdListItem {
    return {
      createdAt: household.createdAt,
      allowExpiredItems: household.allowExpiredItems ?? true,
      defaultCalculatedMaxLimitMultiplier: household.defaultCalculatedMaxLimitMultiplier ?? 2,
      groupTargetShoppingMode: household.groupTargetShoppingMode ?? "add_products_and_group_item",
      favouriteShopId: household.favouriteShopId ?? null,
      id: household.id,
      membershipRole,
      memberCount,
      name: household.name,
      status: household.status,
      updatedAt: household.updatedAt
    };
  }

  private async upsertMany<T extends { id: string }>(
    collection: MongoCollectionLike<T>,
    records: readonly T[]
  ): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const operations: AnyBulkWriteOperation<T>[] = records.map((record) => ({
      replaceOne: {
        filter: { id: record.id } as Filter<T>,
        replacement: record,
        upsert: true
      }
    }));

    await collection.bulkWrite(operations);
  }
}

function toHouseholdLocalProductListItem(
  product: HouseholdLocalProductRecord
): HouseholdLocalProductListItem {
  return {
    catalogProductId: product.catalogProductId ?? null,
    catalogProductNameSnapshot: product.catalogProductNameSnapshot ?? null,
    createdAt: product.createdAt,
    displayName: product.displayName,
    gtin: product.gtin ?? null,
    householdId: product.householdId,
    id: product.id,
    productSourceId: product.productSourceId ?? null,
    sourceName: product.sourceName ?? null,
    sourceProductUrl: product.sourceProductUrl ?? null,
    stockGroupKey: product.stockGroupKey,
    status: product.status,
    updatedAt: product.updatedAt
  };
}

function toHouseholdStockItemListItem(
  stockItem: HouseholdStockItemRecord
): HouseholdStockItemListItem {
  return {
    catalogProductId: stockItem.catalogProductId ?? null,
    catalogProductNameSnapshot: stockItem.catalogProductNameSnapshot ?? null,
    createdAt: stockItem.createdAt,
    currentAmount: stockItem.currentAmount,
    displayName: stockItem.displayName,
    gtin: stockItem.gtin ?? null,
    householdId: stockItem.householdId,
    householdProductId: stockItem.householdProductId,
    id: stockItem.id,
    idealMaxLimit: stockItem.idealMaxLimit ?? null,
    initialAmount: stockItem.initialAmount,
    minLimit: stockItem.minLimit,
    note: stockItem.note ?? null,
    productSourceId: stockItem.productSourceId ?? null,
    sourceName: stockItem.sourceName ?? null,
    sourceProductUrl: stockItem.sourceProductUrl ?? null,
    stockedAt: stockItem.stockedAt,
    stockGroupKey: stockItem.stockGroupKey,
    stockStatus: classifyHouseholdStockStatus({
      currentAmount: stockItem.currentAmount,
      minLimit: stockItem.minLimit
    }),
    status: stockItem.status,
    unit: stockItem.unit,
    updatedAt: stockItem.updatedAt
  };
}

function createHouseholdProductId(
  householdId: string,
  stockGroupKey: string,
  displayName: string
): string {
  return `household_product_${stableSlug(householdId)}_${stableSlug(stockGroupKey)}_${stableSlug(displayName)}`;
}

function createHouseholdStockItemId(
  householdId: string,
  householdProductId: string,
  stockedAt: string
): string {
  return `household_stock_${stableSlug(householdId)}_${stableSlug(householdProductId)}_${stableSlug(stockedAt)}`;
}

function stableSlug(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "item";
}
