import { Injectable, inject } from "@angular/core";
import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";

export interface HouseholdV2Product { displayName: string; id: string; identityKind: "manual" | "catalogue"; }
export interface HouseholdV2Batch { acquiredOn: string; acquisitionSnapshot: { displayName: string }; expiryOn?: string | null; householdProductId?: string | null; id: string; remainingQuantity: number; unit: string; }
export interface HouseholdV2TargetGroup { aggregate: { availableQuantity: number; batchCount: number; status: string }; batches: HouseholdV2Batch[]; products: HouseholdV2Product[]; target: { displayName: string; id: string; targetQuantity: number; trackingUnit: string }; }
export interface HouseholdV2Workspace { products: HouseholdV2Product[]; targets: HouseholdV2TargetGroup[]; unassignedBatches: HouseholdV2Batch[]; }

@Injectable({ providedIn: "root" })
export class HouseholdV2Service {
  private readonly auth = inject(AuthService);
  async loadWorkspace(householdId: string): Promise<{ message?: string; status: "error" | "ok"; workspace?: HouseholdV2Workspace }> {
    if (!this.auth.token()) return { message: "Sign in before loading household stock.", status: "error" };
    const response = await fetch(buildApiUrl(`/api/households/${encodeURIComponent(householdId)}/stock-workspace`), { headers: { accept: "application/json", ...this.auth.getAuthorizationHeaders() }, method: "GET" });
    if (!response.ok) return { message: `Household workspace could not be loaded (${response.status}).`, status: "error" };
    const payload = await response.json() as { workspace: HouseholdV2Workspace };
    return { status: "ok", workspace: payload.workspace };
  }
}
