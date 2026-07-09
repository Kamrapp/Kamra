import type { HouseholdV1CollectionName } from "./contracts.js";

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

const optionalStringSchema: JsonSchema = {
  bsonType: ["null", "string"]
};

const nonEmptyStringSchema: JsonSchema = {
  bsonType: "string",
  minLength: 1
};

const nonNegativeNumberSchema: JsonSchema = {
  bsonType: ["double", "int", "long", "decimal"],
  minimum: 0
};

const householdStatusSchema = {
  enum: ["active", "archived"]
};

const householdMembershipRoleSchema = {
  enum: ["member", "owner"]
};

const householdMembershipStatusSchema = {
  enum: ["active", "removed"]
};

const householdLocalProductStatusSchema = {
  enum: ["active", "archived"]
};

const householdStockItemStatusSchema = {
  enum: ["active", "archived"]
};

export const householdV1CollectionSchemas: Record<HouseholdV1CollectionName, JsonSchema> = {
  households: requiredObjectSchema(
    ["createdAt", "createdByUserId", "id", "name", "status", "updatedAt"],
    {
      createdAt: isoDateStringSchema,
      createdByUserId: nonEmptyStringSchema,
      id: nonEmptyStringSchema,
      name: nonEmptyStringSchema,
      status: householdStatusSchema,
      updatedAt: isoDateStringSchema
    }
  ),
  household_memberships: requiredObjectSchema(
    ["createdAt", "householdId", "id", "role", "status", "updatedAt", "userId"],
    {
      createdAt: isoDateStringSchema,
      householdId: nonEmptyStringSchema,
      id: nonEmptyStringSchema,
      role: householdMembershipRoleSchema,
      status: householdMembershipStatusSchema,
      updatedAt: isoDateStringSchema,
      userId: nonEmptyStringSchema
    }
  ),
  household_local_products: requiredObjectSchema(
    [
      "createdAt",
      "createdByUserId",
      "displayName",
      "householdId",
      "id",
      "stockGroupKey",
      "status",
      "updatedAt",
      "updatedByUserId"
    ],
    {
      catalogProductId: optionalStringSchema,
      catalogProductNameSnapshot: optionalStringSchema,
      createdAt: isoDateStringSchema,
      createdByUserId: nonEmptyStringSchema,
      displayName: nonEmptyStringSchema,
      gtin: optionalStringSchema,
      householdId: nonEmptyStringSchema,
      id: nonEmptyStringSchema,
      sourceName: optionalStringSchema,
      sourceProductUrl: optionalStringSchema,
      stockGroupKey: nonEmptyStringSchema,
      status: householdLocalProductStatusSchema,
      updatedAt: isoDateStringSchema,
      updatedByUserId: nonEmptyStringSchema
    }
  ),
  household_stock_items: requiredObjectSchema(
    [
      "createdAt",
      "createdByUserId",
      "currentAmount",
      "displayName",
      "householdId",
      "householdProductId",
      "id",
      "initialAmount",
      "minLimit",
      "stockedAt",
      "stockGroupKey",
      "status",
      "unit",
      "updatedAt",
      "updatedByUserId"
    ],
    {
      catalogProductId: optionalStringSchema,
      catalogProductNameSnapshot: optionalStringSchema,
      createdAt: isoDateStringSchema,
      createdByUserId: nonEmptyStringSchema,
      currentAmount: nonNegativeNumberSchema,
      displayName: nonEmptyStringSchema,
      gtin: optionalStringSchema,
      householdId: nonEmptyStringSchema,
      householdProductId: nonEmptyStringSchema,
      id: nonEmptyStringSchema,
      initialAmount: nonNegativeNumberSchema,
      minLimit: nonNegativeNumberSchema,
      note: optionalStringSchema,
      sourceName: optionalStringSchema,
      sourceProductUrl: optionalStringSchema,
      stockedAt: isoDateStringSchema,
      stockGroupKey: nonEmptyStringSchema,
      status: householdStockItemStatusSchema,
      unit: nonEmptyStringSchema,
      updatedAt: isoDateStringSchema,
      updatedByUserId: nonEmptyStringSchema
    }
  )
};

export const householdV1SchemaArtifact = {
  artifactName: "household_v1_foundation",
  schemaVersion: "1.0.0",
  schemas: householdV1CollectionSchemas
} as const;
