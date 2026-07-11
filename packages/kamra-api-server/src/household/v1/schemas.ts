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

const optionalNonNegativeNumberSchema: JsonSchema = {
  bsonType: ["null", "double", "int", "long", "decimal"],
  minimum: 0
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

const householdFeatureFlagKeySchema = {
  enum: ["allowAutoTickingAllShoppingListEntries", "allowControlledAlphaAccess"]
};

const householdShoppingListStatusSchema = {
  enum: ["active", "completed", "archived"]
};

const householdShoppingScaleSchema = {
  enum: ["business_as_usual", "keep_it_chill", "stock_em_up", "start_fresh"]
};

const householdShoppingListLineSourceKindSchema = {
  enum: ["generated", "manual"]
};

const householdShoppingListStockApplicationStatusSchema = {
  enum: ["not_applied", "applied"]
};

const householdShoppingListUncertaintyFlagsSchema = {
  bsonType: "array",
  items: {
    enum: ["missing_catalog_product", "missing_product_source"]
  }
};

const householdShopStatusSchema = {
  enum: ["active", "archived"]
};

const observedPriceSchema: JsonSchema = requiredObjectSchema(
  ["amount", "currencyCode", "observedAt"],
  {
    amount: nonNegativeNumberSchema,
    currencyCode: nonEmptyStringSchema,
    observedAt: isoDateStringSchema
  }
);

const shoppingListLineSchema: JsonSchema = requiredObjectSchema(
  [
    "displayName",
    "id",
    "plannedAmount",
    "purchasedAmount",
    "sourceKind",
    "status",
    "suggestedBuyAmount",
    "targetAmount",
    "ticked",
    "uncertaintyFlags",
    "unit"
  ],
  {
    catalogProductId: optionalStringSchema,
    catalogProductNameSnapshot: optionalStringSchema,
    currentAmount: optionalNonNegativeNumberSchema,
    displayName: nonEmptyStringSchema,
    gtin: optionalStringSchema,
    householdProductId: optionalStringSchema,
    householdStockItemId: optionalStringSchema,
    id: nonEmptyStringSchema,
    idealMaxLimit: optionalNonNegativeNumberSchema,
    minLimit: optionalNonNegativeNumberSchema,
    observedPrice: {
      bsonType: ["null", "object"],
      properties: observedPriceSchema["properties"]
    },
    plannedAmount: nonNegativeNumberSchema,
    productSourceId: optionalStringSchema,
    purchasedAmount: nonNegativeNumberSchema,
    reasonCode: {
      bsonType: ["null", "string"],
      enum: ["below_minimum", "at_minimum", "low_soon", "broad_restock", null]
    },
    sourceKind: householdShoppingListLineSourceKindSchema,
    sourceName: optionalStringSchema,
    sourceProductUrl: optionalStringSchema,
    status: householdShoppingListStockApplicationStatusSchema,
    stockGroupKey: optionalStringSchema,
    stockStatus: {
      bsonType: ["null", "string"],
      enum: ["below_limit", "at_limit", "low_soon", "steady", null]
    },
    suggestedBuyAmount: nonNegativeNumberSchema,
    targetAmount: nonNegativeNumberSchema,
    ticked: {
      bsonType: "bool"
    },
    uncertaintyFlags: householdShoppingListUncertaintyFlagsSchema,
    unit: nonEmptyStringSchema
  }
);

export const householdV1CollectionSchemas: Record<HouseholdV1CollectionName, JsonSchema> = {
  households: requiredObjectSchema(
    ["createdAt", "createdByUserId", "id", "name", "status", "updatedAt"],
    {
      createdAt: isoDateStringSchema,
      createdByUserId: nonEmptyStringSchema,
      allowExpiredItems: {
        bsonType: "bool"
      },
      defaultCalculatedMaxLimitMultiplier: optionalNonNegativeNumberSchema,
      favouriteShopId: optionalStringSchema,
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
  household_feature_flags: requiredObjectSchema(
    ["createdAt", "enabled", "id", "key", "updatedAt", "updatedByUserId"],
    {
      createdAt: isoDateStringSchema,
      enabled: {
        bsonType: "bool"
      },
      id: nonEmptyStringSchema,
      key: householdFeatureFlagKeySchema,
      updatedAt: isoDateStringSchema,
      updatedByUserId: nonEmptyStringSchema
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
      productSourceId: optionalStringSchema,
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
      idealMaxLimit: optionalNonNegativeNumberSchema,
      initialAmount: nonNegativeNumberSchema,
      minLimit: nonNegativeNumberSchema,
      note: optionalStringSchema,
      productSourceId: optionalStringSchema,
      sourceName: optionalStringSchema,
      sourceProductUrl: optionalStringSchema,
      stockedAt: isoDateStringSchema,
      stockGroupKey: nonEmptyStringSchema,
      status: householdStockItemStatusSchema,
      unit: nonEmptyStringSchema,
      updatedAt: isoDateStringSchema,
      updatedByUserId: nonEmptyStringSchema
    }
  ),
  household_purchase_price_observations: requiredObjectSchema(
    ["createdAt", "displayName", "householdId", "id", "observedAt", "price", "updatedAt", "unit"],
    {
      catalogProductId: optionalStringSchema,
      catalogProductNameSnapshot: optionalStringSchema,
      createdAt: isoDateStringSchema,
      displayName: nonEmptyStringSchema,
      gtin: optionalStringSchema,
      householdId: nonEmptyStringSchema,
      householdProductId: optionalStringSchema,
      householdStockItemId: optionalStringSchema,
      id: nonEmptyStringSchema,
      observedAt: isoDateStringSchema,
      price: observedPriceSchema,
      productSourceId: optionalStringSchema,
      shoppingListId: optionalStringSchema,
      shoppingListLineId: optionalStringSchema,
      shopId: optionalStringSchema,
      sourceName: optionalStringSchema,
      sourceProductUrl: optionalStringSchema,
      stockGroupKey: optionalStringSchema,
      unit: nonEmptyStringSchema,
      updatedAt: isoDateStringSchema
    }
  ),
  household_shopping_lists: requiredObjectSchema(
    [
      "createdAt",
      "createdByUserId",
      "householdId",
      "id",
      "items",
      "scale",
      "schemaVersion",
      "status",
      "updatedAt",
      "updatedByUserId"
    ],
    {
      createdAt: isoDateStringSchema,
      createdByUserId: nonEmptyStringSchema,
      householdId: nonEmptyStringSchema,
      id: nonEmptyStringSchema,
      items: {
        bsonType: "array",
        items: shoppingListLineSchema
      },
      scale: householdShoppingScaleSchema,
      schemaVersion: nonEmptyStringSchema,
      shopId: optionalStringSchema,
      status: householdShoppingListStatusSchema,
      stockAppliedAt: optionalStringSchema,
      updatedAt: isoDateStringSchema,
      updatedByUserId: nonEmptyStringSchema
    }
  ),
  household_shops: requiredObjectSchema(
    ["countryCode", "createdAt", "id", "label", "sourceNames", "status", "storeBrandKeys", "updatedAt"],
    {
      countryCode: nonEmptyStringSchema,
      createdAt: isoDateStringSchema,
      id: nonEmptyStringSchema,
      label: nonEmptyStringSchema,
      sourceNames: {
        bsonType: "array",
        items: nonEmptyStringSchema
      },
      status: householdShopStatusSchema,
      storeBrandKeys: {
        bsonType: "array",
        items: nonEmptyStringSchema
      },
      updatedAt: isoDateStringSchema
    }
  )
};

export const householdV1SchemaArtifact = {
  artifactName: "household_v1_foundation",
  schemaVersion: "1.0.0",
  schemas: householdV1CollectionSchemas
} as const;
