import { Injectable, inject } from "@angular/core";
import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";

export interface HouseholdV2Product { directConcepts?: Array<{ key: string; scope: "catalog" | "household" }>; displayName: string; id: string; identityKind: "manual" | "catalogue"; identitySnapshot?: Record<string, unknown>; revision: number; }
export interface HouseholdV2Batch { acquiredOn: string; acquisitionSnapshot: { displayName: string }; expiryOn?: string | null; householdProductId?: string | null; id: string; remainingQuantity: number; revision: number; unit: string; }
export interface HouseholdV2TargetGroup { aggregate: { availableQuantity: number; batchCount: number; status: string }; batches: HouseholdV2Batch[]; products: HouseholdV2Product[]; target: { displayName: string; id: string; minimumQuantity: number; revision: number; targetQuantity: number; trackingUnit: string }; }
export interface HouseholdV2Workspace { allowExpiredItems: boolean; products: HouseholdV2Product[]; targets: HouseholdV2TargetGroup[]; unassignedBatches: HouseholdV2Batch[]; unassignedProducts: HouseholdV2Product[]; }

@Injectable({ providedIn: "root" })
export class HouseholdV2Service {
  private readonly auth = inject(AuthService);
  private headers(): HeadersInit { return { accept: "application/json", "content-type": "application/json", ...this.auth.getAuthorizationHeaders() }; }
  async loadWorkspace(householdId: string): Promise<{ message?: string; status: "error" | "ok"; workspace?: HouseholdV2Workspace }> {
    if (!this.auth.token()) return { message: "Sign in before loading household stock.", status: "error" };
    const response = await fetch(buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/stock-workspace`), { headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() }, method: "GET" });
    if (!response.ok) return { message: `Household workspace could not be loaded (${response.status}).`, status: "error" };
    const payload = await response.json() as { workspace: HouseholdV2Workspace };
    return { status: "ok", workspace: payload.workspace };
  }

  async updateProductIdentity(input: { displayName: string; householdId: string; productId: string; expectedRevision: number }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("PATCH", `/api/households/${encodeURIComponent(input.householdId)}/products/${input.productId}`, { displayName: input.displayName, expectedRevision: input.expectedRevision });
  }
  async createProduct(input: { displayName: string; householdId: string }): Promise<{ message?: string; product?: HouseholdV2Product; status: "error" | "ok" }> {
    const response = await fetch(buildApiUrl(`/api/households/${encodeURIComponent(input.householdId)}/products`), { body: JSON.stringify({ displayName: input.displayName, identityKind: "manual" }), headers: this.headers(), method: "POST" });
    if (!response.ok) return { message: `Product creation failed (${response.status}).`, status: "error" };
    const payload = await response.json() as { product: HouseholdV2Product };
    return { product: payload.product, status: "ok" };
  }
  async createBatch(input: { acquiredOn: string; displayName: string; expiryOn?: string | null; householdId: string; householdProductId: string; quantity: number; unit: string }): Promise<{ message?: string; status: "error" | "ok" }> {
    return await this.write("POST", `/api/households/${encodeURIComponent(input.householdId)}/batches`, { acquiredOn: input.acquiredOn, displayName: input.displayName, expiryOn: input.expiryOn ?? null, householdProductId: input.householdProductId, operationId: crypto.randomUUID(), originalQuantity: input.quantity, requestFingerprint: crypto.randomUUID(), unit: input.unit });
  }
  async updateStockTarget(input: { displayName: string; expectedRevision: number; householdId: string; minimumQuantity: number; targetId: string; targetQuantity: number; trackingUnit: string }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("PATCH", `/api/households/${encodeURIComponent(input.householdId)}/stock-targets/${input.targetId}`, { expectedRevision: input.expectedRevision, patch: { displayName: input.displayName, minimumQuantity: input.minimumQuantity, targetQuantity: input.targetQuantity, trackingUnit: input.trackingUnit } });
  }
  async createStockTarget(input: { displayName: string; householdId: string; minimumQuantity: number; targetQuantity: number; trackingUnit: string }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("POST", `/api/households/${encodeURIComponent(input.householdId)}/stock-targets`, { acceptanceCriteria: { acceptedAttributesAny: [], acceptedConceptsAny: [], excludedAttributesAny: [], requiredAttributesAll: [], requiredConceptsAll: [] }, consumptionPolicy: "earliest_expiry_first", displayName: input.displayName, expiryWarningDays: 0, minimumQuantity: input.minimumQuantity, targetQuantity: input.targetQuantity, trackingUnit: input.trackingUnit });
  }
  async updateHouseholdSettings(input: { allowExpiredItems?: boolean; defaultCalculatedMaxLimitMultiplier?: number; householdId: string; name?: string }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("PATCH", `/api/households/${encodeURIComponent(input.householdId)}/settings`, input);
  }

  async correctBatch(input: { acquiredOn?: string; batchId: string; expiryOn?: string | null; householdId: string; expectedBatchRevision: number; resultingQuantity: number }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("POST", `/api/households/${encodeURIComponent(input.householdId)}/batches/${encodeURIComponent(input.batchId)}/correct`, { acquiredOn: input.acquiredOn, expiryOn: input.expiryOn, expectedBatchRevision: input.expectedBatchRevision, operationId: crypto.randomUUID(), requestFingerprint: crypto.randomUUID(), resultingQuantity: input.resultingQuantity });
  }

  async discardBatch(input: { batchId: string; householdId: string; expectedBatchRevision: number }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("POST", `/api/households/${encodeURIComponent(input.householdId)}/batches/${encodeURIComponent(input.batchId)}/discard`, { expectedBatchRevision: input.expectedBatchRevision, operationId: crypto.randomUUID(), requestFingerprint: crypto.randomUUID() });
  }

  private async write(method: "PATCH" | "POST", path: string, body: Record<string, unknown>): Promise<{ status: "error" | "ok"; message?: string }> {
    const response = await fetch(buildApiUrl(path), { body: JSON.stringify(body), headers: this.headers(), method });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      const message = payload?.error === "household_membership_required"
        ? "Only an active household member can update this household."
        : payload?.error === "household_owner_required"
          ? "Only the household owner can update household settings."
        : payload?.error === "household_product_not_found" || payload?.error === "stock_target_not_found"
            ? "This item no longer exists. Refresh and try again."
            : payload?.error === "household_concept_already_exists"
              ? "A household concept with this name already exists."
            : `Household update failed (${response.status}).`;
      return { message, status: "error" };
    }
    return { status: "ok" };
  }
}
