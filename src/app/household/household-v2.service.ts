import { Injectable, inject } from "@angular/core";
import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";

export interface HouseholdV2Product { displayName: string; id: string; identityKind: "manual" | "catalogue"; identitySnapshot?: Record<string, unknown>; revision: number; }
export interface HouseholdV2Batch { acquiredOn: string; acquisitionSnapshot: { displayName: string }; expiryOn?: string | null; householdProductId?: string | null; id: string; remainingQuantity: number; revision: number; unit: string; }
export interface HouseholdV2TargetGroup { aggregate: { availableQuantity: number; batchCount: number; status: string }; batches: HouseholdV2Batch[]; products: HouseholdV2Product[]; target: { displayName: string; id: string; targetQuantity: number; trackingUnit: string }; }
export interface HouseholdV2Workspace { products: HouseholdV2Product[]; targets: HouseholdV2TargetGroup[]; unassignedBatches: HouseholdV2Batch[]; }

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
    return await this.write("PATCH", `/api/households/${encodeURIComponent(input.householdId)}/products/${encodeURIComponent(input.productId)}`, { displayName: input.displayName, expectedRevision: input.expectedRevision });
  }

  async correctBatch(input: { acquiredOn?: string; batchId: string; expiryOn?: string | null; householdId: string; expectedBatchRevision: number; resultingQuantity: number }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("POST", `/api/households/${encodeURIComponent(input.householdId)}/batches/${encodeURIComponent(input.batchId)}/correct`, { acquiredOn: input.acquiredOn, expiryOn: input.expiryOn, expectedBatchRevision: input.expectedBatchRevision, operationId: crypto.randomUUID(), requestFingerprint: crypto.randomUUID(), resultingQuantity: input.resultingQuantity });
  }

  async discardBatch(input: { batchId: string; householdId: string; expectedBatchRevision: number }): Promise<{ status: "error" | "ok"; message?: string }> {
    return await this.write("POST", `/api/households/${encodeURIComponent(input.householdId)}/batches/${encodeURIComponent(input.batchId)}/discard`, { expectedBatchRevision: input.expectedBatchRevision, operationId: crypto.randomUUID(), requestFingerprint: crypto.randomUUID() });
  }

  private async write(method: "PATCH" | "POST", path: string, body: Record<string, unknown>): Promise<{ status: "error" | "ok"; message?: string }> {
    const response = await fetch(buildApiUrl(path), { body: JSON.stringify(body), headers: this.headers(), method });
    if (!response.ok) return { message: `Household update failed (${response.status}).`, status: "error" };
    return { status: "ok" };
  }
}
