import type { CatalogV1CollectionName } from "./contracts.js";

type JsonSchema = Record<string, unknown>;

function requiredObjectSchema(
  required: string[],
  properties: Record<string, JsonSchema>,
  extra: Record<string, unknown> = {}
): JsonSchema {
  return {
    additionalProperties: false,
    bsonType: "object",
    properties: {
      _id: {
        bsonType: "objectId"
      },
      ...properties
    },
    required,
    ...extra
  };
}

const isoDateStringSchema: JsonSchema = {
  bsonType: "string",
  description: "ISO date string"
};

const optionalStringSchema = {
  bsonType: ["null", "string"]
};

const recordOriginSchema = requiredObjectSchema(
  ["capturedAt", "kind", "producer", "sourceName"],
  {
    capturedAt: isoDateStringSchema,
    kind: {
      enum: ["crawler", "manual", "processor", "seed"]
    },
    producer: {
      bsonType: "string"
    },
    sourceName: {
      bsonType: "string"
    },
    sourceRecordId: optionalStringSchema,
    sourceUrl: optionalStringSchema
  }
);

const productMeasurementSchema = requiredObjectSchema(
  ["unit", "value"],
  {
    normalizedUnit: optionalStringSchema,
    normalizedValue: {
      bsonType: ["double", "int", "long", "decimal", "null"]
    },
    unit: {
      bsonType: "string"
    },
    value: {
      bsonType: ["double", "int", "long", "decimal"]
    }
  }
);

const productMeasurementProperties = productMeasurementSchema["properties"] as Record<string, unknown>;

const moneyAmountSchema = requiredObjectSchema(
  ["amount", "currencyCode"],
  {
    amount: { bsonType: ["double", "int", "long", "decimal"] },
    currencyCode: { bsonType: "string" }
  }
);

const stockLocationReferenceSchema = requiredObjectSchema(
  ["kind", "label", "locationKey"],
  {
    countryCode: optionalStringSchema,
    kind: { enum: ["global_shop_availability", "household", "shop_site"] },
    label: { bsonType: "string" },
    locationKey: { bsonType: "string" },
    storeBrandKey: optionalStringSchema
  }
);

const sourceProductIdentifierSchema = requiredObjectSchema(
  ["createdAt", "id", "kind", "origin", "productSourceId", "sourceName", "updatedAt", "value"],
  {
    createdAt: isoDateStringSchema,
    id: { bsonType: "string" },
    kind: {
      enum: ["gtin", "national_code", "retailer_item_number", "retailer_product_id", "unknown"]
    },
    origin: recordOriginSchema,
    productSourceId: { bsonType: "string" },
    sourceName: { bsonType: "string" },
    updatedAt: isoDateStringSchema,
    value: { bsonType: "string" }
  }
);

const productValidationStatusSchema = {
  enum: ["unvalidated", "validated", "invalid"]
};

export const catalogV1CollectionSchemas: Record<CatalogV1CollectionName, JsonSchema> = {
  migration_ledger: requiredObjectSchema(
    ["appliedAt", "description", "id", "migrationId", "runnerName", "runnerVersion", "status"],
    {
      appliedAt: isoDateStringSchema,
      checksum: optionalStringSchema,
      description: { bsonType: "string" },
      id: { bsonType: "string" },
      migrationId: { bsonType: "string" },
      runnerName: { bsonType: "string" },
      runnerVersion: { bsonType: "string" },
      status: { enum: ["applied", "failed"] }
    }
  ),
  price_observations: requiredObjectSchema(
    [
      "createdAt",
      "id",
      "location",
      "observedAt",
      "origin",
      "price",
      "priceKind",
      "productId",
      "productSourceId",
      "sourceName",
      "sourceProductKey",
      "updatedAt"
    ],
    {
      createdAt: isoDateStringSchema,
      id: { bsonType: "string" },
      location: stockLocationReferenceSchema,
      observedAt: isoDateStringSchema,
      origin: recordOriginSchema,
      price: moneyAmountSchema,
      priceKind: { enum: ["base", "coupon", "loyalty_card", "offer", "old"] },
      productId: { bsonType: "string" },
      productSourceId: { bsonType: "string" },
      programName: optionalStringSchema,
      sourceName: { bsonType: "string" },
      sourceProductKey: { bsonType: "string" },
      unitPriceLabel: optionalStringSchema,
      updatedAt: isoDateStringSchema,
      validFrom: optionalStringSchema,
      validTo: optionalStringSchema
    }
  ),
  product_source_identifiers: requiredObjectSchema(
    sourceProductIdentifierSchema["required"] as string[],
    sourceProductIdentifierSchema["properties"] as Record<string, JsonSchema>
  ),
  product_sources: requiredObjectSchema(
    [
      "countryCode",
      "createdAt",
      "id",
      "origin",
      "productId",
      "productPageUrl",
      "sourceName",
      "sourceProductKey",
      "sourceProductName",
      "storeBrandKey",
      "updatedAt"
    ],
    {
      countryCode: { bsonType: "string" },
      createdAt: isoDateStringSchema,
      currentCategoryLabel: optionalStringSchema,
      id: { bsonType: "string" },
      origin: recordOriginSchema,
      priceLastCheckedAt: optionalStringSchema,
      productId: { bsonType: "string" },
      productPageUrl: { bsonType: "string" },
      sourceName: { bsonType: "string" },
      sourceProductKey: { bsonType: "string" },
      sourceProductName: { bsonType: "string" },
      storeBrandKey: { bsonType: "string" },
      updatedAt: isoDateStringSchema
    }
  ),
  product_tag_assignments: requiredObjectSchema(
    ["assignedAt", "assignmentKind", "id", "origin", "productId", "score", "tagKey"],
    {
      assignedAt: isoDateStringSchema,
      assignmentKind: { enum: ["derived_keyword", "manual", "seed"] },
      id: { bsonType: "string" },
      origin: recordOriginSchema,
      productId: { bsonType: "string" },
      score: { bsonType: ["double", "int", "long", "decimal"] },
      tagKey: { bsonType: "string" }
    }
  ),
  product_tags: requiredObjectSchema(
    ["createdAt", "id", "key", "kind", "label", "matcherTerms", "origin", "status", "updatedAt"],
    {
      createdAt: isoDateStringSchema,
      id: { bsonType: "string" },
      key: { bsonType: "string" },
      kind: { enum: ["attribute", "category", "keyword"] },
      label: { bsonType: "string" },
      matcherTerms: {
        bsonType: "array",
        items: { bsonType: "string" }
      },
      origin: recordOriginSchema,
      parentKey: optionalStringSchema,
      status: { enum: ["active", "archived"] },
      updatedAt: isoDateStringSchema
    }
  ),
  products: requiredObjectSchema(
    [
      "createdAt",
      "id",
      "kind",
      "measurements",
      "name",
      "normalizedName",
      "origin",
      "status",
      "updatedAt",
      "validationStatus"
    ],
    {
      brandName: optionalStringSchema,
      createdAt: isoDateStringSchema,
      id: { bsonType: "string" },
      kind: { enum: ["grocery", "household_supply"] },
      measurements: {
        bsonType: "array",
        items: productMeasurementSchema
      },
      name: { bsonType: "string" },
      normalizedName: { bsonType: "string" },
      origin: {
        bsonType: "array",
        items: recordOriginSchema,
        minItems: 1
      },
      primaryCategoryKey: optionalStringSchema,
      validatedAt: optionalStringSchema,
      validatedBy: optionalStringSchema,
      invalidatedAt: optionalStringSchema,
      invalidatedBy: optionalStringSchema,
      validationNote: optionalStringSchema,
      validationStatus: productValidationStatusSchema,
      status: { enum: ["active", "archived"] },
      updatedAt: isoDateStringSchema
    }
  ),
  source_record_processing_states: requiredObjectSchema(
    [
      "attemptCount",
      "createdAt",
      "id",
      "processorName",
      "processorVersion",
      "recordFingerprint",
      "sourceName",
      "state",
      "updatedAt"
    ],
    {
      attemptCount: { bsonType: ["int", "long"] },
      createdAt: isoDateStringSchema,
      id: { bsonType: "string" },
      lastErrorCode: optionalStringSchema,
      lastErrorMessage: optionalStringSchema,
      lastProcessedAt: optionalStringSchema,
      processorName: { bsonType: "string" },
      processorVersion: { bsonType: "string" },
      recordFingerprint: { bsonType: "string" },
      sourceName: { bsonType: "string" },
      state: {
        enum: ["failed", "pending", "processed", "reset_requested", "skipped", "stale"]
      },
      updatedAt: isoDateStringSchema
    }
  ),
  stocks: requiredObjectSchema(
    ["createdAt", "id", "location", "origin", "productId", "quantity", "status", "updatedAt"],
    {
      createdAt: isoDateStringSchema,
      expiryDate: optionalStringSchema,
      id: { bsonType: "string" },
      location: stockLocationReferenceSchema,
      origin: recordOriginSchema,
      price: {
        bsonType: ["null", "object"],
        additionalProperties: false,
        properties: {
          observedAt: isoDateStringSchema,
          price: requiredObjectSchema(
            ["amount", "currencyCode"],
            {
              amount: { bsonType: ["double", "int", "long", "decimal"] },
              currencyCode: { bsonType: "string" }
            }
          ),
          unitPrice: {
            bsonType: ["null", "object"],
            additionalProperties: false,
            properties: productMeasurementProperties,
            required: ["unit", "value"]
          }
        },
        required: ["observedAt", "price"]
      },
      productId: { bsonType: "string" },
      quantity: requiredObjectSchema(
        ["amount", "unit"],
        {
          amount: { bsonType: ["double", "int", "long", "decimal"] },
          packageCount: {
            bsonType: ["double", "int", "long", "decimal", "null"]
          },
          unit: { bsonType: "string" }
        }
      ),
      status: { enum: ["active", "inactive"] },
      updatedAt: isoDateStringSchema
    }
  )
};

export const catalogV1SchemaArtifact = {
  artifactName: "catalog_v1_foundation",
  schemaVersion: "1.0.0",
  schemas: catalogV1CollectionSchemas
} as const;
