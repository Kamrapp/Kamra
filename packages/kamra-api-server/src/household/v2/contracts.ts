export const householdV2CollectionNames = [
  "household_stock_targets",
  "household_stock_batches",
  "household_stock_allocations",
  "household_stock_movements",
  "household_domain_operations",
  "household_shopping_need_lists"
] as const;

export type HouseholdV2CollectionName = (typeof householdV2CollectionNames)[number];

export const schemaVersion = "household-v2" as const;
export type SchemaVersion = typeof schemaVersion;

export const lifecycleStatuses = ["active", "archived"] as const;
export type LifecycleStatus = (typeof lifecycleStatuses)[number];

export const productConceptScopes = ["catalog", "household"] as const;
export type ProductConceptScope = (typeof productConceptScopes)[number];

export interface ProductConceptRef {
  key: string;
  scope: ProductConceptScope;
}

export interface ProductAttributeRef {
  key: string;
  scope: ProductConceptScope;
}

export const householdProductIdentityKinds = ["manual", "catalogue"] as const;
export type HouseholdProductIdentityKind = (typeof householdProductIdentityKinds)[number];

export interface HouseholdProductIdentitySnapshot {
  brand?: string | null;
  gtin?: string | null;
  measurementLabel?: string | null;
  sourceKey?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}

export interface HouseholdProduct {
  catalogProductId?: string | null;
  classificationRevision: number;
  createdAt: string;
  createdByUserId: string;
  directAttributes: ProductAttributeRef[];
  directConcepts: ProductConceptRef[];
  displayName: string;
  householdId: string;
  id: string;
  identityKind: HouseholdProductIdentityKind;
  identitySnapshot: HouseholdProductIdentitySnapshot;
  revision: number;
  status: "active" | "archived";
  updatedAt: string;
  updatedByUserId: string;
}

export const productConceptRelationKinds = ["is_a"] as const;
export type ProductConceptRelationKind = (typeof productConceptRelationKinds)[number];

export interface ProductConceptRelation {
  child: ProductConceptRef;
  kind: ProductConceptRelationKind;
  parent: ProductConceptRef;
}

export interface AcceptanceCriteria {
  acceptedAttributesAny: ProductAttributeRef[];
  acceptedConceptsAny: ProductConceptRef[];
  excludedAttributesAny: ProductAttributeRef[];
  requiredAttributesAll: ProductAttributeRef[];
  requiredConceptsAll: ProductConceptRef[];
}

export interface ProductClassification {
  directAttributes: ProductAttributeRef[];
  directConcepts: ProductConceptRef[];
  effectiveConcepts: ProductConceptRef[];
}

export interface ClassificationSnapshot extends ProductClassification {
  capturedAt: string;
  source: "catalog" | "household" | "manual";
}

export const trackingUnits = ["g", "kg", "ml", "l", "count"] as const;
export type TrackingUnit = (typeof trackingUnits)[number] | `custom:${string}`;

export const consumptionPolicies = ["earliest_expiry_first", "oldest_acquired_first"] as const;
export type ConsumptionPolicy = (typeof consumptionPolicies)[number];

export const stockTargetStatuses = ["active", "archived"] as const;
export type StockTargetStatus = (typeof stockTargetStatuses)[number];

export interface StockTarget {
  acceptanceCriteria: AcceptanceCriteria;
  consumptionPolicy: ConsumptionPolicy;
  createdAt: string;
  createdByUserId: string;
  displayName: string;
  expiryWarningDays: number;
  householdId: string;
  id: string;
  minimumQuantity: number;
  preferredProductId?: string | null;
  preferredProductNameSnapshot?: string | null;
  revision: number;
  status: StockTargetStatus;
  targetQuantity: number;
  trackingUnit: TrackingUnit;
  updatedAt: string;
  updatedByUserId: string;
}

export interface AcquisitionSnapshot {
  brand?: string | null;
  displayName: string;
  gtin?: string | null;
  measurementLabel?: string | null;
  sourceKey?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}

export const stockBatchStatuses = ["available", "depleted", "discarded", "voided"] as const;
export type StockBatchStatus = (typeof stockBatchStatuses)[number];

export interface StockBatch {
  acquiredOn: string;
  acquisitionSnapshot: AcquisitionSnapshot;
  classificationSnapshot: ClassificationSnapshot;
  createdAt: string;
  createdByUserId: string;
  discardedAt?: string | null;
  expiryOn?: string | null;
  householdId: string;
  householdProductId?: string | null;
  id: string;
  originalQuantity: number;
  productId?: string | null;
  purchaseOperationId?: string | null;
  remainingQuantity: number;
  revision: number;
  shopProductId?: string | null;
  shoppingNeedId?: string | null;
  shoppingNeedListId?: string | null;
  status: StockBatchStatus;
  unit: TrackingUnit;
  updatedAt: string;
  updatedByUserId: string;
}

export const stockAllocationStatuses = ["active", "released"] as const;
export type StockAllocationStatus = (typeof stockAllocationStatuses)[number];
export const stockAllocationAcceptanceResults = ["accepted", "overridden", "criteria_changed"] as const;
export type StockAllocationAcceptanceResult = (typeof stockAllocationAcceptanceResults)[number];

export interface StockAllocation {
  acceptanceResult: StockAllocationAcceptanceResult;
  allocatedQuantity: number;
  createdAt: string;
  createdByUserId: string;
  householdId: string;
  id: string;
  overrideReason?: string | null;
  revision: number;
  status: StockAllocationStatus;
  stockBatchId: string;
  stockTargetId: string;
  unit: TrackingUnit;
  updatedAt: string;
  updatedByUserId: string;
}

export const stockMovementKinds = [
  "acquisition", "consumption", "correction", "discard", "migration_opening_balance", "reversal"
] as const;
export type StockMovementKind = (typeof stockMovementKinds)[number];

export interface StockMovement {
  actorUserId: string;
  createdAt: string;
  householdId: string;
  id: string;
  kind: StockMovementKind;
  occurrenceAt: string;
  operationId: string;
  quantityDelta: number;
  resultingQuantity: number;
  stockBatchId: string;
  stockTargetId?: string | null;
  unit: TrackingUnit;
  reasonCode?: string | null;
  sourceMovementId?: string | null;
  sourceReferenceId?: string | null;
}

export const operationStatuses = ["started", "completed", "failed"] as const;
export type OperationStatus = (typeof operationStatuses)[number];
export interface DomainOperation {
  actorUserId: string;
  createdAt: string;
  householdId: string;
  id: string;
  operationType: string;
  requestFingerprint: string;
  resultIdentifiers?: Record<string, string> | null;
  status: OperationStatus;
  updatedAt: string;
}

export const shoppingNeedStates = ["open", "skipped"] as const;
export type ShoppingNeedState = (typeof shoppingNeedStates)[number];
export interface ShoppingNeed {
  acceptanceCriteriaSnapshot: AcceptanceCriteria;
  id: string;
  plannedQuantity: number;
  reasonCode: "below_minimum" | "manual";
  state: ShoppingNeedState;
  stockTargetId?: string | null;
  unit: TrackingUnit;
  revision: number;
  preferredProductId?: string | null;
  preferredProductNameSnapshot?: string | null;
}

export interface ShoppingNeedList {
  createdAt: string;
  createdByUserId: string;
  householdId: string;
  id: string;
  items: ShoppingNeed[];
  updatedAt: string;
  updatedByUserId: string;
}

export const householdCapabilities = ["read", "manage_stock", "manage_list", "manage_members", "void_history"] as const;
export type HouseholdCapability = (typeof householdCapabilities)[number];

export interface HouseholdCapabilityContext {
  isMember: boolean;
  role: "member" | "owner";
}

export interface TransactionContext {
  readonly sessionId: string;
}

export interface IdempotencyConflict {
  code: "idempotency_conflict";
  operationId: string;
}

export interface Stage9ShoppingNeedExtension {
  shopMarketId?: string | null;
  selectedProductId?: string | null;
  selectedShopProductId?: string | null;
}

export interface CreateManualStockBatchRequest {
  acquiredOn: string;
  directAttributes?: ProductAttributeRef[];
  directConcepts?: ProductConceptRef[];
  displayName: string;
  expiryOn?: string | null;
  householdProductId?: string | null;
  operationId: string;
  originalQuantity: number;
  requestFingerprint: string;
  unit: TrackingUnit;
}

export interface CreateStockTargetRequest {
  acceptanceCriteria: AcceptanceCriteria;
  consumptionPolicy: ConsumptionPolicy;
  displayName: string;
  expiryWarningDays: number;
  minimumQuantity: number;
  targetQuantity: number;
  trackingUnit: TrackingUnit;
}

export interface CreateHouseholdProductRequest {
  catalogProductId?: string | null;
  directAttributes?: ProductAttributeRef[];
  directConcepts?: ProductConceptRef[];
  displayName: string;
  identityKind: HouseholdProductIdentityKind;
  identitySnapshot?: HouseholdProductIdentitySnapshot;
}
