import type { ShoppingNeed, StockTarget, TargetPolicy, TrackingUnit } from "./contracts.js";
import {
  normalizeGroupTargetShoppingDistributionMode,
  type GroupTargetShoppingDistributionMode,
  type GroupTargetShoppingMode
} from "../shopping-policy.js";
export type {
  GroupTargetShoppingDistributionMode,
  GroupTargetShoppingMode
} from "../shopping-policy.js";
import type { StockTargetAggregate } from "./domain.js";
import type {
  ProductGroupNode,
  ProductGroupWorkspaceReadModel,
  ProductStockAggregate
} from "./product-group-read-model.js";

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
  distributionMode?: GroupTargetShoppingDistributionMode;
  mode: GroupTargetShoppingMode;
  needIdPrefix: string;
  selectedOwnerIds?: ReadonlySet<string> | null;
  workspace: ProductGroupWorkspaceReadModel;
}): ShoppingNeed[] {
  const rows = allProductRows(input.workspace);
  const needs: ShoppingNeed[] = [];
  const productNeeds = new Map<string, ShoppingNeed>();
  const hasExplicitSelection =
    input.selectedOwnerIds !== undefined && input.selectedOwnerIds !== null;

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

  for (const group of allGroups(input.workspace.productGroups)) {
    const policy = group.group.targetPolicy;
    const groupMode = resolveGroupTargetShoppingMode(group, input.mode);
    if (!policy || groupMode === "ignore_group_targets") continue;
    if (group.aggregate.availableQuantity >= policy.minimumQuantity) continue;
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

    const distributionMode = resolveGroupTargetShoppingDistributionMode(
      group,
      input.distributionMode ?? "split_evenly"
    );
    const representedByProduct = applyGroupShortageToProducts({
      distributionMode,
      groupPolicy: policy,
      needIdPrefix: input.needIdPrefix,
      needs,
      productNeeds,
      quantity: groupShortage,
      rows: productRows
    });
    if (!representedByProduct && groupMode === "add_products_and_group_item") {
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

  if (hasExplicitSelection) {
    const selectedOwnerIds = input.selectedOwnerIds!;
    const selectedGroupProductIds = new Set(
      allGroups(input.workspace.productGroups)
        .filter((group) => selectedOwnerIds.has(group.group.id))
        .flatMap((group) => group.products.map((row) => row.product.id))
    );
    const selectedNeeds = needs.filter(
      (need) =>
        typeof need.ownerId === "string" &&
        (selectedOwnerIds.has(need.ownerId) ||
          (need.ownerKind === "household_product" && selectedGroupProductIds.has(need.ownerId)))
    );
    needs.splice(0, needs.length, ...selectedNeeds);
  }

  if (hasExplicitSelection && input.selectedOwnerIds!.size) {
    const selectedOwnerIds = input.selectedOwnerIds!;
    for (const row of rows) {
      if (!selectedOwnerIds.has(row.product.id) || productNeeds.has(row.product.id)) continue;
      const policy = row.product.targetPolicy;
      const unit = policy?.trackingUnit ?? row.aggregate.trackingUnit ?? "count";
      const plannedQuantity = policy
        ? Math.max(1, policy.desiredQuantity - row.aggregate.availableQuantity)
        : 1;
      const need = createTargetPolicyNeed({
        displayName: row.product.displayName,
        id: row.product.id,
        needId: `${input.needIdPrefix}:product:${row.product.id}`,
        plannedQuantity,
        policy: policy ?? {
          consumptionPolicy: "earliest_expiry_first",
          desiredQuantity: plannedQuantity,
          expiryWarningDays: 0,
          minimumQuantity: 0,
          trackingUnit: unit
        }
      });
      productNeeds.set(row.product.id, need);
      needs.push(need);
    }
    for (const group of allGroups(input.workspace.productGroups)) {
      if (
        !selectedOwnerIds.has(group.group.id) ||
        needs.some((need) => need.ownerId === group.group.id)
      )
        continue;
      const policy = group.group.targetPolicy;
      const productRows = uniqueProductRows(group.products);
      const groupMode = resolveGroupTargetShoppingMode(group, input.mode);
      // A selected Group is represented by its Product needs when available; never append a
      // second Group line beside those Product needs.
      if (groupMode !== "add_products_and_group_item" || hasProductNeedForGroup(needs, productRows))
        continue;
      needs.push(
        createGroupShoppingNeed({
          displayName: group.group.displayName,
          groupId: group.group.id,
          needId: `${input.needIdPrefix}:group:${group.group.id}`,
          plannedQuantity: policy
            ? Math.max(1, policy.desiredQuantity - group.aggregate.availableQuantity)
            : 1,
          unit: policy?.trackingUnit ?? group.aggregate.trackingUnit ?? group.group.trackingUnit
        })
      );
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

function applyGroupShortageToProducts(input: {
  distributionMode: GroupTargetShoppingDistributionMode;
  groupPolicy: TargetPolicy;
  needIdPrefix: string;
  needs: ShoppingNeed[];
  productNeeds: Map<string, ShoppingNeed>;
  quantity: number;
  rows: readonly ProductGroupNode["products"][number][];
}): boolean {
  if (input.rows.length === 0 || input.distributionMode === "dont_split") return false;
  if (input.distributionMode === "split_evenly") {
    const additions = splitQuantityEvenly(
      input.quantity,
      input.groupPolicy.desiredQuantity,
      input.rows.length
    );
    for (const [index, row] of input.rows.entries()) {
      addProductNeed(
        row,
        input.groupPolicy,
        input.needIdPrefix,
        additions[index]!,
        input.needs,
        input.productNeeds
      );
    }
    return true;
  }

  const selected = selectGroupProduct(input.rows, input.distributionMode);
  if (!selected) return false;
  addProductNeed(
    selected,
    input.groupPolicy,
    input.needIdPrefix,
    input.quantity,
    input.needs,
    input.productNeeds
  );
  return true;
}

function splitQuantityEvenly(total: number, targetQuantity: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [total];

  const precision = decimalPlaces(targetQuantity) + 1;
  const factor = 10 ** precision;
  const roundedDownShare =
    Math.floor((total / count) * factor + Number.EPSILON * Math.max(1, Math.abs(total * factor))) /
    factor;
  const allocations = Array.from({ length: count }, () => roundedDownShare);
  const correction = total - roundedDownShare * count;
  allocations[0] = normalizeQuantity(allocations[0]! + correction);
  return allocations;
}

function decimalPlaces(value: number): number {
  const [coefficient, exponentText] = value.toString().toLowerCase().split("e");
  const fractionLength = coefficient?.split(".")[1]?.length ?? 0;
  const exponent = exponentText ? Number(exponentText) : 0;
  return Math.max(0, fractionLength - exponent);
}

function normalizeQuantity(value: number): number {
  return Number(value.toFixed(12));
}

function hasProductNeedForGroup(
  needs: readonly ShoppingNeed[],
  productRows: readonly ProductGroupNode["products"][number][]
): boolean {
  const productIds = new Set(productRows.map((row) => row.product.id));
  return needs.some(
    (need) => need.ownerKind === "household_product" && need.ownerId && productIds.has(need.ownerId)
  );
}

function addProductNeed(
  row: ProductGroupNode["products"][number],
  groupPolicy: TargetPolicy,
  needIdPrefix: string,
  quantity: number,
  needs: ShoppingNeed[],
  productNeeds: Map<string, ShoppingNeed>
): void {
  const existing = productNeeds.get(row.product.id);
  if (existing) {
    const updated = { ...existing, plannedQuantity: existing.plannedQuantity + quantity };
    productNeeds.set(row.product.id, updated);
    const needIndex = needs.findIndex((candidate) => candidate.id === existing.id);
    if (needIndex >= 0) needs[needIndex] = updated;
    return;
  }
  const need = createTargetPolicyNeed({
    displayName: row.product.displayName,
    id: row.product.id,
    needId: `${needIdPrefix}:product:${row.product.id}`,
    plannedQuantity: quantity,
    policy: row.product.targetPolicy ?? {
      consumptionPolicy: groupPolicy.consumptionPolicy,
      desiredQuantity: quantity,
      expiryWarningDays: groupPolicy.expiryWarningDays,
      minimumQuantity: 0,
      trackingUnit: groupPolicy.trackingUnit
    }
  });
  productNeeds.set(row.product.id, need);
  needs.push(need);
}

function selectGroupProduct(
  rows: readonly ProductGroupNode["products"][number][],
  distributionMode: Exclude<GroupTargetShoppingDistributionMode, "dont_split" | "split_evenly">
): ProductGroupNode["products"][number] | null {
  const byName = (
    left: ProductGroupNode["products"][number],
    right: ProductGroupNode["products"][number]
  ): number =>
    left.product.displayName.localeCompare(right.product.displayName, "hu-HU") ||
    left.product.id.localeCompare(right.product.id);
  if (distributionMode === "least_amount") {
    return (
      [...rows].sort(
        (left, right) =>
          left.aggregate.availableQuantity - right.aggregate.availableQuantity ||
          byName(left, right)
      )[0] ?? null
    );
  }
  const stockDate = (row: ProductGroupNode["products"][number]): string | null => {
    const dates = row.batches
      .filter((batch) => batch.status === "available")
      .map((batch) => batch.acquiredOn)
      .sort();
    return distributionMode === "latest" ? (dates.at(-1) ?? null) : (dates[0] ?? null);
  };
  const stockedRows = [...rows].filter((row) => stockDate(row) !== null);
  if (stockedRows.length > 0) {
    return (
      stockedRows.sort((left, right) => {
        const leftDate = stockDate(left)!;
        const rightDate = stockDate(right)!;
        return (
          (distributionMode === "latest"
            ? rightDate.localeCompare(leftDate)
            : leftDate.localeCompare(rightDate)) || byName(left, right)
        );
      })[0] ?? null
    );
  }
  return [...rows].sort(byName)[0] ?? null;
}

function resolveGroupTargetShoppingMode(
  group: ProductGroupNode,
  householdMode: GroupTargetShoppingMode
): GroupTargetShoppingMode {
  const override = group.group.groupTargetShoppingModeOverride;
  return override && override !== "default" ? override : householdMode;
}

function resolveGroupTargetShoppingDistributionMode(
  group: ProductGroupNode,
  householdMode: GroupTargetShoppingDistributionMode
): GroupTargetShoppingDistributionMode {
  const override = group.group.groupTargetShoppingDistributionModeOverride;
  return override && override !== "default"
    ? override
    : normalizeGroupTargetShoppingDistributionMode(householdMode);
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
