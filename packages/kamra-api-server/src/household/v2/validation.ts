import { householdProductIdentityKinds, trackingUnits, type AcceptanceCriteria, type CreateHouseholdProductRequest, type CreateManualStockBatchRequest, type CreateStockTargetRequest, type StockAllocation, type StockBatch, type StockTarget, type TrackingUnit } from "./contracts.js";

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}
function isQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && Number.isInteger(value * 1_000_000);
}
function assertValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function assertRef(value: unknown, label: string): void {
  assertValue(!!value && typeof value === "object" && !Array.isArray(value), `${label} must be a reference`);
  const ref = value as Record<string, unknown>;
  assertValue(typeof ref["key"] === "string" && ref["key"].length > 0, `${label}.key is required`);
  assertValue(ref["scope"] === "catalog" || ref["scope"] === "household", `${label}.scope is invalid`);
}
function assertRefs(value: unknown, label: string): void {
  assertValue(Array.isArray(value), `${label} must be an array`);
  (value as unknown[]).forEach((item, index) => assertRef(item, `${label}[${index}]`));
}

export function assertTrackingUnit(value: unknown, label = "unit"): asserts value is TrackingUnit {
  assertValue(typeof value === "string" && (trackingUnits.includes(value as never) || value.startsWith("custom:")), `${label} is invalid`);
}

export function assertAcceptanceCriteria(value: unknown, label = "acceptanceCriteria"): asserts value is AcceptanceCriteria {
  assertValue(!!value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const criteria = value as Record<string, unknown>;
  for (const key of ["requiredConceptsAll", "acceptedConceptsAny", "requiredAttributesAll", "acceptedAttributesAny", "excludedAttributesAny"]) assertRefs(criteria[key], `${label}.${key}`);
}

export function assertStockTarget(value: unknown, label = "stockTarget"): asserts value is StockTarget {
  assertValue(!!value && typeof value === "object", `${label} must be an object`);
  const target = value as Record<string, unknown>;
  for (const key of ["id", "householdId", "displayName", "createdByUserId", "updatedByUserId", "createdAt", "updatedAt"]) assertValue(typeof target[key] === "string" && Boolean(target[key]), `${label}.${key} is required`);
  assertValue(isTimestamp(target["createdAt"]) && isTimestamp(target["updatedAt"]), `${label} timestamps are invalid`);
  assertTrackingUnit(target["trackingUnit"], `${label}.trackingUnit`);
  assertValue(isQuantity(target["minimumQuantity"]) && isQuantity(target["targetQuantity"]), `${label} quantities are invalid`);
  assertValue((target["targetQuantity"] as number) >= (target["minimumQuantity"] as number), `${label}.targetQuantity must not be below minimumQuantity`);
  assertValue(Number.isInteger(target["expiryWarningDays"]) && (target["expiryWarningDays"] as number) >= 0, `${label}.expiryWarningDays is invalid`);
  assertValue(Number.isInteger(target["revision"]) && (target["revision"] as number) >= 0, `${label}.revision is invalid`);
  assertValue(target["status"] === "active" || target["status"] === "archived", `${label}.status is invalid`);
  assertAcceptanceCriteria(target["acceptanceCriteria"]);
}

export function assertStockBatch(value: unknown, label = "stockBatch"): asserts value is StockBatch {
  assertValue(!!value && typeof value === "object", `${label} must be an object`);
  const batch = value as Record<string, unknown>;
  assertValue(isDate(batch["acquiredOn"]), `${label}.acquiredOn must be a date`);
  assertValue(batch["expiryOn"] === null || batch["expiryOn"] === undefined || isDate(batch["expiryOn"]), `${label}.expiryOn must be a date or null`);
  if (typeof batch["expiryOn"] === "string") assertValue(batch["expiryOn"] >= (batch["acquiredOn"] as string), `${label}.expiryOn cannot precede acquiredOn`);
  assertValue(isQuantity(batch["originalQuantity"]) && isQuantity(batch["remainingQuantity"]) && (batch["remainingQuantity"] as number) <= (batch["originalQuantity"] as number), `${label} quantities are invalid`);
  assertTrackingUnit(batch["unit"], `${label}.unit`);
  assertValue(batch["status"] === "available" || batch["status"] === "depleted" || batch["status"] === "discarded" || batch["status"] === "voided", `${label}.status is invalid`);
  const snapshot = batch["acquisitionSnapshot"] as Record<string, unknown> | undefined;
  assertValue(!!snapshot && typeof snapshot === "object" && typeof snapshot["displayName"] === "string", `${label}.acquisitionSnapshot.displayName is required`);
  assertValue(!!batch["classificationSnapshot"] && typeof batch["classificationSnapshot"] === "object", `${label}.classificationSnapshot is required`);
}

export function assertStockAllocation(value: unknown, label = "stockAllocation"): asserts value is StockAllocation {
  assertValue(!!value && typeof value === "object", `${label} must be an object`);
  const allocation = value as Record<string, unknown>;
  assertValue(typeof allocation["stockBatchId"] === "string" && typeof allocation["stockTargetId"] === "string", `${label} references are required`);
  assertValue(isQuantity(allocation["allocatedQuantity"]) && (allocation["allocatedQuantity"] as number) > 0, `${label}.allocatedQuantity must be positive`);
  assertTrackingUnit(allocation["unit"], `${label}.unit`);
  assertValue(allocation["status"] === "active" || allocation["status"] === "released", `${label}.status is invalid`);
  assertValue(allocation["acceptanceResult"] === "accepted" || allocation["acceptanceResult"] === "overridden" || allocation["acceptanceResult"] === "criteria_changed", `${label}.acceptanceResult is invalid`);
  if (allocation["acceptanceResult"] === "overridden") assertValue(typeof allocation["overrideReason"] === "string" && allocation["overrideReason"].trim().length > 0 && allocation["overrideReason"].length <= 300, `${label}.overrideReason is required for an override`);
}

export function assertCreateManualStockBatchRequest(value: unknown, label = "createManualStockBatchRequest"): asserts value is CreateManualStockBatchRequest {
  assertValue(!!value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const request = value as Record<string, unknown>;
  for (const key of ["acquiredOn", "displayName", "operationId", "requestFingerprint"]) assertValue(typeof request[key] === "string" && Boolean(request[key]), `${label}.${key} is required`);
  assertValue(isDate(request["acquiredOn"]), `${label}.acquiredOn must be a date`);
  assertValue(request["expiryOn"] === null || request["expiryOn"] === undefined || isDate(request["expiryOn"]), `${label}.expiryOn must be a date or null`);
  if (typeof request["expiryOn"] === "string") assertValue(request["expiryOn"] >= (request["acquiredOn"] as string), `${label}.expiryOn cannot precede acquiredOn`);
  if (request["householdProductId"] !== undefined && request["householdProductId"] !== null) assertValue(typeof request["householdProductId"] === "string" && request["householdProductId"].length > 0, `${label}.householdProductId is invalid`);
  assertValue(isQuantity(request["originalQuantity"]) && (request["originalQuantity"] as number) > 0, `${label}.originalQuantity must be positive`);
  assertTrackingUnit(request["unit"], `${label}.unit`);
  if (request["directConcepts"] !== undefined) assertRefs(request["directConcepts"], `${label}.directConcepts`);
  if (request["directAttributes"] !== undefined) assertRefs(request["directAttributes"], `${label}.directAttributes`);
}

export function assertCreateStockTargetRequest(value: unknown, label = "createStockTargetRequest"): asserts value is CreateStockTargetRequest {
  assertValue(!!value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const request = value as Record<string, unknown>;
  assertValue(typeof request["displayName"] === "string" && request["displayName"].trim().length > 0, `${label}.displayName is required`);
  assertTrackingUnit(request["trackingUnit"], `${label}.trackingUnit`);
  assertValue(isQuantity(request["minimumQuantity"]) && isQuantity(request["targetQuantity"]), `${label} quantities are invalid`);
  assertValue((request["targetQuantity"] as number) >= (request["minimumQuantity"] as number), `${label}.targetQuantity must not be below minimumQuantity`);
  assertValue(Number.isInteger(request["expiryWarningDays"]) && (request["expiryWarningDays"] as number) >= 0, `${label}.expiryWarningDays is invalid`);
  assertValue(request["consumptionPolicy"] === "earliest_expiry_first" || request["consumptionPolicy"] === "oldest_acquired_first", `${label}.consumptionPolicy is invalid`);
  assertAcceptanceCriteria(request["acceptanceCriteria"], `${label}.acceptanceCriteria`);
}

export function assertCreateHouseholdProductRequest(value: unknown, label = "createHouseholdProductRequest"): asserts value is CreateHouseholdProductRequest {
  assertValue(!!value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const request = value as Record<string, unknown>;
  assertValue(typeof request["displayName"] === "string" && request["displayName"].trim().length > 0, `${label}.displayName is required`);
  assertValue(typeof request["identityKind"] === "string" && householdProductIdentityKinds.includes(request["identityKind"] as never), `${label}.identityKind is invalid`);
  if (request["catalogProductId"] !== undefined && request["catalogProductId"] !== null) assertValue(typeof request["catalogProductId"] === "string" && request["catalogProductId"].length > 0, `${label}.catalogProductId is invalid`);
  if (request["directConcepts"] !== undefined) assertRefs(request["directConcepts"], `${label}.directConcepts`);
  if (request["directAttributes"] !== undefined) assertRefs(request["directAttributes"], `${label}.directAttributes`);
}
