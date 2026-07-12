import type { ShoppingNeed, StockTarget, TargetPolicy } from "./contracts.js";
import type { StockTargetAggregate } from "./domain.js";
import type { ProductStockAggregate } from "./product-group-read-model.js";

export function generateShoppingNeed(
  target: StockTarget,
  aggregate: StockTargetAggregate,
  needId: string
): ShoppingNeed | null {
  if (aggregate.availableQuantity >= target.minimumQuantity) return null;
  return {
    acceptanceCriteriaSnapshot: structuredClone(target.acceptanceCriteria),
    id: needId,
    ownerDisplayNameSnapshot: target.displayName,
    ownerId: target.id,
    ownerKind: "stock_target_legacy",
    plannedQuantity: target.targetQuantity - aggregate.availableQuantity,
    preferredProductId: target.preferredProductId,
    preferredProductNameSnapshot: target.preferredProductNameSnapshot,
    reasonCode: "below_minimum",
    revision: 0,
    state: "open",
    stockTargetId: target.id,
    unit: target.trackingUnit
  };
}

export function generateTargetPolicyShoppingNeed(input: {
  aggregate: ProductStockAggregate;
  displayName: string;
  id: string;
  needId: string;
  ownerKind: "household_product" | "product_group";
  policy: TargetPolicy;
}): ShoppingNeed | null {
  if (input.aggregate.availableQuantity >= input.policy.minimumQuantity) return null;
  return {
    acceptanceCriteriaSnapshot: {
      acceptedAttributesAny: [],
      acceptedConceptsAny: [],
      excludedAttributesAny: [],
      requiredAttributesAll: [],
      requiredConceptsAll: []
    },
    id: input.needId,
    ownerDisplayNameSnapshot: input.displayName,
    ownerId: input.id,
    ownerKind: input.ownerKind,
    plannedQuantity: input.policy.desiredQuantity - input.aggregate.availableQuantity,
    reasonCode: "below_minimum",
    revision: 0,
    state: "open",
    unit: input.policy.trackingUnit
  };
}

export function createAdHocShoppingNeed(input: {
  id: string;
  plannedQuantity: number;
  unit: ShoppingNeed["unit"];
}): ShoppingNeed {
  if (!Number.isFinite(input.plannedQuantity) || input.plannedQuantity <= 0)
    throw new Error("invalid_shopping_need_quantity");
  return {
    acceptanceCriteriaSnapshot: {
      acceptedAttributesAny: [],
      acceptedConceptsAny: [],
      excludedAttributesAny: [],
      requiredAttributesAll: [],
      requiredConceptsAll: []
    },
    id: input.id,
    ownerId: null,
    ownerKind: "manual",
    plannedQuantity: input.plannedQuantity,
    reasonCode: "manual",
    revision: 0,
    state: "open",
    stockTargetId: null,
    unit: input.unit
  };
}

export function transitionShoppingNeed(
  need: ShoppingNeed,
  state: ShoppingNeed["state"],
  expectedRevision: number
): ShoppingNeed {
  if (need.revision !== expectedRevision) throw new Error("stale_revision");
  if (need.state === state) return need;
  return { ...need, revision: need.revision + 1, state };
}
