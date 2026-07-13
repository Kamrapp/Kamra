import type {
  CreateHouseholdShoppingListRequest,
  CreateHouseholdRequest,
  CreateHouseholdStockItemRequest,
  DeleteHouseholdStockItemRequest,
  HouseholdFeatureFlagRecord,
  HouseholdLocalProductRecord,
  HouseholdMembershipRecord,
  HouseholdRecord,
  HouseholdShoppingListLineRecord,
  HouseholdShoppingListPreviewRequest,
  HouseholdStockItemRecord,
  HouseholdStockPageRequest,
  UpdateHouseholdFeatureFlagRequest,
  UpdateHouseholdShoppingListRequest,
  UpdateHouseholdShoppingListStocksRequest,
  UpdateHouseholdStockItemRequest
} from "./contracts.js";
import {
  householdFeatureFlagKeys,
  groupTargetShoppingModes,
  householdLocalProductStatuses,
  householdMembershipRoles,
  householdMembershipStatuses,
  householdShoppingListLineSourceKinds,
  householdShoppingListStatuses,
  householdShoppingListReasonCodes,
  householdShoppingListStockApplicationStatuses,
  householdShoppingListUpdateScopes,
  householdShoppingScales,
  householdShoppingListItemUncertaintyFlags,
  householdStockStatuses,
  householdStatuses,
  householdStockItemStatuses
} from "./contracts.js";

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
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
function assertOptionalBoolean(value: unknown, label: string): void {
  if (value !== undefined && value !== null && typeof value !== "boolean")
    throw new Error(`${label} must be a boolean when provided.`);
}

function assertOptionalNonEmptyString(value: unknown, label: string): void {
  if (value !== undefined && value !== null) {
    assertNonEmptyString(value, label);
  }
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertNonNegativeNumber(value: unknown, label: string): asserts value is number {
  assertNumber(value, label);

  if (value < 0) {
    throw new Error(`${label} must be greater than or equal to zero.`);
  }
}

function assertOptionalNonNegativeNumber(value: unknown, label: string): void {
  if (value !== undefined) {
    assertNonNegativeNumber(value, label);
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

function assertArray(value: unknown, label: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
}

export function assertHouseholdRecord(
  value: unknown,
  label = "household"
): asserts value is HouseholdRecord {
  assertObject(value, label);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["createdByUserId"], `${label}.createdByUserId`);
  assertOptionalBoolean(value["allowExpiredItems"], `${label}.allowExpiredItems`);
  assertOptionalNonNegativeNumber(
    value["defaultCalculatedMaxLimitMultiplier"],
    `${label}.defaultCalculatedMaxLimitMultiplier`
  );
  if (value["groupTargetShoppingMode"] !== undefined && value["groupTargetShoppingMode"] !== null)
    assertEnum(
      value["groupTargetShoppingMode"],
      groupTargetShoppingModes,
      `${label}.groupTargetShoppingMode`
    );
  assertOptionalNonEmptyString(value["favouriteShopId"], `${label}.favouriteShopId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertNonEmptyString(value["name"], `${label}.name`);
  assertEnum(value["status"], householdStatuses, `${label}.status`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
}

export function assertHouseholdMembershipRecord(
  value: unknown,
  label = "householdMembership"
): asserts value is HouseholdMembershipRecord {
  assertObject(value, label);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertEnum(value["role"], householdMembershipRoles, `${label}.role`);
  assertEnum(value["status"], householdMembershipStatuses, `${label}.status`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
  assertNonEmptyString(value["userId"], `${label}.userId`);
}

export function assertHouseholdFeatureFlagRecord(
  value: unknown,
  label = "householdFeatureFlag"
): asserts value is HouseholdFeatureFlagRecord {
  assertObject(value, label);
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  if (typeof value["enabled"] !== "boolean") {
    throw new Error(`${label}.enabled must be a boolean.`);
  }
  assertNonEmptyString(value["id"], `${label}.id`);
  assertEnum(value["key"], householdFeatureFlagKeys, `${label}.key`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
  assertNonEmptyString(value["updatedByUserId"], `${label}.updatedByUserId`);
}

export function assertHouseholdLocalProductRecord(
  value: unknown,
  label = "householdLocalProduct"
): asserts value is HouseholdLocalProductRecord {
  assertObject(value, label);
  assertOptionalNonEmptyString(value["catalogProductId"], `${label}.catalogProductId`);
  assertOptionalNonEmptyString(
    value["catalogProductNameSnapshot"],
    `${label}.catalogProductNameSnapshot`
  );
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["createdByUserId"], `${label}.createdByUserId`);
  assertNonEmptyString(value["displayName"], `${label}.displayName`);
  assertOptionalNonEmptyString(value["gtin"], `${label}.gtin`);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertOptionalNonEmptyString(value["productSourceId"], `${label}.productSourceId`);
  assertOptionalNonEmptyString(value["productGroupId"], `${label}.productGroupId`);
  assertOptionalNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertOptionalNonEmptyString(value["sourceProductUrl"], `${label}.sourceProductUrl`);
  assertNonEmptyString(value["stockGroupKey"], `${label}.stockGroupKey`);
  assertEnum(value["status"], householdLocalProductStatuses, `${label}.status`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
  assertNonEmptyString(value["updatedByUserId"], `${label}.updatedByUserId`);
}

export function assertHouseholdStockItemRecord(
  value: unknown,
  label = "householdStockItem"
): asserts value is HouseholdStockItemRecord {
  assertObject(value, label);
  assertOptionalNonEmptyString(value["catalogProductId"], `${label}.catalogProductId`);
  assertOptionalNonEmptyString(
    value["catalogProductNameSnapshot"],
    `${label}.catalogProductNameSnapshot`
  );
  assertIsoDateString(value["createdAt"], `${label}.createdAt`);
  assertNonEmptyString(value["createdByUserId"], `${label}.createdByUserId`);
  assertNonNegativeNumber(value["currentAmount"], `${label}.currentAmount`);
  assertNonEmptyString(value["displayName"], `${label}.displayName`);
  assertOptionalNonEmptyString(value["gtin"], `${label}.gtin`);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertNonEmptyString(value["householdProductId"], `${label}.householdProductId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  if (value["idealMaxLimit"] !== undefined && value["idealMaxLimit"] !== null) {
    assertNonNegativeNumber(value["idealMaxLimit"], `${label}.idealMaxLimit`);
  }
  assertNonNegativeNumber(value["initialAmount"], `${label}.initialAmount`);
  assertNonNegativeNumber(value["minLimit"], `${label}.minLimit`);
  assertOptionalString(value["note"], `${label}.note`);
  assertOptionalNonEmptyString(value["productSourceId"], `${label}.productSourceId`);
  assertOptionalNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertOptionalNonEmptyString(value["sourceProductUrl"], `${label}.sourceProductUrl`);
  assertIsoDateString(value["stockedAt"], `${label}.stockedAt`);
  assertNonEmptyString(value["stockGroupKey"], `${label}.stockGroupKey`);
  assertEnum(value["status"], householdStockItemStatuses, `${label}.status`);
  assertNonEmptyString(value["unit"], `${label}.unit`);
  assertIsoDateString(value["updatedAt"], `${label}.updatedAt`);
  assertNonEmptyString(value["updatedByUserId"], `${label}.updatedByUserId`);
}

function assertHouseholdIdPayload(
  value: unknown,
  label: string
): asserts value is HouseholdStockPageRequest {
  assertObject(value, label);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
}

export function assertHouseholdCreateRequest(
  value: unknown,
  label = "createHouseholdRequest"
): asserts value is CreateHouseholdRequest {
  assertObject(value, label);
  assertNonEmptyString(value["name"], `${label}.name`);
}

export function assertHouseholdStockPageRequest(
  value: unknown,
  label = "householdStockPageRequest"
): asserts value is HouseholdStockPageRequest {
  assertHouseholdIdPayload(value, label);
}

export function assertCreateHouseholdStockItemRequest(
  value: unknown,
  label = "createHouseholdStockItemRequest"
): asserts value is CreateHouseholdStockItemRequest {
  assertObject(value, label);
  assertOptionalNonEmptyString(value["catalogProductId"], `${label}.catalogProductId`);
  assertOptionalNonEmptyString(
    value["catalogProductNameSnapshot"],
    `${label}.catalogProductNameSnapshot`
  );
  assertNonNegativeNumber(value["currentAmount"], `${label}.currentAmount`);
  assertNonEmptyString(value["displayName"], `${label}.displayName`);
  assertOptionalNonEmptyString(value["gtin"], `${label}.gtin`);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertOptionalNonEmptyString(value["householdProductId"], `${label}.householdProductId`);
  if (value["idealMaxLimit"] !== undefined && value["idealMaxLimit"] !== null) {
    assertNonNegativeNumber(value["idealMaxLimit"], `${label}.idealMaxLimit`);
  }
  assertOptionalNonNegativeNumber(value["initialAmount"], `${label}.initialAmount`);
  assertNonNegativeNumber(value["minLimit"], `${label}.minLimit`);
  assertOptionalString(value["note"], `${label}.note`);
  assertOptionalNonEmptyString(value["productSourceId"], `${label}.productSourceId`);
  assertOptionalNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertOptionalNonEmptyString(value["sourceProductUrl"], `${label}.sourceProductUrl`);
  assertIsoDateString(value["stockedAt"], `${label}.stockedAt`);
  assertNonEmptyString(value["stockGroupKey"], `${label}.stockGroupKey`);
  assertNonEmptyString(value["unit"], `${label}.unit`);
}

export function assertUpdateHouseholdStockItemRequest(
  value: unknown,
  label = "updateHouseholdStockItemRequest"
): asserts value is UpdateHouseholdStockItemRequest {
  assertObject(value, label);
  assertOptionalNonEmptyString(value["catalogProductId"], `${label}.catalogProductId`);
  assertOptionalNonEmptyString(
    value["catalogProductNameSnapshot"],
    `${label}.catalogProductNameSnapshot`
  );
  if (value["currentAmount"] !== undefined) {
    assertNonNegativeNumber(value["currentAmount"], `${label}.currentAmount`);
  }
  if (value["displayName"] !== undefined) {
    assertNonEmptyString(value["displayName"], `${label}.displayName`);
  }
  assertOptionalNonEmptyString(value["gtin"], `${label}.gtin`);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  if (value["idealMaxLimit"] !== undefined && value["idealMaxLimit"] !== null) {
    assertNonNegativeNumber(value["idealMaxLimit"], `${label}.idealMaxLimit`);
  }
  if (value["initialAmount"] !== undefined) {
    assertNonNegativeNumber(value["initialAmount"], `${label}.initialAmount`);
  }
  if (value["minLimit"] !== undefined) {
    assertNonNegativeNumber(value["minLimit"], `${label}.minLimit`);
  }
  assertOptionalString(value["note"], `${label}.note`);
  assertOptionalNonEmptyString(value["productSourceId"], `${label}.productSourceId`);
  assertOptionalNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertOptionalNonEmptyString(value["sourceProductUrl"], `${label}.sourceProductUrl`);
  if (value["stockedAt"] !== undefined) {
    assertIsoDateString(value["stockedAt"], `${label}.stockedAt`);
  }
  if (value["stockGroupKey"] !== undefined) {
    assertNonEmptyString(value["stockGroupKey"], `${label}.stockGroupKey`);
  }
  if (value["unit"] !== undefined) {
    assertNonEmptyString(value["unit"], `${label}.unit`);
  }

  const hasMutableField =
    value["catalogProductId"] !== undefined ||
    value["catalogProductNameSnapshot"] !== undefined ||
    value["currentAmount"] !== undefined ||
    value["displayName"] !== undefined ||
    value["gtin"] !== undefined ||
    value["idealMaxLimit"] !== undefined ||
    value["initialAmount"] !== undefined ||
    value["minLimit"] !== undefined ||
    value["note"] !== undefined ||
    value["productSourceId"] !== undefined ||
    value["sourceName"] !== undefined ||
    value["sourceProductUrl"] !== undefined ||
    value["stockedAt"] !== undefined ||
    value["stockGroupKey"] !== undefined ||
    value["unit"] !== undefined;

  if (!hasMutableField) {
    throw new Error(`${label} must include at least one editable field.`);
  }
}

export function assertDeleteHouseholdStockItemRequest(
  value: unknown,
  label = "deleteHouseholdStockItemRequest"
): asserts value is DeleteHouseholdStockItemRequest {
  assertObject(value, label);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertNonEmptyString(value["id"], `${label}.id`);
}

export function assertHouseholdShoppingListPreviewRequest(
  value: unknown,
  label = "householdShoppingListPreviewRequest"
): asserts value is HouseholdShoppingListPreviewRequest {
  assertObject(value, label);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertEnum(value["scale"], householdShoppingScales, `${label}.scale`);
}

function assertObservedPriceInput(value: unknown, label: string): void {
  if (value === undefined || value === null) {
    return;
  }

  assertObject(value, label);
  assertNonNegativeNumber(value["amount"], `${label}.amount`);
  assertNonEmptyString(value["currencyCode"], `${label}.currencyCode`);
  assertIsoDateString(value["observedAt"], `${label}.observedAt`);
}

export function assertHouseholdShoppingListLineRecord(
  value: unknown,
  label = "householdShoppingListLine"
): asserts value is HouseholdShoppingListLineRecord {
  assertObject(value, label);
  assertOptionalNonEmptyString(value["catalogProductId"], `${label}.catalogProductId`);
  assertOptionalNonEmptyString(
    value["catalogProductNameSnapshot"],
    `${label}.catalogProductNameSnapshot`
  );
  if (value["currentAmount"] !== undefined && value["currentAmount"] !== null) {
    assertNonNegativeNumber(value["currentAmount"], `${label}.currentAmount`);
  }
  assertNonEmptyString(value["displayName"], `${label}.displayName`);
  assertOptionalNonEmptyString(value["gtin"], `${label}.gtin`);
  assertOptionalNonEmptyString(value["householdProductId"], `${label}.householdProductId`);
  assertOptionalNonEmptyString(value["householdStockItemId"], `${label}.householdStockItemId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  if (value["idealMaxLimit"] !== undefined && value["idealMaxLimit"] !== null) {
    assertNonNegativeNumber(value["idealMaxLimit"], `${label}.idealMaxLimit`);
  }
  if (value["minLimit"] !== undefined && value["minLimit"] !== null) {
    assertNonNegativeNumber(value["minLimit"], `${label}.minLimit`);
  }
  assertObservedPriceInput(value["observedPrice"], `${label}.observedPrice`);
  assertNonNegativeNumber(value["plannedAmount"], `${label}.plannedAmount`);
  assertOptionalNonEmptyString(value["productSourceId"], `${label}.productSourceId`);
  assertNonNegativeNumber(value["purchasedAmount"], `${label}.purchasedAmount`);
  if (value["reasonCode"] !== undefined && value["reasonCode"] !== null) {
    assertEnum(value["reasonCode"], householdShoppingListReasonCodes, `${label}.reasonCode`);
  }
  assertEnum(value["sourceKind"], householdShoppingListLineSourceKinds, `${label}.sourceKind`);
  assertOptionalNonEmptyString(value["sourceName"], `${label}.sourceName`);
  assertOptionalNonEmptyString(value["sourceProductUrl"], `${label}.sourceProductUrl`);
  assertEnum(value["status"], householdShoppingListStockApplicationStatuses, `${label}.status`);
  assertOptionalNonEmptyString(value["stockGroupKey"], `${label}.stockGroupKey`);
  if (value["stockStatus"] !== undefined && value["stockStatus"] !== null) {
    assertEnum(value["stockStatus"], householdStockStatuses, `${label}.stockStatus`);
  }
  assertNonNegativeNumber(value["suggestedBuyAmount"], `${label}.suggestedBuyAmount`);
  assertNonNegativeNumber(value["targetAmount"], `${label}.targetAmount`);
  if (typeof value["ticked"] !== "boolean") {
    throw new Error(`${label}.ticked must be a boolean.`);
  }
  assertArray(value["uncertaintyFlags"], `${label}.uncertaintyFlags`);
  for (const [index, flag] of value["uncertaintyFlags"].entries()) {
    assertEnum(
      flag,
      householdShoppingListItemUncertaintyFlags,
      `${label}.uncertaintyFlags[${index}]`
    );
  }
  assertNonEmptyString(value["unit"], `${label}.unit`);
}

export function assertCreateHouseholdShoppingListRequest(
  value: unknown,
  label = "createHouseholdShoppingListRequest"
): asserts value is CreateHouseholdShoppingListRequest {
  assertObject(value, label);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertEnum(value["scale"], householdShoppingScales, `${label}.scale`);
  assertOptionalNonEmptyString(value["shopId"], `${label}.shopId`);
  if (value["selectedOwnerIds"] !== undefined) {
    assertArray(value["selectedOwnerIds"], `${label}.selectedOwnerIds`);
    for (const [index, id] of value["selectedOwnerIds"].entries())
      assertNonEmptyString(id, `${label}.selectedOwnerIds[${index}]`);
  }
  if (value["selectedStockItemIds"] !== undefined) {
    assertArray(value["selectedStockItemIds"], `${label}.selectedStockItemIds`);
    for (const [index, id] of value["selectedStockItemIds"].entries())
      assertNonEmptyString(id, `${label}.selectedStockItemIds[${index}]`);
  }
}

export function assertUpdateHouseholdShoppingListRequest(
  value: unknown,
  label = "updateHouseholdShoppingListRequest"
): asserts value is UpdateHouseholdShoppingListRequest {
  assertObject(value, label);
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertOptionalNonEmptyString(value["shopId"], `${label}.shopId`);
  if (value["status"] !== undefined) {
    assertEnum(value["status"], householdShoppingListStatuses, `${label}.status`);
  }

  if (value["items"] !== undefined) {
    assertArray(value["items"], `${label}.items`);
    for (const [index, item] of value["items"].entries()) {
      assertHouseholdShoppingListLineRecord(item, `${label}.items[${index}]`);
    }
  }

  if (
    value["items"] === undefined &&
    value["shopId"] === undefined &&
    value["status"] === undefined
  ) {
    throw new Error(`${label} must include items, shopId, or status.`);
  }
}

export function assertUpdateHouseholdShoppingListStocksRequest(
  value: unknown,
  label = "updateHouseholdShoppingListStocksRequest"
): asserts value is UpdateHouseholdShoppingListStocksRequest {
  assertObject(value, label);
  if (value["confirmationMode"] !== undefined && value["confirmationMode"] !== null) {
    assertEnum(
      value["confirmationMode"],
      householdShoppingListUpdateScopes,
      `${label}.confirmationMode`
    );
  }
  assertNonEmptyString(value["householdId"], `${label}.householdId`);
  assertNonEmptyString(value["id"], `${label}.id`);
  assertIsoDateString(value["stockAppliedAt"], `${label}.stockAppliedAt`);
}

export function assertUpdateHouseholdFeatureFlagRequest(
  value: unknown,
  label = "updateHouseholdFeatureFlagRequest"
): asserts value is UpdateHouseholdFeatureFlagRequest {
  assertObject(value, label);
  if (typeof value["enabled"] !== "boolean") {
    throw new Error(`${label}.enabled must be a boolean.`);
  }
  assertEnum(value["key"], householdFeatureFlagKeys, `${label}.key`);
}
