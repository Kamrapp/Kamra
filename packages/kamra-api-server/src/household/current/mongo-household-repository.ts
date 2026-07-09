import type { AnyBulkWriteOperation, Filter } from "mongodb";

import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type {
  CreateHouseholdRequest,
  CreateHouseholdStockItemRequest,
  DeleteHouseholdStockItemRequest,
  HouseholdListItem,
  HouseholdLocalProductListItem,
  HouseholdLocalProductRecord,
  HouseholdMembershipRecord,
  HouseholdRecord,
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

export interface CreateHouseholdInput extends CreateHouseholdRequest {
  createdAt: string;
  createdByUserId: string;
  id: string;
}

export interface CreateHouseholdResult {
  household: HouseholdListItem;
}

export interface HouseholdSeedDataset {
  households: HouseholdRecord[];
  householdLocalProducts: HouseholdLocalProductRecord[];
  householdMemberships: HouseholdMembershipRecord[];
  householdStockItems: HouseholdStockItemRecord[];
}

export class MongoHouseholdRepository {
  private readonly householdsCollection: MongoCollectionLike<HouseholdRecord>;
  private readonly householdMembershipsCollection: MongoCollectionLike<HouseholdMembershipRecord>;
  private readonly householdLocalProductsCollection: MongoCollectionLike<HouseholdLocalProductRecord>;
  private readonly householdStockItemsCollection: MongoCollectionLike<HouseholdStockItemRecord>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.householdsCollection = database.collection<HouseholdRecord>("households");
    this.householdMembershipsCollection = database.collection<HouseholdMembershipRecord>("household_memberships");
    this.householdLocalProductsCollection = database.collection<HouseholdLocalProductRecord>("household_local_products");
    this.householdStockItemsCollection = database.collection<HouseholdStockItemRecord>("household_stock_items");
  }

  async setupCollections(): Promise<HouseholdSetupSummary> {
    const existingCollections = new Set(
      (await this.database.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name)
    );
    const createdCollections: string[] = [];
    const existingHouseholdCollections: string[] = [];

    for (const [collectionName, schema] of Object.entries(householdV1CollectionSchemas) as Array<
      [keyof typeof householdV1CollectionSchemas, typeof householdV1CollectionSchemas[keyof typeof householdV1CollectionSchemas]]
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

  async createHousehold(input: CreateHouseholdInput): Promise<CreateHouseholdResult> {
    const createdAt = input.createdAt;
    const household: HouseholdRecord = {
      createdAt,
      createdByUserId: input.createdByUserId,
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

  async listHouseholdsForUser(userId: string): Promise<HouseholdListItem[]> {
    const memberships = await this.householdMembershipsCollection.find({
      status: "active",
      userId
    }).toArray();
    if (memberships.length === 0) {
      return [];
    }

    const householdIds = memberships.map((membership) => membership.householdId);
    const [households, allMemberships] = await Promise.all([
      this.householdsCollection.find({
        id: { $in: householdIds },
        status: "active"
      }).sort({ name: 1 }).toArray(),
      this.householdMembershipsCollection.find({
        householdId: { $in: householdIds },
        status: "active"
      }).toArray()
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

  async getHouseholdStockPage(input: HouseholdStockPageRequest & { userId: string }): Promise<HouseholdStockPageResponse | null> {
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
      this.householdLocalProductsCollection.find({
        householdId: household.id,
        status: "active"
      }).sort({ displayName: 1 }).toArray(),
      this.householdStockItemsCollection.find({
        householdId: household.id,
        status: "active"
      }).sort({ displayName: 1 }).toArray(),
      this.householdMembershipsCollection.countDocuments({
        householdId: household.id,
        status: "active"
      })
    ]);

    return {
      household: this.toHouseholdListItem(
        household,
        memberCount,
        membership?.role ?? "member"
      ),
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

    const householdProductId = input.householdProductId?.trim() || createHouseholdProductId(
      input.householdId,
      input.stockGroupKey,
      input.displayName
    );
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
      householdId: input.householdId,
      householdProductId,
      id: createHouseholdStockItemId(input.householdId, householdProductId, input.stockedAt),
      initialAmount,
      minLimit: input.minLimit,
      note: input.note ?? null,
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
    const nextCatalogProductId = input.catalogProductId !== undefined
      ? input.catalogProductId ?? null
      : localProduct.catalogProductId ?? null;
    const nextCatalogProductNameSnapshot = input.catalogProductNameSnapshot !== undefined
      ? input.catalogProductNameSnapshot ?? null
      : localProduct.catalogProductNameSnapshot ?? null;
    const nextCurrentAmount = input.currentAmount ?? stockItem.currentAmount;
    const nextInitialAmount = input.initialAmount ?? stockItem.initialAmount;
    const nextMinLimit = input.minLimit ?? stockItem.minLimit;
    const nextNote = input.note !== undefined ? input.note ?? null : stockItem.note ?? null;
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
          initialAmount: nextInitialAmount,
          minLimit: nextMinLimit,
          note: nextNote,
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
    await this.upsertMany(this.householdsCollection, dataset.households);
    await this.upsertMany(this.householdMembershipsCollection, dataset.householdMemberships);
    await this.upsertMany(this.householdLocalProductsCollection, dataset.householdLocalProducts);
    await this.upsertMany(this.householdStockItemsCollection, dataset.householdStockItems);
  }

  async clearSeedHouseholdData(ids: {
    householdIds: string[];
  }): Promise<{
    deletedHouseholds: number;
    deletedLocalProducts: number;
    deletedMemberships: number;
    deletedStockItems: number;
  }> {
    const [deletedMemberships, deletedLocalProducts, deletedStockItems, deletedHouseholds] = await Promise.all([
      this.householdMembershipsCollection.deleteMany({
        householdId: { $in: ids.householdIds }
      }),
      this.householdLocalProductsCollection.deleteMany({
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
      deletedStockItems: deletedStockItems.deletedCount ?? 0
    };
  }

  private async findAccessibleHousehold(userId: string, householdId: string): Promise<HouseholdRecord | null> {
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
      householdId: input.householdId,
      id: householdProductId,
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
    householdId: product.householdId,
    id: product.id,
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
    householdId: stockItem.householdId,
    householdProductId: stockItem.householdProductId,
    id: stockItem.id,
    initialAmount: stockItem.initialAmount,
    minLimit: stockItem.minLimit,
    note: stockItem.note ?? null,
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

function createHouseholdProductId(householdId: string, stockGroupKey: string, displayName: string): string {
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
