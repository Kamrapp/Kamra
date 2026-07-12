import type { ShoppingNeed, StockTarget, TargetPolicy, TrackingUnit } from "./contracts.js";
import type { StockTargetAggregate } from "./domain.js";
import type {
  ProductGroupNode,
  ProductGroupWorkspaceReadModel,
  ProductStockAggregate
} from "./product-group-read-model.js";

export type GroupTargetShoppingMode =
  "add_products_and_group_item" | "add_products_only" | "ignore_group_targets";

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

export function generateProductGroupShoppingNeeds(input: {
  mode: GroupTargetShoppingMode;
  needIdPrefix: string;
  workspace: ProductGroupWorkspaceReadModel;
}): ShoppingNeed[] {
  const rows = allProductRows(input.workspace);
  const needs: ShoppingNeed[] = [];
  const productNeeds = new Map<string, ShoppingNeed>();

  for (const row of rows) {
    const policy = row.product.targetPolicy;
    if (!policy || row.aggregate.availableQuantity >= policy.minimumQuantity) continue;
    const need = createTargetPolicyNeed({
      displayName: row.product.displayName,
      id: row.product.id,
      needId: `${input.needIdPrefix}:product:${row.product.id}`,
      plannedQuantity: Math.max(0, policy.desiredQuantity - row.aggregate.availableQuantity),
      policy
    });
    productNeeds.set(row.product.id, need);
    needs.push(need);
  }

  if (input.mode !== "ignore_group_targets") {
    for (const group of allGroups(input.workspace.productGroups)) {
      const policy = group.group.targetPolicy;
      if (!policy || group.aggregate.availableQuantity >= policy.minimumQuantity) continue;
      const productRows = uniqueProductRows(group.products);
      const plannedProductQuantity = productRows.reduce(
        (total, row) => total + (productNeeds.get(row.product.id)?.plannedQuantity ?? 0),
        0
      );
      const groupShortage = Math.max(
        0,
        policy.desiredQuantity - group.aggregate.availableQuantity - plannedProductQuantity
      );
      if (groupShortage <= 0) continue;

      const alreadyPlanned = productRows.filter((row) => productNeeds.has(row.product.id));
      if (alreadyPlanned.length > 0) {
        addEvenlyToProductNeeds(alreadyPlanned, productNeeds, needs, groupShortage);
        continue;
      }

      const selectedProduct = selectGroupProduct(productRows);
      if (selectedProduct) {
        const need = createTargetPolicyNeed({
          displayName: selectedProduct.product.displayName,
          id: selectedProduct.product.id,
          needId: `${input.needIdPrefix}:product:${selectedProduct.product.id}`,
          plannedQuantity: groupShortage,
          policy: {
            consumptionPolicy: policy.consumptionPolicy,
            desiredQuantity: groupShortage,
            expiryWarningDays: policy.expiryWarningDays,
            minimumQuantity: 0,
            trackingUnit: policy.trackingUnit
          }
        });
        productNeeds.set(selectedProduct.product.id, need);
        needs.push(need);
      } else if (input.mode === "add_products_and_group_item") {
        needs.push(
          createGroupShoppingNeed({
            displayName: group.group.displayName,
            groupId: group.group.id,
            needId: `${input.needIdPrefix}:group:${group.group.id}`,
            plannedQuantity: groupShortage,
            unit: policy.trackingUnit
          })
        );
      }
    }
  }

  return needs;
}

function createTargetPolicyNeed(input: {
  displayName: string;
  id: string;
  needId: string;
  plannedQuantity: number;
  policy: TargetPolicy;
}): ShoppingNeed {
  return {
    acceptanceCriteriaSnapshot: emptyAcceptanceCriteria(),
    id: input.needId,
    ownerDisplayNameSnapshot: input.displayName,
    ownerId: input.id,
    ownerKind: "household_product",
    plannedQuantity: input.plannedQuantity,
    reasonCode: "below_minimum",
    revision: 0,
    state: "open",
    unit: input.policy.trackingUnit
  };
}

function createGroupShoppingNeed(input: {
  displayName: string;
  groupId: string;
  needId: string;
  plannedQuantity: number;
  unit: TrackingUnit;
}): ShoppingNeed {
  return {
    acceptanceCriteriaSnapshot: emptyAcceptanceCriteria(),
    id: input.needId,
    ownerDisplayNameSnapshot: input.displayName,
    ownerId: input.groupId,
    ownerKind: "product_group",
    plannedQuantity: input.plannedQuantity,
    reasonCode: "below_minimum",
    revision: 0,
    state: "open",
    unit: input.unit
  };
}

function addEvenlyToProductNeeds(
  rows: readonly ProductGroupNode["products"][number][],
  needs: Map<string, ShoppingNeed>,
  orderedNeeds: ShoppingNeed[],
  quantity: number
): void {
  const addition = quantity / rows.length;
  for (const row of rows) {
    const need = needs.get(row.product.id);
    if (need) {
      const updated = { ...need, plannedQuantity: need.plannedQuantity + addition };
      needs.set(row.product.id, updated);
      const index = orderedNeeds.findIndex((candidate) => candidate.id === need.id);
      if (index >= 0) orderedNeeds[index] = updated;
    }
  }
}

function selectGroupProduct(
  rows: readonly ProductGroupNode["products"][number][]
): ProductGroupNode["products"][number] | null {
  return (
    [...rows]
      .sort(
        (left, right) =>
          (left.aggregate.nextExpiryOn ?? "9999-12-31").localeCompare(
            right.aggregate.nextExpiryOn ?? "9999-12-31"
          ) || left.product.displayName.localeCompare(right.product.displayName, "hu-HU")
      )
      .find((row) => row.aggregate.batchCount > 0) ??
    rows[0] ??
    null
  );
}

function allProductRows(
  workspace: ProductGroupWorkspaceReadModel
): ProductGroupNode["products"][number][] {
  return uniqueProductRows([
    ...workspace.productGroups.flatMap((group) => group.products),
    ...workspace.unassignedProducts
  ]);
}

function allGroups(groups: readonly ProductGroupNode[]): ProductGroupNode[] {
  return groups.flatMap((group) => [group, ...allGroups(group.childGroups)]);
}

function uniqueProductRows(
  rows: readonly ProductGroupNode["products"][number][]
): ProductGroupNode["products"][number][] {
  return [...new Map(rows.map((row) => [row.product.id, row])).values()];
}

function emptyAcceptanceCriteria() {
  return {
    acceptedAttributesAny: [],
    acceptedConceptsAny: [],
    excludedAttributesAny: [],
    requiredAttributesAll: [],
    requiredConceptsAll: []
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
