import { Component, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { BrowserLoggerService } from "../browser-logger.service";
import { HouseholdV2Service, type HouseholdV2Batch, type HouseholdV2Product, type HouseholdV2ProductGroup, type HouseholdV2TargetPolicy } from "./household-v2.service";

interface GroupDraft { displayName: string; desiredQuantity: number; hasTarget: boolean; minimumQuantity: number; trackingUnit: string; }
interface ProductDraft { catalogProductId: string; desiredQuantity: number; displayName: string; gtin: string; hasTarget: boolean; minimumQuantity: number; note: string; productGroupId: string | null; trackingUnit: string; }
interface BatchDraft { acquiredOn: string; expiryOn: string; quantity: number; unit: string; }

@Component({
  selector: "app-household-product-editor",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./household-product-editor.component.html",
  styleUrl: "./household-product-editor.component.css"
})
export class HouseholdProductEditorComponent {
  readonly householdId = input("");
  readonly product = input<HouseholdV2Product | null>(null);
  readonly group = input<HouseholdV2ProductGroup | null>(null);
  readonly batch = input<HouseholdV2Batch | null>(null);
  readonly batchOnly = input(false);
  readonly productCreateMode = input(false);
  readonly resetRevision = input(0);
  readonly changed = output<void>();
  readonly errorMessage = signal("");
  readonly saving = signal(false);
  readonly productGroups = signal<HouseholdV2ProductGroup["group"][]>([]);
  readonly selectedGroupId = signal<string | null>(null);
  readonly groupOpen = signal(false);
  readonly productOpen = signal(false);
  readonly batchOpen = signal(false);
  groupDraft: GroupDraft = createGroupDraft();
  productDraft: ProductDraft = createProductDraft(null);
  batchDraft: BatchDraft = createBatchDraft();
  private readonly service = inject(HouseholdV2Service);
  private readonly logger = inject(BrowserLoggerService);

  constructor() {
    effect(() => {
      const product = this.product();
      const selectedGroup = this.group();
      const selectedBatch = this.batch();
      const productCreateMode = this.productCreateMode();
      this.resetRevision();
      this.productDraft = createProductDraft(product);
      this.batchDraft = createBatchDraft(product?.defaultTrackingUnit ?? "count", selectedBatch);
      this.selectedGroupId.set(product?.productGroupId ?? null);
      this.groupDraft = createGroupDraft(selectedGroup?.group);
      this.errorMessage.set("");
      this.groupOpen.set(Boolean(selectedGroup) && !productCreateMode && !this.batchOnly());
      this.productOpen.set((Boolean(product) || productCreateMode) && !this.batchOnly());
      this.batchOpen.set(Boolean(selectedBatch) || this.batchOnly());
      void this.loadGroups();
    });
  }

  groupNameChanged(): void {
    if (!this.product() && !this.productDraft.displayName) this.productDraft.displayName = this.groupDraft.displayName;
  }

  async saveGroup(): Promise<void> {
    const name = this.groupDraft.displayName.trim();
    if (!name || !this.groupDraft.trackingUnit.trim() || !this.validLimits(this.groupDraft.hasTarget, this.groupDraft.minimumQuantity, this.groupDraft.desiredQuantity)) return this.fail("Enter a group name, unit, and valid target values.");
    this.saving.set(true); this.errorMessage.set("");
    const policy = this.groupDraft.hasTarget ? this.policy(this.groupDraft.minimumQuantity, this.groupDraft.desiredQuantity, this.groupDraft.trackingUnit) : null;
    const result = this.selectedGroupId() ? await this.service.updateProductGroup({ displayName: name, expectedRevision: this.selectedGroupRevision(), groupId: this.selectedGroupId()!, householdId: this.householdId(), targetPolicy: policy, trackingUnit: this.groupDraft.trackingUnit.trim() }) : await this.service.createProductGroup({ displayName: name, householdId: this.householdId(), targetPolicy: policy, trackingUnit: this.groupDraft.trackingUnit.trim() });
    this.saving.set(false);
    if (result.status === "error") return this.fail(result.message ?? "Product Group could not be saved.");
    this.logger.log("info", `${this.selectedGroupId() ? "Product Group saved" : "Product Group created"}: ${name}`, { displayName: name, groupId: this.selectedGroupId() }); this.clearAll(); this.changed.emit(); await this.loadGroups();
  }

  async saveProduct(): Promise<void> {
    const name = this.productDraft.displayName.trim();
    if (!name || !this.validLimits(this.productDraft.hasTarget, this.productDraft.minimumQuantity, this.productDraft.desiredQuantity)) return this.fail("Enter a Product name and valid target values.");
    this.saving.set(true); this.errorMessage.set("");
    if (!this.product() && !this.productDraft.productGroupId && this.groupDraft.displayName.trim()) {
      const groupResult = await this.service.createProductGroup({ displayName: this.groupDraft.displayName.trim(), householdId: this.householdId(), targetPolicy: this.groupDraft.hasTarget ? this.policy(this.groupDraft.minimumQuantity, this.groupDraft.desiredQuantity, this.groupDraft.trackingUnit) : null, trackingUnit: this.groupDraft.trackingUnit.trim() });
      if (groupResult.status === "error" || !groupResult.productGroup?.id) { this.saving.set(false); return this.fail(groupResult.message ?? "Product Group could not be created for the Product."); }
      this.productDraft.productGroupId = groupResult.productGroup.id;
    }
    const policy = this.productDraft.hasTarget ? this.policy(this.productDraft.minimumQuantity, this.productDraft.desiredQuantity, this.productDraft.trackingUnit.trim()) : null;
    const identitySnapshot = { gtin: this.productDraft.gtin || null };
    const result = this.product() ? await this.service.updateProductIdentity({ defaultTrackingUnit: this.productDraft.trackingUnit.trim(), displayName: name, expectedRevision: this.product()!.revision, householdId: this.householdId(), productId: this.product()!.id, productGroupId: this.productDraft.productGroupId, targetPolicy: policy, note: this.productDraft.note || null, catalogProductId: this.productDraft.catalogProductId || null, identitySnapshot }) : await this.service.createProduct({ defaultTrackingUnit: this.productDraft.trackingUnit.trim(), displayName: name, householdId: this.householdId(), productGroupId: this.productDraft.productGroupId, targetPolicy: policy, note: this.productDraft.note || null });
    this.saving.set(false);
    if (result.status === "error") return this.fail(result.message ?? "Household Product could not be saved.");
    this.logger.log("info", `${this.product() ? "Household Product saved" : "Household Product created"}: ${name}`, { displayName: name, productGroupId: this.productDraft.productGroupId, productId: this.product()?.id }); this.clearAll(); this.changed.emit(); await this.loadGroups();
  }

  async saveBatch(): Promise<void> {
    const name = this.productDraft.displayName.trim();
    if (!name || this.batchDraft.quantity <= 0 || !this.batchDraft.unit.trim()) return this.fail("Enter a Product and a positive stock quantity.");
    this.saving.set(true); this.errorMessage.set("");
    if (this.batch()) {
      const result = await this.service.correctBatch({ acquiredOn: this.batchDraft.acquiredOn, batchId: this.batch()!.id, expiryOn: this.batchDraft.expiryOn || null, expectedBatchRevision: this.batch()!.revision, householdId: this.householdId(), resultingQuantity: this.batchDraft.quantity });
      this.saving.set(false);
      if (result.status === "error") return this.fail(result.message ?? "Stock Batch could not be saved.");
      this.logger.log("info", `Stock Batch saved for ${name}`, { batchId: this.batch()!.id, productId: this.product()?.id }); this.clearAll(); this.changed.emit(); return;
    }
    const productId = this.product()?.id;
    if (!productId) {
      const created = await this.service.createProductWithBatch({ batch: { acquiredOn: this.batchDraft.acquiredOn, displayName: name, expiryOn: this.batchDraft.expiryOn || null, originalQuantity: this.batchDraft.quantity, unit: this.batchDraft.unit.trim() }, group: this.productDraft.productGroupId ? null : (this.groupDraft.displayName.trim() ? { displayName: this.groupDraft.displayName.trim(), targetPolicy: this.groupDraft.hasTarget ? this.policy(this.groupDraft.minimumQuantity, this.groupDraft.desiredQuantity, this.groupDraft.trackingUnit) : null, trackingUnit: this.groupDraft.trackingUnit.trim() } : null), householdId: this.householdId(), product: { defaultTrackingUnit: this.productDraft.trackingUnit.trim(), displayName: name, note: this.productDraft.note || null, productGroupId: this.productDraft.productGroupId, targetPolicy: this.productDraft.hasTarget ? this.policy(this.productDraft.minimumQuantity, this.productDraft.desiredQuantity, this.productDraft.trackingUnit) : null } });
      this.saving.set(false); if (created.status === "error") return this.fail(created.message ?? "Product and stock could not be created.");
      this.logger.log("info", `Product and Stock Batch created: ${name}`, { displayName: name, productGroupId: this.productDraft.productGroupId }); this.clearAll(); this.changed.emit(); return;
    }
    const result = await this.service.createBatch({ acquiredOn: this.batchDraft.acquiredOn, displayName: name, expiryOn: this.batchDraft.expiryOn || null, householdId: this.householdId(), householdProductId: productId, quantity: this.batchDraft.quantity, unit: this.batchDraft.unit.trim() });
    this.saving.set(false);
    if (result.status === "error") return this.fail(result.message ?? "Stock Batch could not be saved.");
    this.logger.log("info", `Stock Batch created for ${name}`, { productId }); this.clearAll(); this.changed.emit();
  }

  clearGroup(): void { this.groupDraft = createGroupDraft(); this.selectedGroupId.set(null); this.groupOpen.set(false); }
  clearProduct(): void { this.productDraft = createProductDraft(null); this.productOpen.set(false); }
  clearBatch(): void { this.batchDraft = createBatchDraft(); this.batchOpen.set(false); }

  private async loadGroups(): Promise<void> {
    const householdId = this.householdId(); if (!householdId) return;
    const result = await this.service.loadProductGroups(householdId); if (result.status === "ok") { this.productGroups.set(result.productGroups ?? []); const selected = result.productGroups?.find((candidate) => candidate.id === (this.product()?.productGroupId ?? this.group()?.group.id)); if (selected) { this.selectedGroupId.set(selected.id); this.groupDraft = { displayName: selected.displayName, desiredQuantity: selected.targetPolicy?.desiredQuantity ?? 0, hasTarget: Boolean(selected.targetPolicy), minimumQuantity: selected.targetPolicy?.minimumQuantity ?? 0, trackingUnit: selected.trackingUnit }; if (!this.product()) this.productDraft.productGroupId = selected.id; } }
  }
  private selectedGroupRevision(): number { return this.productGroups().find((group) => group.id === this.selectedGroupId())?.revision ?? 0; }
  private clearAll(): void { this.clearGroup(); this.clearProduct(); this.clearBatch(); }
  private policy(minimumQuantity: number, desiredQuantity: number, trackingUnit: string): HouseholdV2TargetPolicy { return { consumptionPolicy: "earliest_expiry_first", desiredQuantity, expiryWarningDays: 0, minimumQuantity, trackingUnit }; }
  private validLimits(hasTarget: boolean, minimumQuantity: number, desiredQuantity: number): boolean { return !hasTarget || (Number.isFinite(minimumQuantity) && Number.isFinite(desiredQuantity) && minimumQuantity >= 0 && desiredQuantity >= minimumQuantity); }
  private fail(message: string): void { this.errorMessage.set(message); this.logger.log("error", message); }
}

function createGroupDraft(group?: HouseholdV2ProductGroup["group"]): GroupDraft { return { displayName: group?.displayName ?? "", desiredQuantity: group?.targetPolicy?.desiredQuantity ?? 0, hasTarget: Boolean(group?.targetPolicy), minimumQuantity: group?.targetPolicy?.minimumQuantity ?? 0, trackingUnit: group?.trackingUnit ?? "count" }; }
function createProductDraft(product: HouseholdV2Product | null): ProductDraft { return { catalogProductId: typeof product?.identitySnapshot?.["catalogProductId"] === "string" ? product.identitySnapshot["catalogProductId"] as string : "", desiredQuantity: product?.targetPolicy?.desiredQuantity ?? 0, displayName: product?.displayName ?? "", gtin: typeof product?.identitySnapshot?.["gtin"] === "string" ? product.identitySnapshot["gtin"] as string : "", hasTarget: Boolean(product?.targetPolicy), minimumQuantity: product?.targetPolicy?.minimumQuantity ?? 0, note: product?.note ?? "", productGroupId: product?.productGroupId ?? null, trackingUnit: product?.targetPolicy?.trackingUnit ?? product?.defaultTrackingUnit ?? "count" }; }
function createBatchDraft(unit = "count", batch?: HouseholdV2Batch | null): BatchDraft { return { acquiredOn: batch?.acquiredOn ?? new Date().toISOString().slice(0, 10), expiryOn: batch?.expiryOn ?? "", quantity: batch?.remainingQuantity ?? 0, unit: batch?.unit ?? unit }; }
