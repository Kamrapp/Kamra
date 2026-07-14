import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import type { HouseholdLocalProductRecord } from "../v1/contracts.js";
import type {
  HouseholdProduct,
  ProductAttributeRef,
  ProductConceptRef,
  TargetPolicy,
  TrackingUnit
} from "./contracts.js";

export class MongoHouseholdProductRepository {
  private readonly products: MongoCollectionLike<HouseholdProduct>;

  constructor(private readonly database: MongoDatabaseLike) {
    this.products = database.collection("household_products");
  }

  async setupCollections(): Promise<void> {
    await Promise.all([
      this.products.createIndex({ id: 1 }, { name: "household_products_id_unique", unique: true }),
      this.products.createIndex(
        { householdId: 1, status: 1, displayName: 1 },
        { name: "household_products_household_status_display" }
      ),
      this.products.createIndex(
        { householdId: 1, catalogProductId: 1 },
        { name: "household_products_household_catalog" }
      ),
      this.products.createIndex(
        { householdId: 1, productGroupId: 1, status: 1, displayName: 1 },
        { name: "household_products_household_group_status_display" }
      )
    ]);
  }

  async create(product: HouseholdProduct): Promise<HouseholdProduct> {
    await this.products.insertOne(product);
    return product;
  }

  async get(householdId: string, id: string): Promise<HouseholdProduct | null> {
    return await this.products.findOne({ householdId, id, status: "active" });
  }

  async list(householdId: string): Promise<HouseholdProduct[]> {
    return await this.products
      .find({ householdId, status: "active" })
      .sort({ displayName: 1 })
      .toArray();
  }

  async findFirstByCatalogProductId(
    householdId: string,
    catalogProductId: string
  ): Promise<HouseholdProduct | null> {
    const products = await this.products
      .find({ householdId, catalogProductId, status: "active" })
      .sort({ displayName: 1, id: 1 })
      .limit(1)
      .toArray();
    return products[0] ?? null;
  }

  async updateClassification(input: {
    householdId: string;
    id: string;
    expectedRevision: number;
    directConcepts: ProductConceptRef[];
    directAttributes: ProductAttributeRef[];
    updatedAt: string;
    updatedByUserId: string;
  }): Promise<HouseholdProduct> {
    const current = await this.products.findOne({
      householdId: input.householdId,
      id: input.id,
      status: "active"
    });
    if (!current) throw new Error("household_product_not_found");
    if (current.revision !== input.expectedRevision) throw new Error("stale_revision");
    const next: HouseholdProduct = {
      ...current,
      classificationRevision: current.classificationRevision + 1,
      directAttributes: input.directAttributes,
      directConcepts: input.directConcepts,
      revision: current.revision + 1,
      updatedAt: input.updatedAt,
      updatedByUserId: input.updatedByUserId
    };
    await this.products.updateOne(
      { householdId: input.householdId, id: input.id, revision: input.expectedRevision },
      { $set: next }
    );
    return next;
  }

  async updateIdentity(input: {
    catalogProductId?: string | null;
    defaultTrackingUnit?: TrackingUnit | null;
    displayName: string;
    householdId: string;
    id: string;
    identitySnapshot?: HouseholdProduct["identitySnapshot"];
    note?: string | null;
    expectedRevision: number;
    productGroupId?: string | null;
    targetPolicy?: TargetPolicy | null;
    updatedAt: string;
    updatedByUserId: string;
  }): Promise<HouseholdProduct> {
    const current = await this.products.findOne({
      householdId: input.householdId,
      id: input.id,
      status: "active"
    });
    if (!current) throw new Error("household_product_not_found");
    if (current.revision !== input.expectedRevision) throw new Error("stale_revision");
    const next: HouseholdProduct = {
      ...current,
      ...(input.catalogProductId === undefined ? {} : { catalogProductId: input.catalogProductId }),
      ...(input.defaultTrackingUnit === undefined
        ? {}
        : { defaultTrackingUnit: input.defaultTrackingUnit }),
      ...(input.identitySnapshot === undefined ? {} : { identitySnapshot: input.identitySnapshot }),
      ...(input.note === undefined ? {} : { note: input.note }),
      ...(input.productGroupId === undefined ? {} : { productGroupId: input.productGroupId }),
      ...(input.targetPolicy === undefined ? {} : { targetPolicy: input.targetPolicy }),
      displayName: input.displayName,
      revision: current.revision + 1,
      updatedAt: input.updatedAt,
      updatedByUserId: input.updatedByUserId
    };
    await this.products.updateOne(
      { householdId: input.householdId, id: input.id, revision: input.expectedRevision },
      { $set: next }
    );
    return next;
  }

  async updateGroupAndPolicy(input: {
    defaultTrackingUnit?: TrackingUnit | null;
    householdId: string;
    id: string;
    note?: string | null;
    expectedRevision: number;
    productGroupId?: string | null;
    targetPolicy?: TargetPolicy | null;
    updatedAt: string;
    updatedByUserId: string;
  }): Promise<HouseholdProduct> {
    const current = await this.products.findOne({
      householdId: input.householdId,
      id: input.id,
      status: "active"
    });
    if (!current) throw new Error("household_product_not_found");
    if (current.revision !== input.expectedRevision) throw new Error("stale_revision");
    const next: HouseholdProduct = {
      ...current,
      ...(input.defaultTrackingUnit === undefined
        ? {}
        : { defaultTrackingUnit: input.defaultTrackingUnit }),
      ...(input.note === undefined ? {} : { note: input.note }),
      ...(input.productGroupId === undefined ? {} : { productGroupId: input.productGroupId }),
      ...(input.targetPolicy === undefined ? {} : { targetPolicy: input.targetPolicy }),
      revision: current.revision + 1,
      updatedAt: input.updatedAt,
      updatedByUserId: input.updatedByUserId
    };
    await this.products.updateOne(
      { householdId: input.householdId, id: input.id, revision: input.expectedRevision },
      { $set: next }
    );
    return next;
  }

  async deleteProduct(input: {
    expectedRevision: number;
    householdId: string;
    id: string;
  }): Promise<{ deletedBatchCount: number }> {
    const current = await this.products.findOne({
      householdId: input.householdId,
      id: input.id,
      status: "active"
    });
    if (!current) throw new Error("household_product_not_found");
    if (current.revision !== input.expectedRevision) throw new Error("stale_revision");
    const batches = await this.database
      .collection("household_stock_batches")
      .deleteMany({ householdId: input.householdId, householdProductId: input.id });
    await this.products.deleteMany({
      householdId: input.householdId,
      id: input.id,
      revision: input.expectedRevision
    });
    return { deletedBatchCount: batches.deletedCount ?? 0 };
  }

  async migrateLegacy(): Promise<{ batchesLinked: number; productsCreated: number }> {
    const legacyProducts = await this.database
      .collection<HouseholdLocalProductRecord>("household_local_products")
      .find({})
      .toArray();
    let productsCreated = 0;
    for (const legacy of legacyProducts) {
      const id = `household-product:${legacy.householdId}:${legacy.id}`;
      const existing = await this.get(legacy.householdId, id);
      if (!existing) {
        await this.create({
          catalogProductId: legacy.catalogProductId,
          classificationRevision: 0,
          createdAt: legacy.createdAt,
          createdByUserId: legacy.createdByUserId,
          directAttributes: [],
          directConcepts: [],
          displayName: legacy.displayName,
          householdId: legacy.householdId,
          id,
          identityKind: legacy.catalogProductId ? "catalogue" : "manual",
          identitySnapshot: { brand: null },
          revision: 0,
          status: legacy.status,
          updatedAt: legacy.updatedAt,
          updatedByUserId: legacy.updatedByUserId
        });
        productsCreated += 1;
      }
    }
    const batches = this.database.collection<{
      householdId: string;
      id: string;
      productId?: string | null;
      householdProductId?: string | null;
    }>("household_stock_batches");
    let batchesLinked = 0;
    for (const legacy of legacyProducts) {
      const result = await batches.updateMany(
        {
          householdId: legacy.householdId,
          productId: legacy.catalogProductId ?? null,
          householdProductId: { $exists: false }
        },
        { $set: { householdProductId: `household-product:${legacy.householdId}:${legacy.id}` } }
      );
      batchesLinked += result.modifiedCount;
    }
    return { batchesLinked, productsCreated };
  }
}
