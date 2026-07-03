import type { AnyBulkWriteOperation, Collection, Db, Document, Filter } from "mongodb";

import type {
  CatalogProductListItem,
  CatalogProductOfferListItem,
  CatalogProductOfferPrice,
  MigrationLedgerRecord,
  PriceObservationRecord,
  PriceObservationKind,
  ProductRecord,
  ProductSourceIdentifierRecord,
  ProductSourceRecord,
  ProductTagAssignmentRecord,
  ProductTagRecord,
  SourceRecordProcessingStateRecord,
  CatalogV1SeedDataset,
  StockRecord
} from "../v1/contracts.js";
import { catalogV1CollectionSchemas } from "../v1/schemas.js";

interface CollectionIndexPlan {
  indexes: {
    key: Record<string, 1 | -1>;
    options?: Document;
  }[];
  name: string;
}

export interface CatalogProductReviewPageOptions {
  limit?: number;
  offset?: number;
  sourceNames?: string[];
}

export interface CatalogProductReviewPage {
  products: CatalogProductListItem[];
  totalCount: number;
}

const collectionPlans: CollectionIndexPlan[] = [
  {
    indexes: [
      {
        key: { productId: 1, observedAt: -1 },
        options: { name: "price_observations_product_observed_at" }
      },
      {
        key: { productSourceId: 1, priceKind: 1, observedAt: -1 },
        options: { name: "price_observations_source_kind_observed_at" }
      },
      {
        key: { sourceName: 1, sourceProductKey: 1, observedAt: -1 },
        options: { name: "price_observations_source_product_observed_at" }
      }
    ],
    name: "price_observations"
  },
  {
    indexes: [
      {
        key: { migrationId: 1 },
        options: { name: "migration_ledger_migration_id_unique", unique: true }
      }
    ],
    name: "migration_ledger"
  },
  {
    indexes: [
      {
        key: { productSourceId: 1, kind: 1, value: 1 },
        options: { name: "product_source_identifiers_source_kind_value_unique", unique: true }
      },
      {
        key: { sourceName: 1, kind: 1, value: 1 },
        options: { name: "product_source_identifiers_source_value" }
      }
    ],
    name: "product_source_identifiers"
  },
  {
    indexes: [
      {
        key: { productId: 1, sourceName: 1 },
        options: { name: "product_sources_product_source_name" }
      },
      {
        key: { sourceName: 1, sourceProductKey: 1 },
        options: { name: "product_sources_source_key_unique", unique: true }
      }
    ],
    name: "product_sources"
  },
  {
    indexes: [
      {
        key: { productId: 1, tagKey: 1 },
        options: { name: "product_tag_assignments_product_tag_unique", unique: true }
      },
      {
        key: { tagKey: 1 },
        options: { name: "product_tag_assignments_tag_key" }
      }
    ],
    name: "product_tag_assignments"
  },
  {
    indexes: [
      {
        key: { key: 1 },
        options: { name: "product_tags_key_unique", unique: true }
      },
      {
        key: { kind: 1, parentKey: 1 },
        options: { name: "product_tags_kind_parent" }
      }
    ],
    name: "product_tags"
  },
  {
    indexes: [
      {
        key: { normalizedName: 1 },
        options: { name: "products_normalized_name" }
      },
      {
        key: { primaryCategoryKey: 1, status: 1 },
        options: { name: "products_primary_category_status" }
      }
    ],
    name: "products"
  },
  {
    indexes: [
      {
        key: { sourceName: 1, processorName: 1, processorVersion: 1, recordFingerprint: 1 },
        options: {
          name: "source_processing_state_source_processor_fingerprint_unique",
          unique: true
        }
      }
    ],
    name: "source_record_processing_states"
  },
  {
    indexes: [
      {
        key: { productId: 1, "location.kind": 1 },
        options: { name: "stocks_product_location_kind" }
      },
      {
        key: { "location.locationKey": 1, productId: 1 },
        options: { name: "stocks_location_product" }
      }
    ],
    name: "stocks"
  }
];

export interface CurrentCatalogSetupSummary {
  createdCollections: string[];
  databaseName: string;
  ensuredCollections: string[];
  existingCollections: string[];
  skippedValidatorUpdates: string[];
}

export interface CurrentCatalogSmokeCheckResult {
  collectionCounts: Record<string, number>;
  databaseName: string;
  sampleProductNames: string[];
}

export class MongoCurrentCatalogRepository {
  private readonly migrationLedgerCollection: Collection<MigrationLedgerRecord>;
  private readonly priceObservationsCollection: Collection<PriceObservationRecord>;
  private readonly productSourceIdentifiersCollection: Collection<ProductSourceIdentifierRecord>;
  private readonly productSourcesCollection: Collection<ProductSourceRecord>;
  private readonly productTagAssignmentsCollection: Collection<ProductTagAssignmentRecord>;
  private readonly productTagsCollection: Collection<ProductTagRecord>;
  private readonly productsCollection: Collection<ProductRecord>;
  private readonly sourceRecordProcessingStatesCollection: Collection<SourceRecordProcessingStateRecord>;
  private readonly stocksCollection: Collection<StockRecord>;

  constructor(private readonly database: Db) {
    this.migrationLedgerCollection = database.collection<MigrationLedgerRecord>("migration_ledger");
    this.priceObservationsCollection = database.collection<PriceObservationRecord>("price_observations");
    this.productSourceIdentifiersCollection = database.collection<ProductSourceIdentifierRecord>(
      "product_source_identifiers"
    );
    this.productSourcesCollection = database.collection<ProductSourceRecord>("product_sources");
    this.productTagAssignmentsCollection = database.collection<ProductTagAssignmentRecord>("product_tag_assignments");
    this.productTagsCollection = database.collection<ProductTagRecord>("product_tags");
    this.productsCollection = database.collection<ProductRecord>("products");
    this.sourceRecordProcessingStatesCollection = database.collection<SourceRecordProcessingStateRecord>(
      "source_record_processing_states"
    );
    this.stocksCollection = database.collection<StockRecord>("stocks");
  }

  async listCatalogProductsForReview(
    options: CatalogProductReviewPageOptions = {}
  ): Promise<CatalogProductReviewPage> {
    const requestedSourceNames = [...new Set(options.sourceNames ?? [])].filter((sourceName) => sourceName.length > 0);
    const productFilter: Filter<ProductRecord> = { status: "active" };

    if (requestedSourceNames.length > 0) {
      const productIdsForSources = await this.productSourcesCollection.distinct("productId", {
        sourceName: { $in: requestedSourceNames }
      });
      productFilter.id = { $in: productIdsForSources };
    }

    let productQuery = this.productsCollection
      .find(productFilter)
      .sort({ name: 1 });

    if (typeof options.offset === "number" && options.offset > 0) {
      productQuery = productQuery.skip(options.offset);
    }

    if (typeof options.limit === "number" && options.limit > 0) {
      productQuery = productQuery.limit(options.limit);
    }

    const [products, totalCount] = await Promise.all([
      productQuery.toArray(),
      this.productsCollection.countDocuments(productFilter)
    ]);

    const productIds = products.map((product) => product.id);
    const [productTagAssignments, productSources, householdStocks] = await Promise.all([
      this.productTagAssignmentsCollection.find({
        productId: { $in: productIds }
      }).toArray(),
      this.productSourcesCollection.find({
        productId: { $in: productIds }
      }).toArray(),
      this.stocksCollection.find({
        productId: { $in: productIds },
        "location.kind": "household",
        status: "active"
      }).toArray()
    ]);
    const productSourceIds = productSources.map((source) => source.id);
    const [productSourceIdentifiers, priceObservations] = await Promise.all([
      this.productSourceIdentifiersCollection.find({
        productSourceId: { $in: productSourceIds }
      }).toArray(),
      this.priceObservationsCollection.find({
        productSourceId: { $in: productSourceIds }
      }).sort({ observedAt: -1 }).toArray()
    ]);

    const tagsByProductId = new Map<string, string[]>();
    for (const assignment of productTagAssignments) {
      const values = tagsByProductId.get(assignment.productId) ?? [];
      values.push(assignment.tagKey);
      tagsByProductId.set(assignment.productId, values);
    }

    const sourcesByProductId = new Map<string, string[]>();
    const offerRowsByProductId = new Map<string, CatalogProductOfferListItem[]>();
    const identifiersByProductSourceId = new Map<string, ProductSourceIdentifierRecord[]>();
    const pricesByProductSourceId = new Map<string, Partial<Record<PriceObservationKind, CatalogProductOfferPrice>>>();

    for (const identifier of productSourceIdentifiers) {
      const values = identifiersByProductSourceId.get(identifier.productSourceId) ?? [];
      values.push(identifier);
      identifiersByProductSourceId.set(identifier.productSourceId, values);
    }

    for (const priceObservation of priceObservations) {
      const prices = pricesByProductSourceId.get(priceObservation.productSourceId) ?? {};
      if (!prices[priceObservation.priceKind]) {
        prices[priceObservation.priceKind] = {
          amount: priceObservation.price.amount,
          currencyCode: priceObservation.price.currencyCode,
          observedAt: priceObservation.observedAt,
          programName: priceObservation.programName,
          unitPriceLabel: priceObservation.unitPriceLabel,
          validFrom: priceObservation.validFrom,
          validTo: priceObservation.validTo
        };
      }
      pricesByProductSourceId.set(priceObservation.productSourceId, prices);
    }

    for (const source of productSources) {
      const values = sourcesByProductId.get(source.productId) ?? [];
      values.push(source.sourceName);
      sourcesByProductId.set(source.productId, values);

      const offers = offerRowsByProductId.get(source.productId) ?? [];
      const prices = pricesByProductSourceId.get(source.id) ?? {};
      const identifiers = identifiersByProductSourceId.get(source.id) ?? [];
      const latestLocation = latestOfferLocation(priceObservations, source.id);
      offers.push({
        currentCategoryLabel: source.currentCategoryLabel,
        identifiers: identifiers.map((identifier) => ({
          kind: identifier.kind,
          value: identifier.value
        })),
        latestObservedAt: latestOfferObservedAt(prices),
        locationKey: latestLocation?.locationKey ?? null,
        locationLabel: latestLocation?.label ?? null,
        prices,
        productSourceId: source.id,
        sourceName: source.sourceName,
        sourceProductKey: source.sourceProductKey,
        sourceProductName: source.sourceProductName,
        storeBrandKey: source.storeBrandKey
      });
      offerRowsByProductId.set(source.productId, offers);
    }

    const householdStockCountByProductId = new Map<string, number>();
    for (const stock of householdStocks) {
      householdStockCountByProductId.set(
        stock.productId,
        (householdStockCountByProductId.get(stock.productId) ?? 0) + 1
      );
    }

    return {
      products: products.map((product) => ({
        brandName: product.brandName,
        householdStockCount: householdStockCountByProductId.get(product.id) ?? 0,
        id: product.id,
        measurements: product.measurements,
        name: product.name,
        offers: (offerRowsByProductId.get(product.id) ?? []).sort(compareOffers),
        primaryCategoryKey: product.primaryCategoryKey,
        sourceNames: [...new Set(sourcesByProductId.get(product.id) ?? [])].sort(),
        tagKeys: [...new Set(tagsByProductId.get(product.id) ?? [])].sort()
      })),
      totalCount
    };
  }

  async listCatalogOfferSourceNames(): Promise<string[]> {
    const sourceNames = await this.productSourcesCollection.distinct("sourceName");

    return sourceNames.sort((left, right) => left.localeCompare(right, "hu-HU"));
  }

  async runSmokeCheck(): Promise<CurrentCatalogSmokeCheckResult> {
    await this.setupCollections();

    const [migrationLedgerCount, priceObservationCount, productSourceIdentifierCount, productSourceCount, productTagAssignmentCount, productTagCount, productCount, processingStateCount, stockCount, sampleProducts] = await Promise.all([
      this.migrationLedgerCollection.countDocuments(),
      this.priceObservationsCollection.countDocuments(),
      this.productSourceIdentifiersCollection.countDocuments(),
      this.productSourcesCollection.countDocuments(),
      this.productTagAssignmentsCollection.countDocuments(),
      this.productTagsCollection.countDocuments(),
      this.productsCollection.countDocuments(),
      this.sourceRecordProcessingStatesCollection.countDocuments(),
      this.stocksCollection.countDocuments(),
      this.productsCollection.find({}, { projection: { name: 1, _id: 0 } }).sort({ name: 1 }).limit(5).toArray()
    ]);

    return {
      collectionCounts: {
        migration_ledger: migrationLedgerCount,
        price_observations: priceObservationCount,
        product_source_identifiers: productSourceIdentifierCount,
        product_sources: productSourceCount,
        product_tag_assignments: productTagAssignmentCount,
        product_tags: productTagCount,
        products: productCount,
        source_record_processing_states: processingStateCount,
        stocks: stockCount
      },
      databaseName: this.database.databaseName,
      sampleProductNames: sampleProducts.map((product) => product.name)
    };
  }

  async setupCollections(): Promise<CurrentCatalogSetupSummary> {
    const existingCollections = new Set(
      (await this.database.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name)
    );
    const createdCollections: string[] = [];
    const existingCatalogCollections: string[] = [];

    for (const [collectionName, schema] of Object.entries(catalogV1CollectionSchemas)) {
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
          existingCatalogCollections.push(collectionName);
        }
      }
    }

    await Promise.all(collectionPlans.map(async (plan) => {
      const collection = this.database.collection(plan.name);
      for (const index of plan.indexes) {
        await collection.createIndex(index.key, index.options);
      }
    }));

    return {
      createdCollections,
      databaseName: this.database.databaseName,
      ensuredCollections: collectionPlans.map((plan) => plan.name),
      existingCollections: existingCatalogCollections,
      skippedValidatorUpdates: existingCatalogCollections
    };
  }

  async upsertCatalogSeedDataset(dataset: CatalogV1SeedDataset): Promise<void> {
    await this.upsertMany(this.migrationLedgerCollection, dataset.migrationLedger);
    await this.upsertMany(this.priceObservationsCollection, dataset.priceObservations);
    await this.upsertMany(this.productSourceIdentifiersCollection, dataset.productSourceIdentifiers);
    await this.upsertMany(this.productSourcesCollection, dataset.productSources);
    await this.upsertMany(this.productTagAssignmentsCollection, dataset.productTagAssignments);
    await this.upsertMany(this.productTagsCollection, dataset.productTags);
    await this.upsertMany(this.productsCollection, dataset.products);
    await this.upsertMany(
      this.sourceRecordProcessingStatesCollection,
      dataset.sourceRecordProcessingStates
    );
    await this.upsertMany(this.stocksCollection, dataset.stocks);
  }

  async findProcessingState(input: {
    processorName: string;
    processorVersion: string;
    recordFingerprint: string;
    sourceName: string;
  }): Promise<SourceRecordProcessingStateRecord | null> {
    return this.sourceRecordProcessingStatesCollection.findOne({
      processorName: input.processorName,
      processorVersion: input.processorVersion,
      recordFingerprint: input.recordFingerprint,
      sourceName: input.sourceName
    });
  }

  private async upsertMany<T extends { id: string }>(
    collection: Collection<T>,
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

function latestOfferObservedAt(
  prices: Partial<Record<PriceObservationKind, CatalogProductOfferPrice>>
): string | null {
  return Object.values(prices)
    .map((price) => price?.observedAt)
    .filter((observedAt): observedAt is string => typeof observedAt === "string")
    .sort()
    .at(-1) ?? null;
}

function latestOfferLocation(
  priceObservations: PriceObservationRecord[],
  productSourceId: string
): PriceObservationRecord["location"] | null {
  return priceObservations.find((observation) => observation.productSourceId === productSourceId)?.location ?? null;
}

function compareOffers(left: CatalogProductOfferListItem, right: CatalogProductOfferListItem): number {
  return left.sourceName.localeCompare(right.sourceName, "hu-HU")
    || left.sourceProductName.localeCompare(right.sourceProductName, "hu-HU");
}
