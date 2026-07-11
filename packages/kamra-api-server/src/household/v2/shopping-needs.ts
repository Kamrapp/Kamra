import type { ShoppingNeed, StockTarget } from "./contracts.js";
import type { StockTargetAggregate } from "./domain.js";

export function generateShoppingNeed(target: StockTarget, aggregate: StockTargetAggregate, needId: string): ShoppingNeed | null {
  if (aggregate.availableQuantity >= target.minimumQuantity) return null;
  return {
    acceptanceCriteriaSnapshot: structuredClone(target.acceptanceCriteria),
    id: needId,
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

export function createAdHocShoppingNeed(input: { id: string; plannedQuantity: number; unit: ShoppingNeed["unit"] }): ShoppingNeed {
  if (!Number.isFinite(input.plannedQuantity) || input.plannedQuantity <= 0) throw new Error("invalid_shopping_need_quantity");
  return { acceptanceCriteriaSnapshot: { acceptedAttributesAny: [], acceptedConceptsAny: [], excludedAttributesAny: [], requiredAttributesAll: [], requiredConceptsAll: [] }, id: input.id, plannedQuantity: input.plannedQuantity, reasonCode: "manual", revision: 0, state: "open", stockTargetId: null, unit: input.unit };
}

export function transitionShoppingNeed(need: ShoppingNeed, state: ShoppingNeed["state"], expectedRevision: number): ShoppingNeed {
  if (need.revision !== expectedRevision) throw new Error("stale_revision");
  if (need.state === state) return need;
  return { ...need, revision: need.revision + 1, state };
}
