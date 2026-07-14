import { Injectable, inject } from "@angular/core";
import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";
import { isRecord, isRecordArray } from "../shared/api-response-guards";

export interface HouseholdV2TargetPolicy {
  consumptionPolicy: "earliest_expiry_first" | "oldest_acquired_first";
  desiredQuantity: number;
  expiryWarningDays: number;
  minimumQuantity: number;
  trackingUnit: string;
}
export interface HouseholdV2Product {
  catalogProductId?: string | null;
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
  acquisitionSnapshot: { displayName: string; sourceName?: string | null };
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
  state:
    "below_minimum" | "at_target" | "above_target" | "between_minimum_and_target" | "not_tracked";
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
    groupTargetShoppingDistributionModeOverride?:
      "default" | "dont_split" | "split_evenly" | "least_amount" | "latest" | "oldest" | null;
    groupTargetShoppingModeOverride?:
      | "default"
      | "add_products_and_group_item"
      | "add_products_only"
      | "ignore_group_targets"
      | null;
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
  defaultCalculatedMaxLimitMultiplier?: number;
  groupTargetShoppingDistributionMode?:
    "dont_split" | "split_evenly" | "least_amount" | "latest" | "oldest";
  groupTargetShoppingMode?:
    "add_products_and_group_item" | "add_products_only" | "ignore_group_targets";
  productGroups: HouseholdV2ProductGroup[];
  unassignedBatches: HouseholdV2Batch[];
  unassignedProducts: HouseholdV2ProductRow[];
  useAbbreviatedUiLabels?: boolean;
}
export interface HouseholdShoppingTripItem {
  actualQuantity?: number | null;
  actualUnit?: string | null;
  actualPaidPrice?: number | null;
  actualCurrencyCode?: string | null;
  actualAcquiredOn?: string | null;
  actualExpiryOn?: string | null;
  createdBatchIds?: string[];
  displayNameSnapshot: string;
  expectedPackageCount?: number | null;
  expectedTotal?: number | null;
  id: string;
  matchExplanation?: string | null;
  matchOptionsTruncated?: boolean;
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
  purchaseHouseholdProductId?: string | null;
  selectedProductId?: string | null;
  selectedShopProductId?: string | null;
}
export interface HouseholdShoppingTrip {
  id: string;
  items: HouseholdShoppingTripItem[];
  plannedDate: string;
  revision: number;
  shopMarketId: string | null;
  shopNameSnapshot?: string | null;
  status: string;
}
export interface HouseholdV2ShopMarket {
  countryCode: string;
  currencyCode: string;
  displayName: string;
  id: string;
  status: "active" | "archived";
}

@Injectable({ providedIn: "root" })
export class HouseholdV2Service {
  private readonly auth = inject(AuthService);
  private readonly loc = inject(LocalizationService);
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
    try {
      const response = await fetch(
        buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/stock-workspace`),
        {
          headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() },
          method: "GET"
        }
      );
      if (!response.ok)
        return {
          message: await this.readError(response, "household.workspaceLoadFailure"),
          status: "error"
        };
      const payload = (await response.json().catch(() => null)) as unknown;
      const workspace =
        isRecord(payload) && (payload["productGroupWorkspace"] ?? payload["workspace"]);
      return isHouseholdV2Workspace(workspace)
        ? { status: "ok", workspace }
        : { message: this.loc.t("household.workspaceLoadFailure"), status: "error" };
    } catch {
      return { message: this.loc.t("household.workspaceLoadFailure"), status: "error" };
    }
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
        message: await this.readError(response, "household.shoppingTripLoadFailure"),
        status: "error",
        trips: []
      };
    const payload = (await response.json().catch(() => null)) as unknown;
    return isRecord(payload) && isShoppingTripArray(payload["trips"])
      ? { status: "ok", trips: payload["trips"] }
      : {
          message: this.loc.t("household.shoppingTripLoadFailure"),
          status: "error",
          trips: []
        };
  }

  async createShoppingTrip(input: {
    householdId: string;
    plannedDate: string;
    shopMarketId: string | null;
    shopNameSnapshot?: string | null;
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
      return {
        message: await this.readError(response, "household.shoppingTripCreateFailure"),
        status: "error"
      };
    const payload = (await response.json().catch(() => null)) as unknown;
    return isRecord(payload) && isShoppingTrip(payload["result"])
      ? { status: "ok", trip: payload["result"] }
      : { message: this.loc.t("household.shoppingTripCreateFailure"), status: "error" };
  }

  async listShopMarkets(
    householdId: string
  ): Promise<{ markets: HouseholdV2ShopMarket[]; message?: string; status: "error" | "ok" }> {
    const response = await fetch(
      buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/shop-markets`),
      {
        headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() },
        method: "GET"
      }
    );
    if (!response.ok)
      return {
        markets: [],
        message: await this.readError(response, "household.shoppingTripLoadFailure"),
        status: "error"
      };
    const payload = (await response.json().catch(() => null)) as unknown;
    return isRecord(payload) && isRecordArray(payload["markets"])
      ? {
          markets: payload["markets"] as unknown as HouseholdV2ShopMarket[],
          status: "ok"
        }
      : {
          markets: [],
          message: this.loc.t("household.shoppingTripLoadFailure"),
          status: "error"
        };
  }

  async updateShoppingTrip(input: {
    householdId: string;
    tripId: string;
    expectedRevision: number;
    itemId?: string;
    selectedShopProductId?: string;
    householdProductId?: string | null;
    resultStatus?: "bought" | "not_bought";
    actualQuantity?: number;
    actualUnit?: string | null;
    actualPaidPrice?: number | null;
    actualCurrencyCode?: string | null;
    actualAcquiredOn?: string | null;
    actualExpiryOn?: string | null;
    planStatus?: "selected" | "skipped";
    transition?: string;
    unplannedPurchase?: {
      displayName: string;
      id: string;
      quantity: number;
      unit: string;
    };
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
          householdProductId: input.householdProductId,
          resultStatus: input.resultStatus,
          actualQuantity: input.actualQuantity,
          actualUnit: input.actualUnit,
          actualPaidPrice: input.actualPaidPrice,
          actualCurrencyCode: input.actualCurrencyCode,
          acquiredOn: input.actualAcquiredOn,
          expiryOn: input.actualExpiryOn,
          planStatus: input.planStatus,
          transition: input.transition,
          unplannedPurchase: input.unplannedPurchase
        }),
        headers: this.headers(),
        method: "PATCH"
      }
    );
    if (!response.ok)
      return {
        message: await this.readError(response, "household.shoppingTripUpdateFailure"),
        status: "error"
      };
    const payload = (await response.json().catch(() => null)) as unknown;
    return isRecord(payload) && isShoppingTrip(payload["result"])
      ? { status: "ok", trip: payload["result"] }
      : { message: this.loc.t("household.shoppingTripUpdateFailure"), status: "error" };
  }

  async completeShoppingTrip(input: {
    householdId: string;
    tripId: string;
    operationId: string;
    items: Array<{
      householdProductId?: string | null;
      itemId: string;
      resultStatus: "bought" | "not_bought";
      actualQuantity?: number;
      actualUnit?: string | null;
      actualPaidPrice?: number | null;
      actualCurrencyCode?: string | null;
      acquiredOn?: string | null;
      expiryOn?: string | null;
      shopProductId?: string | null;
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
        message: await this.readError(response, "household.shoppingTripCompleteFailure"),
        status: "error"
      };
    const payload = (await response.json().catch(() => null)) as unknown;
    return isRecord(payload) && isShoppingTrip(payload["result"])
      ? { status: "ok", trip: payload["result"] }
      : { message: this.loc.t("household.shoppingTripCompleteFailure"), status: "error" };
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
    const payload = (await response.json().catch(() => null)) as unknown;
    return isRecord(payload) && isRecordArray(payload["productGroups"])
      ? {
          productGroups: payload["productGroups"] as HouseholdV2ProductGroup["group"][],
          status: "ok"
        }
      : { message: `Product Groups could not be loaded (${response.status}).`, status: "error" };
  }
  async createProductGroup(input: {
    displayName: string;
    groupTargetShoppingDistributionModeOverride?: HouseholdV2ProductGroup["group"]["groupTargetShoppingDistributionModeOverride"];
    groupTargetShoppingModeOverride?: HouseholdV2ProductGroup["group"]["groupTargetShoppingModeOverride"];
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
    groupTargetShoppingDistributionModeOverride?: HouseholdV2ProductGroup["group"]["groupTargetShoppingDistributionModeOverride"];
    groupTargetShoppingModeOverride?: HouseholdV2ProductGroup["group"]["groupTargetShoppingModeOverride"];
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
        groupTargetShoppingDistributionModeOverride:
          input.groupTargetShoppingDistributionModeOverride,
        groupTargetShoppingModeOverride: input.groupTargetShoppingModeOverride,
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
    groupTargetShoppingDistributionMode?:
      "dont_split" | "split_evenly" | "least_amount" | "latest" | "oldest";
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

  async resetHouseholdContent(input: {
    householdId: string;
    scope:
      | "shopping_list"
      | "batches"
      | "products_and_batches"
      | "groups_products_and_batches"
      | "all_household_data"
      | "delete_household";
  }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write(
      "POST",
      `/api/households/${encodeURIComponent(input.householdId)}/reset`,
      { scope: input.scope }
    );
  }

  async correctBatch(input: {
    acquiredOn?: string;
    batchId: string;
    expiryOn?: string | null;
    householdId: string;
    expectedBatchRevision: number;
    resultingQuantity: number;
    unit: string;
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
        resultingQuantity: input.resultingQuantity,
        unit: input.unit
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
    try {
      const response = await fetch(buildApiUrl(path), {
        body: JSON.stringify(body),
        headers: this.headers(),
        method
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        const message =
          payload?.error === "stale_revision"
            ? this.loc.t("household.staleWriteFailure")
            : payload?.error === "household_membership_required"
              ? this.loc.t("household.householdMemberUpdateRequired")
              : payload?.error === "household_owner_required"
                ? this.loc.t("household.householdOwnerUpdateRequired")
                : payload?.error === "household_product_not_found"
                  ? this.loc.t("household.householdProductNotFound")
                  : payload?.error === "product_group_not_found"
                    ? this.loc.t("household.productGroupNotFound")
                    : payload?.error === "household_concept_already_exists"
                      ? this.loc.t("household.householdConceptAlreadyExists")
                      : payload?.error === "shopping_trip_not_found"
                        ? this.loc.t("household.shoppingTripNotFound")
                        : payload?.error === "shopping_need_list_not_found"
                          ? this.loc.t("household.shoppingNeedListNotFound")
                          : payload?.error === "stale_revision"
                            ? this.loc.t("household.shoppingTripConflict")
                            : this.loc.t("household.saveFailure");
        return { message, status: "error" };
      }
      return { status: "ok" };
    } catch {
      return { message: this.loc.t("household.saveFailure"), status: "error" };
    }
  }

  private async readError(response: Response, fallbackKey: TranslationKey): Promise<string> {
    return await readApiErrorMessage(response, this.loc.t(fallbackKey), (key) =>
      this.loc.t(key as TranslationKey)
    );
  }
}

function isHouseholdV2Workspace(value: unknown): value is HouseholdV2Workspace {
  return (
    isRecord(value) &&
    typeof value["allowExpiredItems"] === "boolean" &&
    isRecordArray(value["productGroups"]) &&
    isRecordArray(value["unassignedBatches"]) &&
    isRecordArray(value["unassignedProducts"])
  );
}

function isShoppingTrip(value: unknown): value is HouseholdShoppingTrip {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["plannedDate"] === "string" &&
    typeof value["revision"] === "number" &&
    typeof value["status"] === "string" &&
    isRecordArray(value["items"])
  );
}

function isShoppingTripArray(value: unknown): value is HouseholdShoppingTrip[] {
  return Array.isArray(value) && value.every(isShoppingTrip);
}
