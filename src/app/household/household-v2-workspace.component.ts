import { Component, effect, inject, input, output, signal } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableIconButtonComponent } from "../shared/table-icon-button.component";
import { BrowserLoggerService } from "../browser-logger.service";
import { HouseholdV2Service, type HouseholdV2Batch, type HouseholdV2Product, type HouseholdV2ProductGroup, type HouseholdV2Workspace } from "./household-v2.service";

@Component({ selector: "app-household-v2-workspace", standalone: true, imports: [FormsModule, NgTemplateOutlet, TableIconButtonComponent], templateUrl: "./household-v2-workspace.component.html", styleUrl: "./household-v2-workspace.component.css" })
export class HouseholdV2WorkspaceComponent {
  readonly householdId = input("");
  readonly refreshRevision = input(0);
  readonly productSelected = output<HouseholdV2Product>();
  readonly batchSelected = output<{ batch: HouseholdV2Batch; group: HouseholdV2ProductGroup | null; product: HouseholdV2Product }>();
  readonly newBatchRequested = output<HouseholdV2Product>();
  readonly newProductRequested = output<HouseholdV2ProductGroup | null>();
  readonly groupSelected = output<HouseholdV2ProductGroup>();
  readonly workspace = signal<HouseholdV2Workspace | null>(null);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly editingBatchId = signal<string | null>(null);
  readonly expandedGroupIds = signal<ReadonlySet<string>>(new Set());
  readonly groupDetailsIds = signal<ReadonlySet<string>>(new Set());
  readonly productDetailsIds = signal<ReadonlySet<string>>(new Set());
  readonly unassignedExpanded = signal(true);
  private readonly service = inject(HouseholdV2Service);
  private readonly logger = inject(BrowserLoggerService);
  constructor() { effect(() => { const householdId = this.householdId(); this.refreshRevision(); if (householdId) void this.load(householdId); }); }
  async refresh(): Promise<void> { const householdId = this.householdId(); if (householdId) await this.load(householdId); }
  private async load(householdId: string): Promise<void> {
    this.loadState.set("loading"); this.errorMessage.set("");
    const result = await this.service.loadWorkspace(householdId);
    if (result.status === "error") { this.loadState.set("error"); this.errorMessage.set(result.message ?? "The household workspace could not be loaded."); this.logger.log("error", "Household stock workspace load failed", { householdId }); return; }
    this.workspace.set(result.workspace ?? null); this.loadState.set("ready");
  }
  groupRows(): Array<{ depth: number; group: HouseholdV2ProductGroup }> { const rows: Array<{ depth: number; group: HouseholdV2ProductGroup }> = []; const visit = (groups: HouseholdV2ProductGroup[], depth: number): void => { for (const group of groups) { rows.push({ depth, group }); visit(group.childGroups, depth + 1); } }; visit(this.workspace()?.productGroups ?? [], 0); return rows; }
  toggleGroup(groupId: string): void { this.toggleSet(this.expandedGroupIds, groupId); }
  isGroupExpanded(groupId: string): boolean { return this.expandedGroupIds().has(groupId); }
  toggleGroupDetails(groupId: string): void { this.toggleSet(this.groupDetailsIds, groupId); }
  isGroupDetailsOpen(groupId: string): boolean { return this.groupDetailsIds().has(groupId); }
  toggleProductDetails(productId: string): void { this.toggleSet(this.productDetailsIds, productId); }
  isProductDetailsOpen(productId: string): boolean { return this.productDetailsIds().has(productId); }
  selectGroup(group: HouseholdV2ProductGroup): void { this.groupSelected.emit(group); }
  workspaceGroup(groupId: string | null | undefined): HouseholdV2ProductGroup | null {
    if (!groupId) return null;
    const visit = (groups: HouseholdV2ProductGroup[]): HouseholdV2ProductGroup | null => {
      for (const group of groups) { if (group.group.id === groupId) return group; const child = visit(group.childGroups); if (child) return child; }
      return null;
    };
    return visit(this.workspace()?.productGroups ?? []);
  }
  unassignedQuantity(): number { return (this.workspace()?.unassignedProducts ?? []).reduce((total, row) => total + row.aggregate.availableQuantity, 0); }
  editBatch(batchId: string): void { this.editingBatchId.set(batchId); }
  cancelBatchEdit(): void { this.editingBatchId.set(null); }
  stateLabel(state: string): string { return state.replaceAll("_", " "); }
  async correctBatch(batch: { acquiredOn: string; expiryOn?: string | null; id: string; revision: number }, resultingQuantity: number, acquiredOn: string, expiryOn: string): Promise<void> {
    this.logger.log("info", "Correcting stock batch", { batchId: batch.id });
    const result = await this.service.correctBatch({ acquiredOn, batchId: batch.id, expiryOn: expiryOn || null, expectedBatchRevision: batch.revision, householdId: this.householdId(), resultingQuantity });
    if (result.status === "error") { this.errorMessage.set(result.message ?? "Batch could not be corrected."); this.logger.log("error", "Stock batch correction failed", { batchId: batch.id }); return; }
    this.logger.log("info", "Stock batch corrected", { batchId: batch.id }); await this.refresh();
  }
  async discardBatch(batch: { id: string; revision: number }): Promise<void> {
    if (!window.confirm("Discard this batch?")) return;
    this.logger.log("info", "Discarding stock batch", { batchId: batch.id });
    const result = await this.service.discardBatch({ batchId: batch.id, expectedBatchRevision: batch.revision, householdId: this.householdId() });
    if (result.status === "error") { this.errorMessage.set(result.message ?? "Batch could not be discarded."); this.logger.log("error", "Stock batch discard failed", { batchId: batch.id }); return; }
    this.logger.log("info", "Stock batch discarded", { batchId: batch.id }); await this.refresh();
  }
  private toggleSet(target: ReturnType<typeof signal<ReadonlySet<string>>>, id: string): void { target.update((ids) => { const next = new Set(ids); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
}
