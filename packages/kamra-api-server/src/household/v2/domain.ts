import type {
  AcceptanceCriteria,
  HouseholdCapability,
  HouseholdCapabilityContext,
  ProductAttributeRef,
  ProductClassification,
  ProductConceptRef,
  ProductConceptRelation,
  StockAllocation,
  StockBatch,
  StockTarget,
  TrackingUnit
} from "./contracts.js";

export interface ClassificationMatchExplanation {
  accepted: boolean;
  matchedAcceptedAttributes: ProductAttributeRef[];
  matchedAcceptedConcepts: ProductConceptRef[];
  matchedExcludedAttributes: ProductAttributeRef[];
  missingRequiredAttributes: ProductAttributeRef[];
  missingRequiredConcepts: ProductConceptRef[];
}

const refKey = (ref: { scope: string; key: string }): string => `${ref.scope}:${ref.key}`;

export function calculateEffectiveConcepts(
  directConcepts: readonly ProductConceptRef[],
  relations: readonly ProductConceptRelation[]
): ProductConceptRef[] {
  const parentsByChild = new Map<string, ProductConceptRef[]>();
  for (const relation of relations) {
    const childKey = refKey(relation.child);
    const parents = parentsByChild.get(childKey) ?? [];
    parents.push(relation.parent);
    parentsByChild.set(childKey, parents);
  }

  const result = new Map<string, ProductConceptRef>();
  const visiting = new Set<string>();
  const visit = (concept: ProductConceptRef): void => {
    const key = refKey(concept);
    if (visiting.has(key)) {
      throw new Error("product concept relation cycle detected");
    }
    if (result.has(key)) return;
    visiting.add(key);
    result.set(key, concept);
    for (const parent of parentsByChild.get(key) ?? []) visit(parent);
    visiting.delete(key);
  };
  for (const concept of directConcepts) visit(concept);
  return [...result.values()].sort((a, b) => refKey(a).localeCompare(refKey(b)));
}

export function validateConceptRelations(relations: readonly ProductConceptRelation[]): void {
  const direct = new Map<string, ProductConceptRef[]>();
  for (const relation of relations) {
    if (refKey(relation.child) === refKey(relation.parent)) throw new Error("product concept self-link is not allowed");
    const parents = direct.get(refKey(relation.child)) ?? [];
    parents.push(relation.parent);
    direct.set(refKey(relation.child), parents);
  }
  for (const child of direct.keys()) calculateEffectiveConcepts([{ scope: child.split(":")[0] as ProductConceptRef["scope"], key: child.slice(child.indexOf(":") + 1) }], relations);
}

export function classifyProduct(
  directConcepts: readonly ProductConceptRef[],
  directAttributes: readonly ProductAttributeRef[],
  relations: readonly ProductConceptRelation[]
): ProductClassification {
  return {
    directAttributes: [...directAttributes].sort((a, b) => refKey(a).localeCompare(refKey(b))),
    directConcepts: [...directConcepts].sort((a, b) => refKey(a).localeCompare(refKey(b))),
    effectiveConcepts: calculateEffectiveConcepts(directConcepts, relations)
  };
}

export function matchAcceptanceCriteria(
  criteria: AcceptanceCriteria,
  classification: ProductClassification
): ClassificationMatchExplanation {
  const concepts = new Set(classification.effectiveConcepts.map(refKey));
  const attributes = new Set(classification.directAttributes.map(refKey));
  const matchedAcceptedConcepts = criteria.acceptedConceptsAny.filter((ref) => concepts.has(refKey(ref)));
  const matchedAcceptedAttributes = criteria.acceptedAttributesAny.filter((ref) => attributes.has(refKey(ref)));
  const matchedExcludedAttributes = criteria.excludedAttributesAny.filter((ref) => attributes.has(refKey(ref)));
  const missingRequiredConcepts = criteria.requiredConceptsAll.filter((ref) => !concepts.has(refKey(ref)));
  const missingRequiredAttributes = criteria.requiredAttributesAll.filter((ref) => !attributes.has(refKey(ref)));
  const accepted = missingRequiredConcepts.length === 0
    && missingRequiredAttributes.length === 0
    && (criteria.acceptedConceptsAny.length === 0 || matchedAcceptedConcepts.length > 0)
    && (criteria.acceptedAttributesAny.length === 0 || matchedAcceptedAttributes.length > 0)
    && matchedExcludedAttributes.length === 0;
  return { accepted, matchedAcceptedAttributes, matchedAcceptedConcepts, matchedExcludedAttributes, missingRequiredAttributes, missingRequiredConcepts };
}

const unitFactors: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000, count: 1 };
export function areUnitsCompatible(from: TrackingUnit, to: TrackingUnit): boolean {
  return from === to || (from in unitFactors && to in unitFactors && (from === "g" || from === "kg") === (to === "g" || to === "kg") && (from === "ml" || from === "l") === (to === "ml" || to === "l"));
}
export function convertQuantity(quantity: number, from: TrackingUnit, to: TrackingUnit): number {
  if (!areUnitsCompatible(from, to)) throw new Error("incompatible tracking units");
  if (from === to) return quantity;
  return quantity * (unitFactors[from] ?? 1) / (unitFactors[to] ?? 1);
}

export function orderBatchesForConsumption(batches: readonly StockBatch[], policy: StockTarget["consumptionPolicy"]): StockBatch[] {
  return [...batches].sort((a, b) => {
    if (policy === "earliest_expiry_first") {
      if (a.expiryOn === null && b.expiryOn !== null) return 1;
      if (a.expiryOn !== null && b.expiryOn === null) return -1;
      if (a.expiryOn !== b.expiryOn) return (a.expiryOn ?? "9999-12-31").localeCompare(b.expiryOn ?? "9999-12-31");
    }
    return a.acquiredOn.localeCompare(b.acquiredOn) || a.id.localeCompare(b.id);
  });
}

export interface ConsumptionPlanLine {
  batchId: string;
  quantity: number;
  unit: TrackingUnit;
}

export function planConsumption(
  target: StockTarget,
  batches: readonly StockBatch[],
  allocations: readonly StockAllocation[],
  requestedQuantity: number,
  selectedBatchIds?: readonly string[]
): ConsumptionPlanLine[] {
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) throw new Error("invalid_consumption_quantity");
  const batchesById = new Map(batches.filter((batch) => batch.status === "available").map((batch) => [batch.id, batch]));
  const activeAllocations = allocations.filter((allocation) => allocation.status === "active" && allocation.stockTargetId === target.id && batchesById.has(allocation.stockBatchId));
  const selected = selectedBatchIds?.length ? activeAllocations.filter((allocation) => selectedBatchIds.includes(allocation.stockBatchId)) : activeAllocations;
  const ordered = selectedBatchIds?.length ? selected.sort((a, b) => (selectedBatchIds.indexOf(a.stockBatchId) - selectedBatchIds.indexOf(b.stockBatchId))) : orderBatchesForConsumption(selected.map((allocation) => batchesById.get(allocation.stockBatchId)!), target.consumptionPolicy).flatMap((batch) => activeAllocations.filter((allocation) => allocation.stockBatchId === batch.id));
  let remaining = requestedQuantity;
  const plan: ConsumptionPlanLine[] = [];
  for (const allocation of ordered) {
    const batch = batchesById.get(allocation.stockBatchId)!;
    const available = Math.min(batch.remainingQuantity, allocation.allocatedQuantity);
    const quantity = Math.min(available, convertQuantity(remaining, target.trackingUnit, allocation.unit));
    if (quantity <= 0) continue;
    plan.push({ batchId: batch.id, quantity, unit: allocation.unit });
    remaining -= convertQuantity(quantity, allocation.unit, target.trackingUnit);
    if (remaining <= 0) break;
  }
  if (remaining > 0) throw new Error("insufficient_stock");
  return plan;
}

export function aggregateAvailableQuantity(
  target: StockTarget,
  batches: readonly StockBatch[],
  allocations: readonly StockAllocation[]
): number {
  const batchesById = new Map(batches.filter((batch) => batch.status === "available").map((batch) => [batch.id, batch]));
  return allocations.filter((allocation) => allocation.status === "active" && allocation.stockTargetId === target.id)
    .reduce((total, allocation) => {
      const batch = batchesById.get(allocation.stockBatchId);
      return batch ? total + convertQuantity(allocation.allocatedQuantity, allocation.unit, target.trackingUnit) : total;
    }, 0);
}

export function canUseHouseholdCapability(context: HouseholdCapabilityContext, capability: HouseholdCapability): boolean {
  if (!context.isMember) return false;
  return capability !== "manage_members" && capability !== "void_history" || context.role === "owner";
}
