import type { IngestionV1CollectionName } from "./contracts.js";

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
      _id: { bsonType: "objectId" },
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

const optionalStringSchema: JsonSchema = {
  bsonType: ["null", "string"]
};

const parsedPriceObservationSchema = requiredObjectSchema(["currencyCode", "observedAt", "price"], {
  currencyCode: { enum: ["HUF"] },
  observedAt: isoDateStringSchema,
  price: { bsonType: ["double", "int", "long", "decimal"] },
  priceKind: { enum: ["base", "coupon", "loyalty_card", "offer", "old"] },
  programName: optionalStringSchema,
  unitPriceLabel: optionalStringSchema,
  validFrom: optionalStringSchema,
  validTo: optionalStringSchema
});

const parsedProductIdentifierSchema = requiredObjectSchema(["kind", "value"], {
  issuer: optionalStringSchema,
  kind: {
    enum: ["gtin", "national_code", "retailer_item_number", "retailer_product_id", "unknown"]
  },
  value: { bsonType: "string" }
});

const productReviewCandidateSchema = requiredObjectSchema(
  [
    "matchConfidence",
    "origin",
    "priceObservations",
    "product",
    "source",
    "sourceProductIdentifiers"
  ],
  {
    matchConfidence: {
      enum: ["name_only", "none", "source_scoped_name", "strong_identifier", "strong_source_key"]
    },
    origin: requiredObjectSchema(["capturedAt", "sourceName", "sourceRecordId"], {
      capturedAt: isoDateStringSchema,
      sourceName: { bsonType: "string" },
      sourceRecordId: { bsonType: "string" },
      sourceUrl: optionalStringSchema
    }),
    priceObservations: {
      bsonType: "array",
      items: parsedPriceObservationSchema
    },
    product: requiredObjectSchema(["kind", "measurements", "name", "normalizedName"], {
      brandName: optionalStringSchema,
      kind: { enum: ["grocery"] },
      measurements: {
        bsonType: "array",
        items: requiredObjectSchema(["unit", "value"], {
          normalizedUnit: optionalStringSchema,
          normalizedValue: { bsonType: ["double", "int", "long", "decimal", "null"] },
          unit: { bsonType: "string" },
          value: { bsonType: ["double", "int", "long", "decimal"] }
        })
      },
      name: { bsonType: "string" },
      normalizedName: { bsonType: "string" },
      primaryCategoryKey: optionalStringSchema
    }),
    source: requiredObjectSchema(
      ["countryCode", "sourceName", "sourceProductKey", "sourceProductName", "storeBrandKey"],
      {
        countryCode: { enum: ["HU"] },
        currentCategoryLabel: optionalStringSchema,
        productPageUrl: optionalStringSchema,
        sourceName: { bsonType: "string" },
        sourceProductKey: { bsonType: "string" },
        sourceProductName: { bsonType: "string" },
        storeBrandKey: { bsonType: "string" }
      }
    ),
    sourceProductIdentifiers: {
      bsonType: "array",
      items: parsedProductIdentifierSchema
    },
    stock: {
      bsonType: ["null", "object"],
      additionalProperties: false,
      properties: {
        _id: { bsonType: "objectId" },
        availability: { enum: ["infinite"] },
        countryCode: { enum: ["HU"] }
      },
      required: ["availability", "countryCode"]
    }
  }
);

export const ingestionV1CollectionSchemas: Record<IngestionV1CollectionName, JsonSchema> = {
  ingestion_product_review_items: requiredObjectSchema(
    [
      "candidate",
      "candidateBuilderName",
      "candidateBuilderVersion",
      "candidateMatch",
      "capturedAt",
      "createdAt",
      "id",
      "rawRowPreview",
      "rowFingerprint",
      "rowIndex",
      "snapshotId",
      "sourceName",
      "sourceRecordId",
      "status",
      "updatedAt"
    ],
    {
      acceptedCatalogProductDeletedAt: optionalStringSchema,
      acceptedCatalogProductId: optionalStringSchema,
      candidate: productReviewCandidateSchema,
      candidateBuilderName: { bsonType: "string" },
      candidateBuilderVersion: { bsonType: "string" },
      candidateMatch: {
        enum: ["name_only", "none", "source_scoped_name", "strong_identifier", "strong_source_key"]
      },
      capturedAt: isoDateStringSchema,
      createdAt: isoDateStringSchema,
      decision: {
        bsonType: ["null", "object"],
        additionalProperties: false,
        properties: {
          _id: { bsonType: "objectId" },
          decidedAt: isoDateStringSchema,
          declineReason: {
            enum: [
              "bad_name",
              "bad_price",
              "duplicate",
              "non_product",
              "online_only",
              "unsupported_layout",
              "other"
            ]
          },
          note: optionalStringSchema,
          reviewerId: { bsonType: "string" },
          reviewerName: { bsonType: "string" },
          state: { enum: ["accepted", "declined"] }
        },
        required: ["decidedAt", "reviewerId", "reviewerName", "state"]
      },
      id: { bsonType: "string" },
      rawRowPreview: {
        bsonType: "object",
        additionalProperties: false,
        properties: {
          _id: { bsonType: "objectId" },
          categoryLabel: optionalStringSchema,
          countryCode: { enum: ["HU"] },
          crawlContext: optionalStringSchema,
          description: optionalStringSchema,
          displayName: { bsonType: "string" },
          packageLabel: optionalStringSchema,
          priceText: optionalStringSchema,
          priceValue: { bsonType: ["double", "int", "long", "decimal", "null"] },
          rawName: optionalStringSchema,
          sourceName: optionalStringSchema,
          sourceProductKey: optionalStringSchema,
          sourceRecordId: optionalStringSchema,
          sourceUrl: optionalStringSchema,
          storeBrandKey: optionalStringSchema,
          unitPriceText: optionalStringSchema,
          validFrom: optionalStringSchema,
          validTo: optionalStringSchema
        },
        required: ["countryCode", "displayName"]
      },
      rowFingerprint: { bsonType: "string" },
      rowIndex: { bsonType: ["int", "long"] },
      snapshotId: { bsonType: "string" },
      sourceName: { bsonType: "string" },
      sourceRecordId: { bsonType: "string" },
      status: { enum: ["accepted", "declined", "failed", "pending", "stale"] },
      updatedAt: isoDateStringSchema
    }
  ),
  ingestion_raw_snapshots: requiredObjectSchema(
    [
      "capturedAt",
      "contentHash",
      "contentType",
      "crawlDate",
      "crawlRunId",
      "id",
      "parserName",
      "parserVersion",
      "payloadText",
      "parsedRows",
      "sourceName",
      "sourceRecordId",
      "workflowName"
    ],
    {
      capturedAt: isoDateStringSchema,
      contentHash: { bsonType: "string" },
      contentType: { bsonType: "string" },
      crawlDate: { bsonType: "string" },
      crawlRunId: { bsonType: "string" },
      id: { bsonType: "string" },
      parserName: { bsonType: "string" },
      parserVersion: { bsonType: "string" },
      parsedRows: { bsonType: "array", items: { bsonType: "object" } },
      payloadText: { bsonType: "string" },
      sourceName: { bsonType: "string" },
      sourceRecordId: { bsonType: "string" },
      sourceUrl: optionalStringSchema,
      workflowName: { bsonType: "string" }
    }
  ),
  ingestion_runs: requiredObjectSchema(
    [
      "crawlDate",
      "crawlRunId",
      "createdAt",
      "failedCount",
      "id",
      "insertedSnapshotCount",
      "skippedSnapshotCount",
      "startedAt",
      "status",
      "updatedAt",
      "sourceName",
      "workflowName"
    ],
    {
      completedAt: optionalStringSchema,
      createdAt: isoDateStringSchema,
      crawlDate: { bsonType: "string" },
      crawlRunId: { bsonType: "string" },
      failedCount: { bsonType: ["int", "long"] },
      id: { bsonType: "string" },
      insertedSnapshotCount: { bsonType: ["int", "long"] },
      skippedSnapshotCount: { bsonType: ["int", "long"] },
      startedAt: isoDateStringSchema,
      status: { enum: ["completed", "failed", "partial", "running"] },
      updatedAt: isoDateStringSchema,
      sourceName: { bsonType: "string" },
      workflowName: { bsonType: "string" }
    }
  )
};
