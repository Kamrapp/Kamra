import { Injectable, inject } from "@angular/core";
import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";

export interface HouseholdV2TargetPolicy {
  consumptionPolicy: "earliest_expiry_first" | "oldest_acquired_first";
  desiredQuantity: number;
  expiryWarningDays: number;
  minimumQuantity: number;
  trackingUnit: string;
}
export interface HouseholdV2Product {
  defaultTrackingUnit?: string | null;
  directConcepts?: Array<{ key: string; scope: "catalog" | "household" }>;
  displayName: string;
  id: string;
  identityKind: "manual" | "catalogue";
  identitySnapshot?: Record<string, unknown>;
  note?: string | null;
  productGroupId?: string | null;
  revision: number;
  targetPolicy?: HouseholdV2TargetPolicy | null;
}
export interface HouseholdV2Batch {
  acquiredOn: string;
  acquisitionSnapshot: { displayName: string };
  expiryOn?: string | null;
  householdProductId?: string | null;
  id: string;
  remainingQuantity: number;
  revision: number;
  unit: string;
}
export interface HouseholdV2Aggregate {
  availableQuantity: number;
  batchCount: number;
  nextExpiryOn: string | null;
  state: "below_minimum" | "at_target" | "between_minimum_and_target" | "not_tracked";
  trackingUnit: string | null;
}
export interface HouseholdV2ProductRow {
  aggregate: HouseholdV2Aggregate;
  batches: HouseholdV2Batch[];
  product: HouseholdV2Product;
}
export interface HouseholdV2ProductGroup {
  aggregate: HouseholdV2Aggregate;
  childGroups: HouseholdV2ProductGroup[];
  group: {
    displayName: string;
    id: string;
    parentProductGroupId?: string | null;
    revision: number;
    targetPolicy?: HouseholdV2TargetPolicy | null;
    trackingUnit: string;
  };
  products: HouseholdV2ProductRow[];
}
export interface HouseholdV2Workspace {
  allowExpiredItems: boolean;
  productGroups: HouseholdV2ProductGroup[];
  unassignedBatches: HouseholdV2Batch[];
  unassignedProducts: HouseholdV2ProductRow[];
  useAbbreviatedUiLabels?: boolean;
}
export interface HouseholdShoppingTripItem {
  actualQuantity?: number | null;
  createdBatchIds?: string[];
  displayNameSnapshot: string;
  expectedPackageCount?: number | null;
  expectedTotal?: number | null;
  id: string;
  matchExplanation?: string | null;
  matchOptions?: Array<{
    displayName: string;
    expectedPackageCount: number;
    expectedTotal: number | null;
    priceState: string;
    selectedPriceObservationId: string | null;
    shopProductId: string;
  }>;
  priceState?: string | null;
  planStatus: "unresolved" | "selected" | "skipped";
  requiredQuantity: number;
  requiredUnit: string;
  resultStatus: "pending" | "bought" | "not_bought";
  selectedShopProductId?: string | null;
}
export interface HouseholdShoppingTrip {
  id: string;
  items: HouseholdShoppingTripItem[];
  plannedDate: string;
  revision: number;
  shopMarketId: string | null;
  status: string;
}

@Injectable({ providedIn: "root" })
export class HouseholdV2Service {
  private readonly auth = inject(AuthService);
  private headers(): HeadersInit {
    return {
      accept: "application/json",
      "content-type": "application/json",
      ...this.auth.getAuthorizationHeaders()
    };
  }
  async loadWorkspace(
    householdId: string
  ): Promise<{ message?: string; status: "error" | "ok"; workspace?: HouseholdV2Workspace }> {
    if (!this.auth.token())
      return { message: "Sign in before loading household stock.", status: "error" };
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/stock-workspace`),
      {
        headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() },
        method: "GET"
      }
    );
    if (!response.ok)
      return {
        message: `Household workspace could not be loaded (${response.status}).`,
        status: "error"
      };
    const payload = (await response.json()) as {
      productGroupWorkspace?: HouseholdV2Workspace;
      workspace?: HouseholdV2Workspace;
    };
    return { status: "ok", workspace: payload.productGroupWorkspace ?? payload.workspace };
  }

  async listShoppingTrips(
    householdId: string
  ): Promise<{ message?: string; status: "error" | "ok"; trips: HouseholdShoppingTrip[] }> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/shopping-trips`),
      {
        headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() },
        method: "GET"
      }
    );
    if (!response.ok)
      return {
        message: `Shopping trips could not be loaded (${response.status}).`,
        status: "error",
        trips: []
      };
    const payload = (await response.json()) as { trips: HouseholdShoppingTrip[] };
    return { status: "ok", trips: payload.trips };
  }

  async createShoppingTrip(input: {
    householdId: string;
    plannedDate: string;
    shopMarketId: string;
  }): Promise<{ message?: string; status: "error" | "ok"; trip?: HouseholdShoppingTrip }> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(input.householdId)}/shopping-trips`),
      {
        body: JSON.stringify(input),
        headers: this.headers(),
        method: "POST"
      }
    );
    if (!response.ok)
      return { message: `Shopping trip creation failed (${response.status}).`, status: "error" };
    const payload = (await response.json()) as { result: HouseholdShoppingTrip };
    return { status: "ok", trip: payload.result };
  }

  async updateShoppingTrip(input: {
    householdId: string;
    tripId: string;
    expectedRevision: number;
    itemId?: string;
    selectedShopProductId?: string;
    resultStatus?: "bought" | "not_bought";
    actualQuantity?: number;
    planStatus?: "selected" | "skipped";
    transition?: string;
  }): Promise<{ message?: string; status: "error" | "ok"; trip?: HouseholdShoppingTrip }> {
    const response = await fetch(
      buildApiUrl(
        `/api/households/${encodeURIComponent(input.householdId)}/shopping-trips/${encodeURIComponent(input.tripId)}`
      ),
      {
        body: JSON.stringify({
          expectedRevision: input.expectedRevision,
          itemId: input.itemId,
          selectedShopProductId: input.selectedShopProductId,
          resultStatus: input.resultStatus,
          planStatus: input.planStatus,
          transition: input.transition
        }),
        headers: this.headers(),
        method: "PATCH"
      }
    );
    if (!response.ok)
      return { message: `Shopping trip update failed (${response.status}).`, status: "error" };
    const payload = (await response.json()) as { result: HouseholdShoppingTrip };
    return { status: "ok", trip: payload.result };
  }

  async completeShoppingTrip(input: {
    householdId: string;
    tripId: string;
    operationId: string;
    items: Array<{
      itemId: string;
      resultStatus: "bought" | "not_bought";
      actualQuantity?: number;
    }>;
  }): Promise<{ message?: string; status: "error" | "ok"; trip?: HouseholdShoppingTrip }> {
    const response = await fetch(
      buildApiUrl(
        `/api/households/${encodeURIComponent(input.householdId)}/shopping-trips/${encodeURIComponent(input.tripId)}/complete`
      ),
      {
        body: JSON.stringify({ operationId: input.operationId, items: input.items }),
        headers: this.headers(),
        method: "POST"
      }
    );
    if (!response.ok)
      return {
        message: `Shopping trip finalization failed (${response.status}).`,
        status: "error"
      };
    const payload = (await response.json()) as { result: HouseholdShoppingTrip };
    return { status: "ok", trip: payload.result };
  }

  async updateProductIdentity(input: {
    catalogProductId?: string | null;
    defaultTrackingUnit?: string | null;
    displayName: string;
    householdId: string;
    identitySnapshot?: Record<string, unknown>;
    note?: string | null;
    productGroupId?: string | null;
    productId: string;
    expectedRevision: number;
    targetPolicy?: HouseholdV2TargetPolicy | null;
  }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write(
      "PATCH",
      `/api/households/${encodeURIComponent(input.householdId)}/products/${encodeURIComponent(input.productId)}`,
      {
        catalogProductId: input.catalogProductId,
        defaultTrackingUnit: input.defaultTrackingUnit,
        displayName: input.displayName,
        expectedRevision: input.expectedRevision,
        identitySnapshot: input.identitySnapshot,
        note: input.note,
        productGroupId: input.productGroupId,
        targetPolicy: input.targetPolicy
      }
    );
  }
  async createProduct(input: {
    defaultTrackingUnit?: string | null;
    displayName: string;
    householdId: string;
    note?: string | null;
    productGroupId?: string | null;
    targetPolicy?: HouseholdV2TargetPolicy | null;
  }): Promise<{ message?: string; product?: HouseholdV2Product; status: "error" | "ok" }> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(input.householdId)}/products`),
      {
        body: JSON.stringify({ ...input, identityKind: "manual" }),
        headers: this.headers(),
        method: "POST"
      }
    );
    if (!response.ok)
      return { message: `Product creation failed (${response.status}).`, status: "error" };
    const payload = (await response.json()) as { product: HouseholdV2Product };
    return { product: payload.product, status: "ok" };
  }
  async loadProductGroups(householdId: string): Promise<{
    message?: string;
    productGroups?: HouseholdV2ProductGroup["group"][];
    status: "error" | "ok";
  }> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/product-groups`),
      {
        headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() },
        method: "GET"
      }
    );
    if (!response.ok)
      return {
        message: `Product Groups could not be loaded (${response.status}).`,
        status: "error"
      };
    const payload = (await response.json()) as {
      productGroups: HouseholdV2ProductGroup["group"][];
    };
    return { productGroups: payload.productGroups, status: "ok" };
  }
  async createProductGroup(input: {
    displayName: string;
    householdId: string;
    targetPolicy?: HouseholdV2TargetPolicy | null;
    trackingUnit: string;
  }): Promise<{
    message?: string;
    productGroup?: HouseholdV2ProductGroup["group"];
    status: "error" | "ok";
  }> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(input.householdId)}/product-groups`),
      { body: JSON.stringify(input), headers: this.headers(), method: "POST" }
    );
    if (!response.ok)
      return { message: `Product Group creation failed (${response.status}).`, status: "error" };
    const payload = (await response.json()) as { productGroup: HouseholdV2ProductGroup["group"] };
    return { productGroup: payload.productGroup, status: "ok" };
  }
  async updateProductGroup(input: {
    displayName: string;
    expectedRevision: number;
    householdId: string;
    groupId: string;
    targetPolicy?: HouseholdV2TargetPolicy | null;
    trackingUnit: string;
  }): Promise<{ message?: string; status: "error" | "ok" }> {
    return await this.write(
      "PATCH",
      `/api/households/${encodeURIComponent(input.householdId)}/product-groups/${encodeURIComponent(input.groupId)}`,
      {
        displayName: input.displayName,
        expectedRevision: input.expectedRevision,
        targetPolicy: input.targetPolicy,
        trackingUnit: input.trackingUnit
      }
    );
  }
  async deleteProductGroup(input: {
    expectedRevision: number;
    groupId: string;
    householdId: string;
  }): Promise<{ message?: string; status: "error" | "ok" }> {
    return await this.write(
      "DELETE",
      `/api/households/${encodeURIComponent(input.householdId)}/product-groups/${encodeURIComponent(input.groupId)}`,
      { expectedRevision: input.expectedRevision }
    );
  }
  async deleteProduct(input: {
    expectedRevision: number;
    householdId: string;
    productId: string;
  }): Promise<{ message?: string; status: "error" | "ok" }> {
    return await this.write(
      "DELETE",
      `/api/households/${encodeURIComponent(input.householdId)}/products/${encodeURIComponent(input.productId)}`,
      { expectedRevision: input.expectedRevision }
    );
  }
  async createBatch(input: {
    acquiredOn: string;
    displayName: string;
    expiryOn?: string | null;
    householdId: string;
    householdProductId: string;
    quantity: number;
    unit: string;
  }): Promise<{ message?: string; status: "error" | "ok" }> {
    return await this.write(
      "POST",
      `/api/households/${encodeURIComponent(input.householdId)}/batches`,
      {
        acquiredOn: input.acquiredOn,
        displayName: input.displayName,
        expiryOn: input.expiryOn ?? null,
        householdProductId: input.householdProductId,
        operationId: crypto.randomUUID(),
        originalQuantity: input.quantity,
        requestFingerprint: crypto.randomUUID(),
        unit: input.unit
      }
    );
  }
  async createProductWithBatch(input: {
    batch: {
      acquiredOn: string;
      displayName: string;
      expiryOn?: string | null;
      originalQuantity: number;
      unit: string;
    };
    group?: {
      displayName: string;
      targetPolicy?: HouseholdV2TargetPolicy | null;
      trackingUnit: string;
    } | null;
    householdId: string;
    product: {
      defaultTrackingUnit?: string | null;
      displayName: string;
      note?: string | null;
      productGroupId?: string | null;
      targetPolicy?: HouseholdV2TargetPolicy | null;
    };
  }): Promise<{ message?: string; status: "error" | "ok" }> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(input.householdId)}/product-composer`),
      {
        body: JSON.stringify({
          ...input,
          operationId: crypto.randomUUID(),
          requestFingerprint: crypto.randomUUID()
        }),
        headers: this.headers(),
        method: "POST"
      }
    );
    if (!response.ok)
      return {
        message: `Product and stock creation failed (${response.status}).`,
        status: "error"
      };
    return { status: "ok" };
  }
  async updateStockTarget(input: {
    displayName: string;
    expectedRevision: number;
    householdId: string;
    minimumQuantity: number;
    targetId: string;
    targetQuantity: number;
    trackingUnit: string;
  }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write(
      "PATCH",
      `/api/households/${encodeURIComponent(input.householdId)}/stock-targets/${input.targetId}`,
      {
        expectedRevision: input.expectedRevision,
        patch: {
          displayName: input.displayName,
          minimumQuantity: input.minimumQuantity,
          targetQuantity: input.targetQuantity,
          trackingUnit: input.trackingUnit
        }
      }
    );
  }
  async createStockTarget(input: {
    displayName: string;
    householdId: string;
    minimumQuantity: number;
    targetQuantity: number;
    trackingUnit: string;
  }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write(
      "POST",
      `/api/households/${encodeURIComponent(input.householdId)}/stock-targets`,
      {
        acceptanceCriteria: {
          acceptedAttributesAny: [],
          acceptedConceptsAny: [],
          excludedAttributesAny: [],
          requiredAttributesAll: [],
          requiredConceptsAll: []
        },
        consumptionPolicy: "earliest_expiry_first",
        displayName: input.displayName,
        expiryWarningDays: 0,
        minimumQuantity: input.minimumQuantity,
        targetQuantity: input.targetQuantity,
        trackingUnit: input.trackingUnit
      }
    );
  }
  async updateHouseholdSettings(input: {
    allowExpiredItems?: boolean;
    defaultCalculatedMaxLimitMultiplier?: number;
    groupTargetShoppingMode?:
      "add_products_and_group_item" | "add_products_only" | "ignore_group_targets";
    householdId: string;
    name?: string;
  }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write(
      "PATCH",
      `/api/households/${encodeURIComponent(input.householdId)}/settings`,
      input
    );
  }

  async correctBatch(input: {
    acquiredOn?: string;
    batchId: string;
    expiryOn?: string | null;
    householdId: string;
    expectedBatchRevision: number;
    resultingQuantity: number;
  }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write(
      "POST",
      `/api/households/${encodeURIComponent(input.householdId)}/batches/${encodeURIComponent(input.batchId)}/correct`,
      {
        acquiredOn: input.acquiredOn,
        expiryOn: input.expiryOn,
        expectedBatchRevision: input.expectedBatchRevision,
        operationId: crypto.randomUUID(),
        requestFingerprint: crypto.randomUUID(),
        resultingQuantity: input.resultingQuantity
      }
    );
  }

  async discardBatch(input: {
    batchId: string;
    householdId: string;
    expectedBatchRevision: number;
  }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write(
      "POST",
      `/api/households/${encodeURIComponent(input.householdId)}/batches/${encodeURIComponent(input.batchId)}/discard`,
      {
        expectedBatchRevision: input.expectedBatchRevision,
        operationId: crypto.randomUUID(),
        requestFingerprint: crypto.randomUUID()
      }
    );
  }

  private async write(
    method: "DELETE" | "PATCH" | "POST",
    path: string,
    body: Record<string, unknown>
  ): Promise<{ status: "error" | "ok"; message?: string }> {
    const response = await fetch(buildApiUrl(path), {
      body: JSON.stringify(body),
      headers: this.headers(),
      method
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      const message =
        payload?.error === "household_membership_required"
          ? "Only an active household member can update this household."
          : payload?.error === "household_owner_required"
            ? "Only the household owner can update household settings."
            : payload?.error === "household_product_not_found"
              ? "The Household Product was not found for this operation. Refresh and try again."
              : payload?.error === "product_group_not_found"
                ? "The Product Group was not found for this operation. Refresh and try again."
                : payload?.error === "stock_target_not_found"
                  ? "The legacy Stock Target was not found for this operation. Refresh and try again."
                  : payload?.error === "household_concept_already_exists"
                    ? "A household concept with this name already exists."
                    : `Household update failed (${response.status}).`;
      return { message, status: "error" };
    }
    return { status: "ok" };
  }
}
