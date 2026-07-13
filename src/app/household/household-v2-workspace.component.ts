import { Component, effect, inject, input, output, signal } from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableIconButtonComponent } from "../shared/table-icon-button.component";
import { LocalizationService } from "../shared/localization.service";
import { BrowserLoggerService } from "../browser-logger.service";
import {
  composeTrackingUnit,
  displayTrackingUnit,
  householdTrackingUnitOptions,
  isCustomTrackingUnit,
  splitTrackingUnit,
  type HouseholdTrackingUnitOption
} from "./household-tracking-units";
import {
  HouseholdV2Service,
  type HouseholdV2Batch,
  type HouseholdV2Product,
  type HouseholdV2ProductGroup,
  type HouseholdV2ProductRow,
  type HouseholdV2Workspace
} from "./household-v2.service";
import { householdDomainIcons } from "./household-domain-icons";

@Component({
  selector: "app-household-v2-workspace",
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, TableIconButtonComponent],
  templateUrl: "./household-v2-workspace.component.html",
  styleUrl: "./household-v2-workspace.component.css"
})
export class HouseholdV2WorkspaceComponent {
  readonly householdId = input("");
  readonly refreshRevision = input(0);
  readonly productSelected = output<HouseholdV2Product>();
  readonly batchSelected = output<{
    batch: HouseholdV2Batch;
    group: HouseholdV2ProductGroup | null;
    product: HouseholdV2Product;
  }>();
  readonly newBatchRequested = output<HouseholdV2Product>();
  readonly newProductRequested = output<HouseholdV2ProductGroup | null>();
  readonly groupSelected = output<HouseholdV2ProductGroup>();
  readonly changed = output<void>();
  readonly workspace = signal<HouseholdV2Workspace | null>(null);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly editingBatchId = signal<string | null>(null);
  readonly editingGroupId = signal<string | null>(null);
  readonly editingProductId = signal<string | null>(null);
  readonly editingGroupName = signal("");
  readonly editingGroupUnitOption = signal<HouseholdTrackingUnitOption>("count");
  readonly editingGroupCustomUnit = signal("");
  readonly editingGroupMinimum = signal(0);
  readonly editingGroupDesired = signal(0);
  readonly editingGroupHasTarget = signal(false);
  readonly editingProductName = signal("");
  readonly editingProductGtin = signal("");
  readonly editingProductNote = signal("");
  readonly editingProductGroupId = signal("");
  readonly expandedGroupIds = signal<ReadonlySet<string>>(new Set());
  readonly expandedProductIds = signal<ReadonlySet<string>>(new Set());
  readonly groupDetailsIds = signal<ReadonlySet<string>>(new Set());
  readonly productDetailsIds = signal<ReadonlySet<string>>(new Set());
  readonly batchDetailsIds = signal<ReadonlySet<string>>(new Set());
  readonly unassignedExpanded = signal(true);
  readonly sectionExpanded = signal(true);
  readonly icons = householdDomainIcons;
  readonly trackingUnitOptions = householdTrackingUnitOptions;
  private readonly service = inject(HouseholdV2Service);
  private readonly logger = inject(BrowserLoggerService);
  readonly loc = inject(LocalizationService);
  constructor() {
    let lastRefreshRevision = this.refreshRevision();
    effect(() => {
      const householdId = this.householdId();
      const refreshRevision = this.refreshRevision();
      if (refreshRevision !== lastRefreshRevision) {
        lastRefreshRevision = refreshRevision;
        this.resetEditingState();
      }
      if (householdId) void this.load(householdId);
    });
  }
  async refresh(): Promise<void> {
    const householdId = this.householdId();
    if (householdId) await this.load(householdId);
  }
  private async load(householdId: string): Promise<void> {
    this.loadState.set("loading");
    this.errorMessage.set("");
    const result = await this.service.loadWorkspace(householdId);
    if (result.status === "error") {
      this.loadState.set("error");
      this.errorMessage.set(result.message ?? this.loc.t("household.workspaceLoadFailure"));
      this.logger.log("error", "Household stock workspace load failed", { householdId });
      return;
    }
    const workspace = result.workspace ?? null;
    if (!this.workspace() && workspace)
      this.expandedGroupIds.set(new Set(this.groupIds(workspace.productGroups)));
    this.workspace.set(workspace);
    this.loadState.set("ready");
  }
  groupRows(): Array<{ depth: number; group: HouseholdV2ProductGroup }> {
    const rows: Array<{ depth: number; group: HouseholdV2ProductGroup }> = [];
    const visit = (groups: HouseholdV2ProductGroup[], depth: number): void => {
      for (const group of groups) {
        rows.push({ depth, group });
        if (this.isGroupExpanded(group.group.id)) visit(group.childGroups, depth + 1);
      }
    };
    visit(this.workspace()?.productGroups ?? [], 0);
    return rows;
  }
  groupHasChildren(group: HouseholdV2ProductGroup): boolean {
    return group.products.length > 0 || group.childGroups.length > 0;
  }
  productHasBatches(product: HouseholdV2ProductRow): boolean {
    return product.batches.length > 0;
  }
  toggleGroup(groupId: string): void {
    this.toggleSet(this.expandedGroupIds, groupId);
  }
  isGroupExpanded(groupId: string): boolean {
    return this.expandedGroupIds().has(groupId);
  }
  toggleGroupDetails(groupId: string): void {
    this.toggleSet(this.groupDetailsIds, groupId);
  }
  isGroupDetailsOpen(groupId: string): boolean {
    return this.groupDetailsIds().has(groupId);
  }
  toggleProduct(productId: string): void {
    this.toggleSet(this.expandedProductIds, productId);
  }
  isProductExpanded(productId: string): boolean {
    return this.expandedProductIds().has(productId);
  }
  toggleProductDetails(productId: string): void {
    this.toggleSet(this.productDetailsIds, productId);
  }
  isProductDetailsOpen(productId: string): boolean {
    return this.productDetailsIds().has(productId);
  }
  toggleBatchDetails(batchId: string): void {
    this.toggleSet(this.batchDetailsIds, batchId);
  }
  isBatchDetailsOpen(batchId: string): boolean {
    return this.batchDetailsIds().has(batchId);
  }
  selectGroup(group: HouseholdV2ProductGroup): void {
    this.groupSelected.emit(group);
  }
  workspaceGroup(groupId: string | null | undefined): HouseholdV2ProductGroup | null {
    if (!groupId) return null;
    const visit = (groups: HouseholdV2ProductGroup[]): HouseholdV2ProductGroup | null => {
      for (const group of groups) {
        if (group.group.id === groupId) return group;
        const child = visit(group.childGroups);
        if (child) return child;
      }
      return null;
    };
    return visit(this.workspace()?.productGroups ?? []);
  }
  editGroup(group: HouseholdV2ProductGroup): void {
    const trackingUnit = splitTrackingUnit(group.group.trackingUnit);
    this.editingGroupName.set(group.group.displayName);
    this.editingGroupUnitOption.set(trackingUnit.option);
    this.editingGroupCustomUnit.set(trackingUnit.customSuffix);
    this.editingGroupMinimum.set(group.group.targetPolicy?.minimumQuantity ?? 0);
    this.editingGroupDesired.set(group.group.targetPolicy?.desiredQuantity ?? 0);
    this.editingGroupHasTarget.set(Boolean(group.group.targetPolicy));
    this.editingGroupId.set(group.group.id);
    this.groupSelected.emit(group);
  }
  cancelGroupEdit(): void {
    this.editingGroupId.set(null);
    this.editingGroupName.set("");
    this.editingGroupUnitOption.set("count");
    this.editingGroupCustomUnit.set("");
    this.editingGroupMinimum.set(0);
    this.editingGroupDesired.set(0);
    this.editingGroupHasTarget.set(false);
  }
  editProduct(product: HouseholdV2Product): void {
    this.editingProductName.set(product.displayName);
    this.editingProductGtin.set(
      typeof product.identitySnapshot?.["gtin"] === "string" ? product.identitySnapshot["gtin"] : ""
    );
    this.editingProductNote.set(product.note ?? "");
    this.editingProductGroupId.set(product.productGroupId ?? "");
    this.editingProductId.set(product.id);
    this.productDetailsIds.update((ids) => new Set(ids).add(product.id));
    this.productSelected.emit(product);
  }
  cancelProductEdit(): void {
    this.editingProductId.set(null);
    this.editingProductName.set("");
    this.editingProductGtin.set("");
    this.editingProductNote.set("");
    this.editingProductGroupId.set("");
  }
  editBatch(
    batch: HouseholdV2Batch,
    group: HouseholdV2ProductGroup | null,
    product: HouseholdV2Product
  ): void {
    this.editingBatchId.set(batch.id);
    this.batchSelected.emit({ batch, group, product });
  }
  cancelBatchEdit(): void {
    this.editingBatchId.set(null);
  }
  stateLabel(state: string): string {
    if (this.workspace()?.useAbbreviatedUiLabels)
      return state === "below_minimum"
        ? this.loc.t("household.stateBelowMinimumShort")
        : state === "between_minimum_and_target"
          ? this.loc.t("household.stateBetweenMinimumAndTargetShort")
          : state === "at_target"
            ? this.loc.t("household.stateAtTarget")
            : this.loc.t("household.stateNotTracked");
    return state === "below_minimum"
      ? this.loc.t("household.stateBelowMinimum")
      : state === "between_minimum_and_target"
        ? this.loc.t("household.stateBetweenMinimumAndTarget")
        : state === "at_target"
          ? this.loc.t("household.stateAtTarget")
          : this.loc.t("household.stateNotTracked");
  }
  stateClass(state: string): "danger" | "good" | "muted" {
    return state === "below_minimum"
      ? "danger"
      : state === "between_minimum_and_target" || state === "at_target"
        ? "good"
        : "muted";
  }
  identityLabel(identityKind: string): string {
    return identityKind === "catalogue"
      ? this.loc.t("household.identityCatalogue")
      : this.loc.t("household.identityManual");
  }
  displayTrackingUnit(value: string | null | undefined): string {
    return displayTrackingUnit(value);
  }
  isCustomTrackingUnit(value: string | null | undefined): boolean {
    return isCustomTrackingUnit(value);
  }
  batchSourceLabel(batch: HouseholdV2Batch): string {
    return batch.acquisitionSnapshot.sourceName?.trim() || this.loc.t("household.manualSource");
  }
  batchTitle(batch: HouseholdV2Batch): string {
    return `${this.batchSourceLabel(batch)} (${batch.acquiredOn})`;
  }
  comparisonClass(
    current: number,
    reference: number | undefined,
    kind: "minimum" | "target"
  ): string {
    if (reference === undefined) return "comparison-neutral";
    return kind === "minimum"
      ? current >= reference
        ? "comparison-good"
        : "comparison-error"
      : current <= reference
        ? "comparison-good"
        : "comparison-warning";
  }
  comparisonIs(
    current: number,
    reference: number | undefined,
    kind: "minimum" | "target",
    state: "good" | "warning" | "error"
  ): boolean {
    return this.comparisonClass(current, reference, kind) === `comparison-${state}`;
  }
  availableGroups(): HouseholdV2ProductGroup["group"][] {
    return this.flattenGroups(this.workspace()?.productGroups ?? []);
  }
  isExpired(expiryOn: string | null | undefined): boolean {
    return Boolean(expiryOn && expiryOn < new Date().toISOString().slice(0, 10));
  }
  async saveGroup(group: HouseholdV2ProductGroup["group"]): Promise<void> {
    const displayName = this.editingGroupName();
    const name = displayName.trim();
    const trackingUnit = composeTrackingUnit(
      this.editingGroupUnitOption(),
      this.editingGroupCustomUnit()
    );
    const minimumQuantity = this.editingGroupMinimum();
    const desiredQuantity = this.editingGroupDesired();
    if (
      !name ||
      !trackingUnit ||
      !Number.isFinite(minimumQuantity) ||
      !Number.isFinite(desiredQuantity) ||
      minimumQuantity < 0 ||
      desiredQuantity < minimumQuantity
    ) {
      this.errorMessage.set(this.loc.t("household.groupSaveInvalid"));
      return;
    }
    const targetPolicy = this.editingGroupHasTarget()
      ? {
          consumptionPolicy: group.targetPolicy?.consumptionPolicy ?? "earliest_expiry_first",
          desiredQuantity,
          expiryWarningDays: group.targetPolicy?.expiryWarningDays ?? 0,
          minimumQuantity,
          trackingUnit
        }
      : null;
    const result = await this.service.updateProductGroup({
      displayName: name,
      expectedRevision: group.revision,
      groupId: group.id,
      householdId: this.householdId(),
      targetPolicy,
      trackingUnit
    });
    if (result.status === "error") {
      this.errorMessage.set(result.message ?? this.loc.t("household.groupSaveFailure"));
      this.logger.log("error", "Product Group rename failed", {
        displayName: group.displayName,
        groupId: group.id
      });
      return;
    }
    this.logger.log("info", "Product Group renamed", { displayName: name, groupId: group.id });
    this.cancelGroupEdit();
    this.changed.emit();
    await this.refresh();
  }
  async saveProductRow(
    product: HouseholdV2Product,
    displayName: string,
    productGroupId: string,
    gtin: string,
    note: string
  ): Promise<void> {
    const name = displayName.trim();
    if (!name) {
      this.errorMessage.set(this.loc.t("household.productNameRequired"));
      return;
    }
    const result = await this.service.updateProductIdentity({
      catalogProductId:
        typeof product.identitySnapshot?.["catalogProductId"] === "string"
          ? product.identitySnapshot["catalogProductId"]
          : null,
      defaultTrackingUnit: product.defaultTrackingUnit ?? null,
      displayName: name,
      expectedRevision: product.revision,
      householdId: this.householdId(),
      identitySnapshot: { ...product.identitySnapshot, gtin: gtin.trim() || null },
      note: note.trim() || null,
      productGroupId: productGroupId || null,
      productId: product.id,
      targetPolicy: product.targetPolicy ?? null
    });
    if (result.status === "error") {
      this.errorMessage.set(result.message ?? this.loc.t("household.productSaveFailure"));
      this.logger.log("error", "Household Product inline save failed", {
        displayName: product.displayName,
        productId: product.id
      });
      return;
    }
    this.logger.log("info", "Household Product saved", {
      displayName: name,
      productGroupId: productGroupId || null,
      productId: product.id
    });
    this.cancelProductEdit();
    this.changed.emit();
    await this.refresh();
  }
  async correctBatch(
    batch: { acquiredOn: string; expiryOn?: string | null; id: string; revision: number },
    resultingQuantity: number,
    acquiredOn: string,
    expiryOn: string
  ): Promise<void> {
    this.logger.log("info", "Correcting stock batch", { batchId: batch.id });
    const result = await this.service.correctBatch({
      acquiredOn,
      batchId: batch.id,
      expiryOn: expiryOn || null,
      expectedBatchRevision: batch.revision,
      householdId: this.householdId(),
      resultingQuantity
    });
    if (result.status === "error") {
      this.errorMessage.set(result.message ?? this.loc.t("household.batchCorrectionFailure"));
      this.logger.log("error", "Stock batch correction failed", { batchId: batch.id });
      return;
    }
    this.logger.log("info", "Stock batch corrected", { batchId: batch.id, resultingQuantity });
    this.editingBatchId.set(null);
    this.changed.emit();
    await this.refresh();
  }
  async discardBatch(batch: { id: string; revision: number }): Promise<void> {
    if (!window.confirm(this.loc.t("household.discardBatchConfirm"))) return;
    this.logger.log("info", "Discarding stock batch", { batchId: batch.id });
    const result = await this.service.discardBatch({
      batchId: batch.id,
      expectedBatchRevision: batch.revision,
      householdId: this.householdId()
    });
    if (result.status === "error") {
      this.errorMessage.set(result.message ?? this.loc.t("household.batchDiscardFailure"));
      this.logger.log("error", "Stock batch discard failed", { batchId: batch.id });
      return;
    }
    this.logger.log("info", "Stock batch discarded", { batchId: batch.id });
    this.editingBatchId.set(null);
    this.changed.emit();
    await this.refresh();
  }
  async deleteGroup(group: HouseholdV2ProductGroup["group"]): Promise<void> {
    if (
      !window.confirm(
        this.loc.t("household.deleteProductGroupConfirm", { name: group.displayName })
      )
    )
      return;
    this.logger.log("warn", "Deleting Product Group", {
      displayName: group.displayName,
      groupId: group.id
    });
    const result = await this.service.deleteProductGroup({
      expectedRevision: group.revision,
      groupId: group.id,
      householdId: this.householdId()
    });
    if (result.status === "error") {
      this.errorMessage.set(result.message ?? this.loc.t("household.groupDeleteFailure"));
      this.logger.log("error", "Product Group deletion failed", {
        displayName: group.displayName,
        groupId: group.id
      });
      return;
    }
    this.logger.log("info", "Product Group deleted; Products are unassigned", {
      displayName: group.displayName,
      groupId: group.id
    });
    this.changed.emit();
    await this.refresh();
  }
  async deleteProduct(product: HouseholdV2Product): Promise<void> {
    if (
      !window.confirm(
        this.loc.t("household.deleteHouseholdProductConfirm", { name: product.displayName })
      )
    )
      return;
    this.logger.log("warn", "Deleting Household Product and stock batches", {
      displayName: product.displayName,
      productId: product.id
    });
    const result = await this.service.deleteProduct({
      expectedRevision: product.revision,
      householdId: this.householdId(),
      productId: product.id
    });
    if (result.status === "error") {
      this.errorMessage.set(result.message ?? this.loc.t("household.productDeleteFailure"));
      this.logger.log("error", "Household Product deletion failed", {
        displayName: product.displayName,
        productId: product.id
      });
      return;
    }
    this.logger.log("info", "Household Product and owned stock batches deleted", {
      displayName: product.displayName,
      productId: product.id
    });
    this.changed.emit();
    await this.refresh();
  }
  private resetEditingState(): void {
    this.cancelGroupEdit();
    this.cancelProductEdit();
    this.cancelBatchEdit();
  }
  private toggleSet(target: ReturnType<typeof signal<ReadonlySet<string>>>, id: string): void {
    target.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  private groupIds(groups: HouseholdV2ProductGroup[]): string[] {
    return groups.flatMap((group) => [group.group.id, ...this.groupIds(group.childGroups)]);
  }
  private flattenGroups(groups: HouseholdV2ProductGroup[]): HouseholdV2ProductGroup["group"][] {
    return groups.flatMap((group) => [group.group, ...this.flattenGroups(group.childGroups)]);
  }
}
