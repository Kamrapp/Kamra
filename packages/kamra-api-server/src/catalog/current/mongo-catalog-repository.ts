import type { AnyBulkWriteOperation, Document, Filter } from "mongodb";
import type { MongoCollectionLike, MongoDatabaseLike } from "../../db/mongo-like.js";
import { writeServerLog } from "../../logging/kamra-logger.js";

import type {
  CatalogProductListItem,
  CatalogProductOfferListItem,
  CatalogProductOfferPrice,
  MigrationLedgerRecord,
  PriceObservationRecord,
  PriceObservationKind,
  ProductRecord,
  ProductValidationStatus,
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

export interface MarkLegacyProductsUnvalidatedResult {
  skippedCount: number;
  status: "updated" | "validator_incompatible";
  updatedCount: number;
}

export interface CatalogValidatorUpgradeResult {
  createdCollections: string[];
  databaseName: string;
  upgradedCollections: string[];
}

export interface UpdateCatalogProductInput {
  brandName?: string | null;
  id: string;
  measurements?: ProductRecord["measurements"];
  name?: string;
  primaryCategoryKey?: string | null;
  updatedAt: string;
  validationNote?: string | null;
}

export interface SetCatalogProductValidationInput {
  id: string;
  note?: string | null;
  reviewedAt: string;
  reviewerId: string;
  status: Exclude<ProductValidationStatus, "unvalidated">;
}

export interface DeleteCatalogProductResult {
  deletedIdentifierCount: number;
  deletedPriceObservationCount: number;
  deletedProductCount: number;
  deletedProductSourceCount: number;
  deletedStockCount: number;
  deletedTagAssignmentCount: number;
}

export interface CreateCatalogProductFromReviewCandidateInput {
  candidate: {
    origin: {
      capturedAt: string;
      sourceName: string;
      sourceRecordId: string;
      sourceUrl?: string | null;
    };
    priceObservations: Array<{
      currencyCode: string;
      observedAt: string;
      price: number;
      priceKind?: PriceObservationKind | null;
      programName?: string | null;
      unitPriceLabel?: string | null;
      validFrom?: string | null;
      validTo?: string | null;
    }>;
    product: {
      brandName?: string | null;
      kind: ProductRecord["kind"];
      measurements: ProductRecord["measurements"];
      name: string;
      normalizedName: string;
      primaryCategoryKey?: string | null;
    };
    source: {
      countryCode: string;
      currentCategoryLabel?: string | null;
      productPageUrl?: string | null;
      sourceName: string;
      sourceProductKey: string;
      sourceProductName: string;
      storeBrandKey: string;
    };
    sourceProductIdentifiers: Array<{
      kind: ProductSourceIdentifierRecord["kind"];
      value: string;
    }>;
    stock?: {
      availability: "infinite";
      countryCode: string;
    } | null;
  };
  createdAt: string;
  reviewerId: string;
}

export interface CreateCatalogProductFromReviewCandidateResult {
  productId: string;
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
        key: { validationStatus: 1, status: 1 },
        options: { name: "products_validation_status" }
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
  private readonly migrationLedgerCollection: MongoCollectionLike<MigrationLedgerRecord>;
  private readonly priceObservationsCollection: MongoCollectionLike<PriceObservationRecord>;
  private readonly productSourceIdentifiersCollection: MongoCollectionLike<ProductSourceIdentifierRecord>;
  private readonly productSourcesCollection: MongoCollectionLike<ProductSourceRecord>;
  private readonly productTagAssignmentsCollection: MongoCollectionLike<ProductTagAssignmentRecord>;
  private readonly productTagsCollection: MongoCollectionLike<ProductTagRecord>;
  private readonly productsCollection: MongoCollectionLike<ProductRecord>;
  private readonly sourceRecordProcessingStatesCollection: MongoCollectionLike<SourceRecordProcessingStateRecord>;
  private readonly stocksCollection: MongoCollectionLike<StockRecord>;

  constructor(private readonly database: MongoDatabaseLike) {
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
      const productIdsForSources = (await this.productSourcesCollection.distinct("productId", {
        sourceName: { $in: requestedSourceNames }
      })) as string[];
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

    return {
      products: await this.hydrateCatalogProducts(products),
      totalCount
    };
  }

  async findCatalogProductForReview(id: string): Promise<CatalogProductListItem | null> {
    const product = await this.productsCollection.findOne({
      id,
      status: "active"
    });

    if (!product) {
      return null;
    }

    return (await this.hydrateCatalogProducts([product]))[0] ?? null;
  }

  async updateCatalogProduct(input: UpdateCatalogProductInput): Promise<CatalogProductListItem | null> {
    const set: Partial<ProductRecord> = {
      updatedAt: input.updatedAt
    };

    if ("brandName" in input) {
      set.brandName = input.brandName ?? null;
    }

    if ("measurements" in input) {
      set.measurements = input.measurements ?? [];
    }

    if ("name" in input && input.name) {
      set.name = input.name;
      set.normalizedName = normalizeProductName(input.name);
      set.validationStatus = "unvalidated";
      set.validatedAt = null;
      set.validatedBy = null;
    }

    if ("primaryCategoryKey" in input) {
      set.primaryCategoryKey = input.primaryCategoryKey ?? null;
    }

    if ("validationNote" in input) {
      set.validationNote = input.validationNote ?? null;
    }

    try {
      const result = await this.productsCollection.updateOne(
        {
          id: input.id,
          status: "active"
        },
        {
          $set: set
        }
      );

      if (result.matchedCount === 0) {
        return null;
      }

      return await this.findCatalogProductForReview(input.id);
    } catch (error: unknown) {
      if (isDocumentValidationError(error)) {
        writeServerLog("error", "Catalog product update validation failed", {
          input,
          validationError: summarizeMongoValidationError(error)
        });
      }

      throw error;
    }
  }

  async setCatalogProductValidationStatus(input: SetCatalogProductValidationInput): Promise<CatalogProductListItem | null> {
    const validationFields: Partial<ProductRecord> = input.status === "validated"
      ? {
          invalidatedAt: null,
          invalidatedBy: null,
          validatedAt: input.reviewedAt,
          validatedBy: input.reviewerId
        }
      : {
          invalidatedAt: input.reviewedAt,
          invalidatedBy: input.reviewerId,
          validatedAt: null,
          validatedBy: null
        };

    try {
      const result = await this.productsCollection.updateOne(
        {
          id: input.id,
          status: "active"
        },
        {
          $set: {
            ...validationFields,
            updatedAt: input.reviewedAt,
            validationNote: input.note ?? null,
            validationStatus: input.status
          }
        }
      );

      if (result.matchedCount === 0) {
        return null;
      }

      return await this.findCatalogProductForReview(input.id);
    } catch (error: unknown) {
      if (isDocumentValidationError(error)) {
        writeServerLog("error", "Catalog product validation state change failed", {
          input,
          validationError: summarizeMongoValidationError(error)
        });
      }

      throw error;
    }
  }

  async deleteCatalogProduct(id: string): Promise<DeleteCatalogProductResult> {
    const productSources = await this.productSourcesCollection.find({ productId: id }).toArray();
    const productSourceIds = productSources.map((source) => source.id);

    const [
      identifiers,
      priceObservations,
      productSourcesResult,
      stocks,
      tagAssignments,
      products
    ] = await Promise.all([
      this.productSourceIdentifiersCollection.deleteMany({ productSourceId: { $in: productSourceIds } }),
      this.priceObservationsCollection.deleteMany({
        $or: [
          { productId: id },
          { productSourceId: { $in: productSourceIds } }
        ]
      }),
      this.productSourcesCollection.deleteMany({ productId: id }),
      this.stocksCollection.deleteMany({ productId: id }),
      this.productTagAssignmentsCollection.deleteMany({ productId: id }),
      this.productsCollection.deleteMany({ id })
    ]);

    return {
      deletedIdentifierCount: identifiers.deletedCount ?? 0,
      deletedPriceObservationCount: priceObservations.deletedCount ?? 0,
      deletedProductCount: products.deletedCount ?? 0,
      deletedProductSourceCount: productSourcesResult.deletedCount ?? 0,
      deletedStockCount: stocks.deletedCount ?? 0,
      deletedTagAssignmentCount: tagAssignments.deletedCount ?? 0
    };
  }

  async createCatalogProductFromReviewCandidate(
    input: CreateCatalogProductFromReviewCandidateInput
  ): Promise<CreateCatalogProductFromReviewCandidateResult> {
    const candidate = input.candidate;
    const productId = createProductIdFromReviewCandidate(candidate);
    const productSourceId = createProductSourceId(candidate.source.sourceName, candidate.source.sourceProductKey);
    const origin = {
      capturedAt: candidate.origin.capturedAt,
      kind: "manual" as const,
      producer: input.reviewerId,
      sourceName: candidate.source.sourceName,
      sourceRecordId: candidate.origin.sourceRecordId,
      sourceUrl: candidate.origin.sourceUrl ?? null
    };
    const location = createReviewLocation(candidate.source.sourceName, candidate.source.storeBrandKey, candidate.source.countryCode);
    const priceObservations = candidate.priceObservations.map((observation, observationIndex) => ({
      createdAt: input.createdAt,
      id: createReviewPriceObservationId(candidate, observationIndex, observation),
      location,
      observedAt: observation.observedAt,
      origin,
      price: {
        amount: observation.price,
        currencyCode: observation.currencyCode
      },
      priceKind: observation.priceKind ?? "offer",
      productId,
      productSourceId,
      programName: observation.programName ?? null,
      sourceName: candidate.source.sourceName,
      sourceProductKey: candidate.source.sourceProductKey,
      unitPriceLabel: observation.unitPriceLabel ?? null,
      updatedAt: input.createdAt,
      validFrom: observation.validFrom ?? null,
      validTo: observation.validTo ?? null
    }));

    const product: ProductRecord = {
      brandName: candidate.product.brandName ?? null,
      createdAt: input.createdAt,
      id: productId,
      kind: candidate.product.kind,
      measurements: candidate.product.measurements,
      name: candidate.product.name,
      normalizedName: candidate.product.normalizedName,
      origin: [origin],
      primaryCategoryKey: candidate.product.primaryCategoryKey ?? null,
      validationStatus: "validated",
      validatedAt: input.createdAt,
      validatedBy: input.reviewerId,
      invalidatedAt: null,
      invalidatedBy: null,
      validationNote: null,
      status: "active",
      updatedAt: input.createdAt
    };
    const productSource: ProductSourceRecord = {
      countryCode: candidate.source.countryCode,
      createdAt: input.createdAt,
      currentCategoryLabel: candidate.source.currentCategoryLabel ?? null,
      id: productSourceId,
      origin,
      priceLastCheckedAt: priceObservations.at(-1)?.observedAt ?? candidate.origin.capturedAt,
      productId,
      productPageUrl: candidate.source.productPageUrl ?? candidate.origin.sourceUrl ?? `urn:kamra:review:${candidate.source.sourceName}`,
      sourceName: candidate.source.sourceName,
      sourceProductKey: candidate.source.sourceProductKey,
      sourceProductName: candidate.source.sourceProductName,
      storeBrandKey: candidate.source.storeBrandKey,
      updatedAt: input.createdAt
    };
    const sourceIdentifiers: ProductSourceIdentifierRecord[] = candidate.sourceProductIdentifiers.map((identifier) => ({
      createdAt: input.createdAt,
      id: `product_source_identifier_${stableSlug(candidate.source.sourceName)}_${stableSlug(productSourceId)}_${stableSlug(identifier.kind)}_${stableSlug(identifier.value)}`,
      kind: identifier.kind,
      origin,
      productSourceId,
      sourceName: candidate.source.sourceName,
      updatedAt: input.createdAt,
      value: identifier.value
    }));
    const stock: StockRecord = {
      createdAt: input.createdAt,
      id: createStockId(candidate.source.sourceName, candidate.source.sourceProductKey),
      location,
      origin,
      price: null,
      productId,
      quantity: {
        amount: 1,
        packageCount: null,
        unit: "availability"
      },
      status: "active",
      updatedAt: input.createdAt
    };

    try {
      await Promise.all([
        this.productsCollection.updateOne({ id: productId }, { $set: product }, { upsert: true }),
        this.productSourcesCollection.updateOne({ id: productSourceId }, { $set: productSource }, { upsert: true }),
        this.productSourceIdentifiersCollection.deleteMany({ productSourceId }),
        this.priceObservationsCollection.deleteMany({ productSourceId }),
        this.stocksCollection.updateOne({ id: stock.id }, { $set: stock }, { upsert: true })
      ]);

      if (sourceIdentifiers.length > 0) {
        await this.upsertMany(this.productSourceIdentifiersCollection, sourceIdentifiers);
      }
      if (priceObservations.length > 0) {
        await this.upsertMany(this.priceObservationsCollection, priceObservations);
      }

      return { productId };
    } catch (error: unknown) {
      if (isDocumentValidationError(error)) {
        writeServerLog("error", "Catalog product creation from review candidate failed", {
          candidate,
          validationError: summarizeMongoValidationError(error)
        });
      }

      throw error;
    }
  }

  private async hydrateCatalogProducts(products: ProductRecord[]): Promise<CatalogProductListItem[]> {
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

    return products.map((product) => ({
        brandName: product.brandName,
        householdStockCount: householdStockCountByProductId.get(product.id) ?? 0,
        id: product.id,
        measurements: product.measurements,
        name: product.name,
        offers: (offerRowsByProductId.get(product.id) ?? []).sort(compareOffers),
        primaryCategoryKey: product.primaryCategoryKey,
        validationStatus: product.validationStatus ?? "unvalidated",
        sourceNames: [...new Set(sourcesByProductId.get(product.id) ?? [])].sort(),
        tagKeys: [...new Set(tagsByProductId.get(product.id) ?? [])].sort()
      }));
  }

  async listCatalogOfferSourceNames(): Promise<string[]> {
    const sourceNames = (await this.productSourcesCollection.distinct("sourceName")) as string[];

    return sourceNames.sort((left, right) => left.localeCompare(right, "hu-HU"));
  }

  async markLegacyProductsUnvalidated(): Promise<MarkLegacyProductsUnvalidatedResult> {
    const legacyProductFilter: Filter<ProductRecord> = {
      validationStatus: { $exists: false }
    };

    try {
      const result = await this.productsCollection.updateMany(
        legacyProductFilter,
        {
          $set: {
            invalidatedAt: null,
            invalidatedBy: null,
            validationNote: null,
            validationStatus: "unvalidated",
            validatedAt: null,
            validatedBy: null
          }
        }
      );

      return {
        skippedCount: 0,
        status: "updated",
        updatedCount: result.modifiedCount ?? 0
      };
    } catch (error: unknown) {
      if (!isDocumentValidationError(error)) {
        throw error;
      }

      return {
        skippedCount: await this.productsCollection.countDocuments(legacyProductFilter),
        status: "validator_incompatible",
        updatedCount: 0
      };
    }
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

  async upgradeCatalogValidators(): Promise<CatalogValidatorUpgradeResult> {
    const existingCollections = new Set(
      (await this.database.listCollections({}, { nameOnly: true }).toArray()).map((entry) => entry.name)
    );
    const createdCollections: string[] = [];
    const upgradedCollections: string[] = [];

    for (const [collectionName, schema] of Object.entries(catalogV1CollectionSchemas)) {
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

function isDocumentValidationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown };
  return candidate.code === 121;
}

function normalizeProductName(name: string): string {
  return name.trim().toLocaleLowerCase("hu-HU").replace(/\s+/g, " ");
}

function summarizeMongoValidationError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as {
    errInfo?: {
      details?: unknown;
      failingDocumentId?: unknown;
    };
    message?: unknown;
  };

  return {
    details: candidate.errInfo?.details ?? null,
    failingDocumentId: candidate.errInfo?.failingDocumentId ?? null,
    message: typeof candidate.message === "string" ? candidate.message : "unknown"
  };
}

function createProductIdFromReviewCandidate(candidate: {
  priceObservations: Array<unknown>;
  product: {
    measurements: ProductRecord["measurements"];
    name: string;
    normalizedName: string;
  };
  sourceProductIdentifiers: Array<{
    kind: ProductSourceIdentifierRecord["kind"];
    value: string;
  }>;
}): string {
  const commonIdentifier = candidate.sourceProductIdentifiers.find((identifier) =>
    identifier.kind === "gtin" || identifier.kind === "national_code"
  );

  if (commonIdentifier) {
    return `product_${commonIdentifier.kind}_${stableSlug(commonIdentifier.value)}`;
  }

  const packageIdentity = candidate.product.measurements
    .map((measurement) => `${measurement.value}${measurement.unit}`)
    .join("_")
    .trim();
  const identity = packageIdentity
    ? `${candidate.product.normalizedName} ${packageIdentity}`
    : candidate.product.normalizedName || normalizeProductName(candidate.product.name);

  return `product_name_${stableSlug(identity)}`;
}

function createReviewLocation(sourceName: string, storeBrandKey: string, countryCode: string): StockRecord["location"] {
  return {
    countryCode,
    kind: "global_shop_availability",
    label: sourceName,
    locationKey: `availability:${stableSlug(storeBrandKey || sourceName)}`,
    storeBrandKey
  };
}

function createProductSourceId(sourceName: string, sourceProductKey: string): string {
  return `product_source_${stableSlug(sourceName)}_${stableSlug(sourceProductKey)}`;
}

function createReviewPriceObservationId(
  candidate: {
    source: { sourceName: string; sourceProductKey: string };
  },
  observationIndex: number,
  observation: { observedAt: string; price: number; priceKind?: PriceObservationKind | null; validFrom?: string | null; validTo?: string | null }
): string {
  return `price_observation_${stableSlug(candidate.source.sourceName)}_${stableSlug(candidate.source.sourceProductKey)}_${stableSlug(observation.priceKind ?? "offer")}_${stableSlug(observation.observedAt)}_${stableSlug(String(observation.price))}_${stableSlug(observation.validFrom ?? "open")}_${stableSlug(observation.validTo ?? "open")}_${observationIndex}`;
}

function createStockId(sourceName: string, sourceProductKey: string): string {
  return `stock_${stableSlug(sourceName)}_${stableSlug(sourceProductKey)}`;
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
