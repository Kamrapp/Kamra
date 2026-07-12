export const catalogV1CollectionNames = [
  "migration_ledger",
  "price_observations",
  "product_source_identifiers",
  "product_sources",
  "product_tag_assignments",
  "product_tags",
  "products",
  "source_record_processing_states",
  "stocks"
] as const;

export type CatalogV1CollectionName = (typeof catalogV1CollectionNames)[number];

export const productStatuses = ["active", "archived"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const productValidationStatuses = ["unvalidated", "validated", "invalid"] as const;
export type ProductValidationStatus = (typeof productValidationStatuses)[number];

export const productKinds = ["grocery", "household_supply"] as const;
export type ProductKind = (typeof productKinds)[number];

export const stockLocationKinds = ["global_shop_availability", "household", "shop_site"] as const;
export type StockLocationKind = (typeof stockLocationKinds)[number];

export const stockStatuses = ["active", "inactive"] as const;
export type StockStatus = (typeof stockStatuses)[number];

export const priceObservationKinds = ["base", "coupon", "loyalty_card", "offer", "old"] as const;
export type PriceObservationKind = (typeof priceObservationKinds)[number];

export const tagKinds = ["attribute", "category", "keyword"] as const;
export type TagKind = (typeof tagKinds)[number];

export const tagAssignmentKinds = ["derived_keyword", "manual", "seed"] as const;
export type TagAssignmentKind = (typeof tagAssignmentKinds)[number];

export const recordOriginKinds = ["crawler", "manual", "processor", "seed"] as const;
export type RecordOriginKind = (typeof recordOriginKinds)[number];

export const processingStates = [
  "failed",
  "pending",
  "processed",
  "reset_requested",
  "skipped",
  "stale"
] as const;
export type ProcessingState = (typeof processingStates)[number];

export const migrationStatuses = ["applied", "failed"] as const;
export type MigrationStatus = (typeof migrationStatuses)[number];

export interface RecordOrigin {
  capturedAt: string;
  kind: RecordOriginKind;
  producer: string;
  sourceName: string;
  sourceRecordId?: string | null;
  sourceUrl?: string | null;
}

export interface ProductMeasurement {
  normalizedUnit?: string | null;
  normalizedValue?: number | null;
  unit: string;
  value: number;
}

export interface ProductRecord {
  brandName?: string | null;
  createdAt: string;
  id: string;
  kind: ProductKind;
  measurements: ProductMeasurement[];
  name: string;
  normalizedName: string;
  origin: RecordOrigin[];
  primaryCategoryKey?: string | null;
  validationStatus: ProductValidationStatus;
  validatedAt?: string | null;
  validatedBy?: string | null;
  invalidatedAt?: string | null;
  invalidatedBy?: string | null;
  validationNote?: string | null;
  status: ProductStatus;
  updatedAt: string;
}

export interface ProductSourceRecord {
  countryCode: string;
  createdAt: string;
  currentCategoryLabel?: string | null;
  id: string;
  origin: RecordOrigin;
  priceLastCheckedAt?: string | null;
  productId: string;
  productPageUrl: string;
  sourceName: string;
  sourceProductKey: string;
  sourceProductName: string;
  storeBrandKey: string;
  updatedAt: string;
}

export interface ProductSourceIdentifierRecord {
  createdAt: string;
  id: string;
  kind: "gtin" | "national_code" | "retailer_item_number" | "retailer_product_id" | "unknown";
  origin: RecordOrigin;
  productSourceId: string;
  sourceName: string;
  updatedAt: string;
  value: string;
}

export interface ProductTagRecord {
  createdAt: string;
  id: string;
  key: string;
  kind: TagKind;
  label: string;
  matcherTerms: string[];
  origin: RecordOrigin;
  parentKey?: string | null;
  status: "active" | "archived";
  updatedAt: string;
}

export interface ProductTagAssignmentRecord {
  assignedAt: string;
  assignmentKind: TagAssignmentKind;
  id: string;
  origin: RecordOrigin;
  productId: string;
  score: number;
  tagKey: string;
}

export interface StockLocationReference {
  countryCode?: string | null;
  kind: StockLocationKind;
  label: string;
  locationKey: string;
  storeBrandKey?: string | null;
}

export interface MoneyAmount {
  amount: number;
  currencyCode: string;
}

export interface StockPrice {
  observedAt: string;
  price: MoneyAmount;
  unitPrice?: ProductMeasurement | null;
}

export interface StockQuantity {
  amount: number;
  packageCount?: number | null;
  unit: string;
}

export interface StockRecord {
  createdAt: string;
  expiryDate?: string | null;
  id: string;
  location: StockLocationReference;
  origin: RecordOrigin;
  price?: StockPrice | null;
  productId: string;
  quantity: StockQuantity;
  status: StockStatus;
  updatedAt: string;
}

export interface PriceObservationRecord {
  createdAt: string;
  id: string;
  location: StockLocationReference;
  observedAt: string;
  origin: RecordOrigin;
  price: MoneyAmount;
  priceKind: PriceObservationKind;
  productId: string;
  productSourceId: string;
  programName?: string | null;
  sourceName: string;
  sourceProductKey: string;
  unitPriceLabel?: string | null;
  updatedAt: string;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface SourceRecordProcessingStateRecord {
  attemptCount: number;
  createdAt: string;
  id: string;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  lastProcessedAt?: string | null;
  processorName: string;
  processorVersion: string;
  recordFingerprint: string;
  sourceName: string;
  state: ProcessingState;
  updatedAt: string;
}

export interface MigrationLedgerRecord {
  appliedAt: string;
  checksum?: string | null;
  description: string;
  id: string;
  migrationId: string;
  runnerName: string;
  runnerVersion: string;
  status: MigrationStatus;
}

export interface CatalogV1SeedDataset {
  migrationLedger: MigrationLedgerRecord[];
  priceObservations: PriceObservationRecord[];
  productSourceIdentifiers: ProductSourceIdentifierRecord[];
  productSources: ProductSourceRecord[];
  productTagAssignments: ProductTagAssignmentRecord[];
  productTags: ProductTagRecord[];
  products: ProductRecord[];
  sourceRecordProcessingStates: SourceRecordProcessingStateRecord[];
  stocks: StockRecord[];
}

export interface CatalogProductListItem {
  offers: CatalogProductOfferListItem[];
  brandName?: string | null;
  householdStockCount: number;
  id: string;
  measurements: ProductMeasurement[];
  name: string;
  primaryCategoryKey?: string | null;
  validationStatus: ProductValidationStatus;
  sourceNames: string[];
  tagKeys: string[];
}

export interface CatalogProductOfferPrice {
  amount: number;
  currencyCode: string;
  observedAt: string;
  programName?: string | null;
  unitPriceLabel?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface CatalogProductOfferIdentifier {
  kind: ProductSourceIdentifierRecord["kind"];
  value: string;
}

export interface CatalogProductOfferListItem {
  currentCategoryLabel?: string | null;
  identifiers: CatalogProductOfferIdentifier[];
  latestObservedAt?: string | null;
  locationKey?: string | null;
  locationLabel?: string | null;
  prices: Partial<Record<PriceObservationKind, CatalogProductOfferPrice>>;
  productSourceId: string;
  sourceName: string;
  sourceProductKey: string;
  sourceProductName: string;
  storeBrandKey: string;
}
