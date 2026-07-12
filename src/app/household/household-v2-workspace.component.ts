import { Component, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HouseholdV2Service, type HouseholdV2Product, type HouseholdV2Workspace } from "./household-v2.service";

@Component({ selector: "app-household-v2-workspace", standalone: true, imports: [FormsModule], templateUrl: "./household-v2-workspace.component.html", styleUrl: "./household-v2-workspace.component.css" })
export class HouseholdV2WorkspaceComponent {
  readonly householdId = input("");
  readonly refreshRevision = input(0);
  readonly productSelected = output<HouseholdV2Product>();
  readonly newBatchRequested = output<HouseholdV2Product>();
  readonly newProductRequested = output<void>();
  readonly workspace = signal<HouseholdV2Workspace | null>(null);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly editingTargetId = signal<string | null>(null);
  readonly editingBatchId = signal<string | null>(null);
  readonly addingConcept = signal(false);
  readonly expandedTargetIds = signal<ReadonlySet<string>>(new Set());
  targetDraft = { displayName: "", minimumQuantity: 0, targetQuantity: 0, trackingUnit: "count" };
  conceptLabel = "";
  private readonly service = inject(HouseholdV2Service);
  constructor() { effect(() => { const householdId = this.householdId(); this.refreshRevision(); if (householdId) void this.load(householdId); }); }
  async refresh(): Promise<void> { const householdId = this.householdId(); if (householdId) await this.load(householdId); }
  private async load(householdId: string): Promise<void> {
    this.loadState.set("loading"); this.errorMessage.set("");
    const result = await this.service.loadWorkspace(householdId);
    if (result.status === "error") { this.loadState.set("error"); this.errorMessage.set(result.message ?? "The household workspace could not be loaded."); return; }
    this.workspace.set(result.workspace ?? null); this.loadState.set("ready");
  }
  toggleTarget(targetId: string): void { this.expandedTargetIds.update((ids) => { const next = new Set(ids); if (next.has(targetId)) next.delete(targetId); else next.add(targetId); return next; }); }
  isTargetExpanded(targetId: string): boolean { return this.expandedTargetIds().has(targetId); }
  editTarget(target: { displayName: string; id: string; minimumQuantity: number; targetQuantity: number; trackingUnit: string }): void { this.editingTargetId.set(target.id); this.targetDraft = { displayName: target.displayName, minimumQuantity: target.minimumQuantity, targetQuantity: target.targetQuantity, trackingUnit: target.trackingUnit }; }
  cancelTargetEdit(): void { this.editingTargetId.set(null); }
  async saveTarget(target: { id: string; revision: number }): Promise<void> {
    const draft = this.targetDraft;
    if (!draft.displayName.trim() || !Number.isFinite(draft.minimumQuantity) || !Number.isFinite(draft.targetQuantity) || draft.minimumQuantity < 0 || draft.targetQuantity < draft.minimumQuantity || !draft.trackingUnit.trim()) { this.errorMessage.set("Target name, unit, and limits are invalid."); return; }
    const result = await this.service.updateStockTarget({ displayName: draft.displayName.trim(), expectedRevision: target.revision, householdId: this.householdId(), minimumQuantity: draft.minimumQuantity, targetId: target.id, targetQuantity: draft.targetQuantity, trackingUnit: draft.trackingUnit.trim() });
    if (result.status === "error") { this.errorMessage.set(result.message ?? "Stock Target could not be updated."); return; }
    this.editingTargetId.set(null); await this.refresh();
  }
  editBatch(batchId: string): void { this.editingBatchId.set(batchId); }
  cancelBatchEdit(): void { this.editingBatchId.set(null); }
  productQuantity(group: HouseholdV2Workspace["targets"][number], productId: string): number { return group.batches.filter((batch) => batch.householdProductId === productId).reduce((total, batch) => total + batch.remainingQuantity, 0); }
  stateLabel(state: string): string { return state.replaceAll("_", " "); }
  async correctBatch(batch: { acquiredOn: string; expiryOn?: string | null; id: string; revision: number }, resultingQuantity: number, acquiredOn: string, expiryOn: string): Promise<void> {
    const result = await this.service.correctBatch({ acquiredOn, batchId: batch.id, expiryOn: expiryOn || null, expectedBatchRevision: batch.revision, householdId: this.householdId(), resultingQuantity });
    if (result.status === "error") { this.errorMessage.set(result.message ?? "Batch could not be corrected."); return; }
    await this.refresh();
  }
  async discardBatch(batch: { id: string; revision: number }): Promise<void> {
    if (!window.confirm("Discard this batch?")) return;
    const result = await this.service.discardBatch({ batchId: batch.id, expectedBatchRevision: batch.revision, householdId: this.householdId() });
    if (result.status === "error") { this.errorMessage.set(result.message ?? "Batch could not be discarded."); return; }
    await this.refresh();
  }
  async addConcept(): Promise<void> {
    const label = this.conceptLabel.trim();
    if (!label) { this.errorMessage.set("Concept name is required."); return; }
    const result = await this.service.createConcept(this.householdId(), label);
    if (result.status === "error") { this.errorMessage.set(result.message ?? "Concept could not be created."); return; }
    this.conceptLabel = "";
    this.addingConcept.set(false);
    this.newProductRequested.emit();
  }
}
