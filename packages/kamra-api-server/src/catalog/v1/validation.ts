import type {
  MigrationLedgerRecord,
  MoneyAmount,
  PriceObservationRecord,
  ProductMeasurement,
  ProductRecord,
  ProductSourceIdentifierRecord,
  ProductSourceRecord,
  ProductTagAssignmentRecord,
  ProductTagRecord,
  RecordOrigin,
  SourceRecordProcessingStateRecord,
  CatalogV1SeedDataset,
  StockLocationReference,
  StockPrice,
  StockQuantity,
  StockRecord
} from "./contracts.js";
import {
  migrationStatuses,
  priceObservationKinds,
  processingStates,
  productKinds,
  productStatuses,
  recordOriginKinds,
  stockLocationKinds,
  stockStatuses,
  tagAssignmentKinds,
  tagKinds
} from "./contracts.js";

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertOptionalString(value: unknown, label: string): void {
  if (value !== undefined && value !== null && typeof value !== "string") {
    throw new Error(`${label} must be a string when provided.`);
  }
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} must be a number.`);
  }
}

function assertEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string
): asserts value is T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`${label} must be one of: ${allowed.join(", ")}.`);
  }
}

function assertIsoDateString(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label);

  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an ISO-like date string.`);
  }
}

export function assertRecordOrigin(value: unknown, label = "origin"): asserts value is RecordOrigin {
  assertObject(value, label);
  assertIsoDateString(value["capturedAt"], `${label}.capturedAt`);
  assertEnum(value["kind"], recordOriginKinds, `${label}.kind`);
  assertNonEmptyString(value["producer"], `${label}.producer`);
  assertNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertOptionalString(value["sourceRecordId"], `${label}.sourceRecordId`);
  assertOptionalString(value["sourceUrl"], `${label}.sourceUrl`);
}

export function assertProductMeasurement(
  value: unknown,
  label = "measurement"
): asserts value is ProductMeasurement {
  assertObject(value, label);
  assertOptionalString(value["normalizedUnit"], `${label}.normalizedUnit`);
  if (value["normalizedValue"] !== undefined && value["normalizedValue"] !== null) {
    assertNumber(value["normalizedValue"], `${label}.normalizedValue`);
  }
  assertNonEmptyString(value["unit"], `${label}.unit`);
  assertNumber(value["value"], `${label}.value`);
}

export function assertProductRecord(value: unknown, label = "product"): asserts value is ProductRecord {
  assertObject(value, label);
  assertOptionalString(value["brandName"], `${label}.brandName`);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertEnum(value["kind"], productKinds, `${label}.kind`);
  assertArray(value["measurements"], `${label}.measurements`);
  value["measurements"].forEach((item, index) => {
    assertProductMeasurement(item, `${label}.measurements[${index}]`);
  });
  assertNonEmptyString(value["name"], `${label}.name`);
  assertNonEmptyString(value["normalizedName"], `${label}.normalizedName`);
  assertArray(value["origin"], `${label}.origin`);
  value["origin"].forEach((item, index) => {
    assertRecordOrigin(item, `${label}.origin[${index}]`);
  });
  assertOptionalString(value["primaryCategoryKey"], `${label}.primaryCategoryKey`);
  assertEnum(value["status"], productStatuses, `${label}.status`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
}

export function assertSourceProductIdentifier(
  value: unknown,
  label = "sourceProductIdentifier"
): asserts value is ProductSourceIdentifierRecord {
  assertObject(value, label);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertEnum(
    value["kind"],
    ["gtin", "national_code", "retailer_item_number", "retailer_product_id", "unknown"],
    `${label}.kind`
  );
  assertRecordOrigin(value["origin"], `${label}.origin`);
  assertNonEmptyString(value["productSourceId"], `${label}.productSourceId`);
  assertNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
  assertNonEmptyString(value["value"], `${label}.value`);
}

export function assertProductSourceRecord(
  value: unknown,
  label = "productSource"
): asserts value is ProductSourceRecord {
  assertObject(value, label);
  assertNonEmptyString(value["countryCode"], `${label}.countryCode`);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertOptionalString(value["currentCategoryLabel"], `${label}.currentCategoryLabel`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertRecordOrigin(value["origin"], `${label}.origin`);
  assertOptionalString(value["priceLastCheckedAt"], `${label}.priceLastCheckedAt`);
  if (typeof value["priceLastCheckedAt"] === "string") {
    assertIsoDateString(value["priceLastCheckedAt"], `${label}.priceLastCheckedAt`);
  }
  assertNonEmptyString(value["productId"], `${label}.productId`);
  assertNonEmptyString(value["productPageUrl"], `${label}.productPageUrl`);
  assertNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertNonEmptyString(value["sourceProductKey"], `${label}.sourceProductKey`);
  assertNonEmptyString(value["sourceProductName"], `${label}.sourceProductName`);
  assertNonEmptyString(value["storeBrandKey"], `${label}.storeBrandKey`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
}

export function assertProductTagRecord(value: unknown, label = "productTag"): asserts value is ProductTagRecord {
  assertObject(value, label);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertNonEmptyString(value["key"], `${label}.key`);
  assertEnum(value["kind"], tagKinds, `${label}.kind`);
  assertNonEmptyString(value["label"], `${label}.label`);
  assertArray(value["matcherTerms"], `${label}.matcherTerms`);
  value["matcherTerms"].forEach((item, index) => {
    assertNonEmptyString(item, `${label}.matcherTerms[${index}]`);
  });
  assertRecordOrigin(value["origin"], `${label}.origin`);
  assertOptionalString(value["parentKey"], `${label}.parentKey`);
  assertEnum(value["status"], ["active", "archived"], `${label}.status`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
}

export function assertProductTagAssignmentRecord(
  value: unknown,
  label = "productTagAssignment"
): asserts value is ProductTagAssignmentRecord {
  assertObject(value, label);
  assertIsoDateString(value["assignedAt"], `${label}.assignedAt`);
  assertEnum(value["assignmentKind"], tagAssignmentKinds, `${label}.assignmentKind`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertRecordOrigin(value["origin"], `${label}.origin`);
  assertNonEmptyString(value["productId"], `${label}.productId`);
  assertNumber(value["score"], `${label}.score`);
  assertNonEmptyString(value["tagKey"], `${label}.tagKey`);
}

export function assertStockLocationReference(
  value: unknown,
  label = "stockLocation"
): asserts value is StockLocationReference {
  assertObject(value, label);
  assertOptionalString(value["countryCode"], `${label}.countryCode`);
  assertEnum(value["kind"], stockLocationKinds, `${label}.kind`);
  assertNonEmptyString(value["label"], `${label}.label`);
  assertNonEmptyString(value["locationKey"], `${label}.locationKey`);
  assertOptionalString(value["storeBrandKey"], `${label}.storeBrandKey`);
}

export function assertMoneyAmount(value: unknown, label = "money"): asserts value is MoneyAmount {
  assertObject(value, label);
  assertNumber(value["amount"], `${label}.amount`);
  assertNonEmptyString(value["currencyCode"], `${label}.currencyCode`);
}

export function assertStockPrice(value: unknown, label = "stockPrice"): asserts value is StockPrice {
  assertObject(value, label);
  assertIsoDateString(value["observedAt"], `${label}.observedAt`);
  assertMoneyAmount(value["price"], `${label}.price`);
  if (value["unitPrice"] !== undefined && value["unitPrice"] !== null) {
    assertProductMeasurement(value["unitPrice"], `${label}.unitPrice`);
  }
}

export function assertStockQuantity(
  value: unknown,
  label = "stockQuantity"
): asserts value is StockQuantity {
  assertObject(value, label);
  assertNumber(value["amount"], `${label}.amount`);
  if (value["packageCount"] !== undefined && value["packageCount"] !== null) {
    assertNumber(value["packageCount"], `${label}.packageCount`);
  }
  assertNonEmptyString(value["unit"], `${label}.unit`);
}

export function assertStockRecord(value: unknown, label = "stock"): asserts value is StockRecord {
  assertObject(value, label);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertOptionalString(value["expiryDate"], `${label}.expiryDate`);
  if (typeof value["expiryDate"] === "string") {
    assertIsoDateString(value["expiryDate"], `${label}.expiryDate`);
  }
  assertNonEmptyString(value["id"], `${label}.id`);
  assertStockLocationReference(value["location"], `${label}.location`);
  assertRecordOrigin(value["origin"], `${label}.origin`);
  if (value["price"] !== undefined && value["price"] !== null) {
    assertStockPrice(value["price"], `${label}.price`);
  }
  assertNonEmptyString(value["productId"], `${label}.productId`);
  assertStockQuantity(value["quantity"], `${label}.quantity`);
  assertEnum(value["status"], stockStatuses, `${label}.status`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
}

export function assertPriceObservationRecord(
  value: unknown,
  label = "priceObservation"
): asserts value is PriceObservationRecord {
  assertObject(value, label);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertStockLocationReference(value["location"], `${label}.location`);
  assertIsoDateString(value["observedAt"], `${label}.observedAt`);
  assertRecordOrigin(value["origin"], `${label}.origin`);
  assertMoneyAmount(value["price"], `${label}.price`);
  assertEnum(value["priceKind"], priceObservationKinds, `${label}.priceKind`);
  assertNonEmptyString(value["productId"], `${label}.productId`);
  assertNonEmptyString(value["productSourceId"], `${label}.productSourceId`);
  assertOptionalString(value["programName"], `${label}.programName`);
  assertNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertNonEmptyString(value["sourceProductKey"], `${label}.sourceProductKey`);
  assertOptionalString(value["unitPriceLabel"], `${label}.unitPriceLabel`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
  assertOptionalString(value["validFrom"], `${label}.validFrom`);
  if (typeof value["validFrom"] === "string") {
    assertIsoDateString(value["validFrom"], `${label}.validFrom`);
  }
  assertOptionalString(value["validTo"], `${label}.validTo`);
  if (typeof value["validTo"] === "string") {
    assertIsoDateString(value["validTo"], `${label}.validTo`);
  }
}

export function assertSourceRecordProcessingStateRecord(
  value: unknown,
  label = "processingState"
): asserts value is SourceRecordProcessingStateRecord {
  assertObject(value, label);
  assertNumber(value["attemptCount"], `${label}.attemptCount`);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertOptionalString(value["lastErrorCode"], `${label}.lastErrorCode`);
  assertOptionalString(value["lastErrorMessage"], `${label}.lastErrorMessage`);
  assertOptionalString(value["lastProcessedAt"], `${label}.lastProcessedAt`);
  if (typeof value["lastProcessedAt"] === "string") {
    assertIsoDateString(value["lastProcessedAt"], `${label}.lastProcessedAt`);
  }
  assertNonEmptyString(value["processorName"], `${label}.processorName`);
  assertNonEmptyString(value["processorVersion"], `${label}.processorVersion`);
  assertNonEmptyString(value["recordFingerprint"], `${label}.recordFingerprint`);
  assertNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertEnum(value["state"], processingStates, `${label}.state`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
}

export function assertMigrationLedgerRecord(
  value: unknown,
  label = "migrationLedger"
): asserts value is MigrationLedgerRecord {
  assertObject(value, label);
  assertIsoDateString(value["appliedAt"], `${label}.appliedAt`);
  assertOptionalString(value["checksum"], `${label}.checksum`);
  assertNonEmptyString(value["description"], `${label}.description`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertNonEmptyString(value["migrationId"], `${label}.migrationId`);
  assertNonEmptyString(value["runnerName"], `${label}.runnerName`);
  assertNonEmptyString(value["runnerVersion"], `${label}.runnerVersion`);
  assertEnum(value["status"], migrationStatuses, `${label}.status`);
}

export function assertCatalogV1SeedDataset(
  value: unknown,
  label = "CatalogV1SeedDataset"
): asserts value is CatalogV1SeedDataset {
  assertObject(value, label);

  assertArray(value["migrationLedger"], `${label}.migrationLedger`);
  value["migrationLedger"].forEach((item, index) => {
    assertMigrationLedgerRecord(item, `${label}.migrationLedger[${index}]`);
  });

  assertArray(value["priceObservations"], `${label}.priceObservations`);
  value["priceObservations"].forEach((item, index) => {
    assertPriceObservationRecord(item, `${label}.priceObservations[${index}]`);
  });

  assertArray(value["productSourceIdentifiers"], `${label}.productSourceIdentifiers`);
  value["productSourceIdentifiers"].forEach((item, index) => {
    assertSourceProductIdentifier(item, `${label}.productSourceIdentifiers[${index}]`);
  });

  assertArray(value["productSources"], `${label}.productSources`);
  value["productSources"].forEach((item, index) => {
    assertProductSourceRecord(item, `${label}.productSources[${index}]`);
  });

  assertArray(value["productTagAssignments"], `${label}.productTagAssignments`);
  value["productTagAssignments"].forEach((item, index) => {
    assertProductTagAssignmentRecord(item, `${label}.productTagAssignments[${index}]`);
  });

  assertArray(value["productTags"], `${label}.productTags`);
  value["productTags"].forEach((item, index) => {
    assertProductTagRecord(item, `${label}.productTags[${index}]`);
  });

  assertArray(value["products"], `${label}.products`);
  value["products"].forEach((item, index) => {
    assertProductRecord(item, `${label}.products[${index}]`);
  });

  assertArray(value["sourceRecordProcessingStates"], `${label}.sourceRecordProcessingStates`);
  value["sourceRecordProcessingStates"].forEach((item, index) => {
    assertSourceRecordProcessingStateRecord(item, `${label}.sourceRecordProcessingStates[${index}]`);
  });

  assertArray(value["stocks"], `${label}.stocks`);
  value["stocks"].forEach((item, index) => {
    assertStockRecord(item, `${label}.stocks[${index}]`);
  });
}

