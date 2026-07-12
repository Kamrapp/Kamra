import { Component, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { HouseholdV2Service, type HouseholdV2Product } from "./household-v2.service";

interface ProductDraft {
  acquiredOn: string;
  createBatch: boolean;
  displayName: string;
  expiryOn: string;
  quantity: number;
  unit: string;
}

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
  readonly batchOnly = input(false);
  readonly resetRevision = input(0);
  readonly changed = output<void>();
  readonly errorMessage = signal("");
  readonly saving = signal(false);
  draft: ProductDraft = createDraft();
  private readonly service = inject(HouseholdV2Service);

  constructor() {
    effect(() => {
      const product = this.product();
      this.resetRevision();
      this.draft = { ...createDraft(), createBatch: this.batchOnly(), displayName: product?.displayName ?? "" };
      this.errorMessage.set("");
    });
  }

  get isNew(): boolean { return this.product() === null; }

  clear(): void { this.draft = { ...createDraft(), displayName: this.product()?.displayName ?? "" }; this.errorMessage.set(""); }

  async save(): Promise<void> {
    const householdId = this.householdId();
    const product = this.product();
    const name = this.draft.displayName.trim();
    if (!householdId || !name || !this.draft.unit.trim() || !Number.isFinite(this.draft.quantity) || this.draft.quantity < 0) { this.errorMessage.set("Enter a product name, a unit, and a non-negative stock quantity."); return; }
    if (this.draft.createBatch && this.draft.quantity <= 0) { this.errorMessage.set("A physical stock batch must have a positive quantity. Save the Product without a batch for an empty stock entry."); return; }
    this.saving.set(true);
    this.errorMessage.set("");
    let productId = product?.id;
    if (product && !this.batchOnly()) {
      const savedProduct = await this.service.updateProductIdentity({ displayName: name, expectedRevision: product.revision, householdId, productId: product.id });
      if (savedProduct.status === "error") { this.saving.set(false); this.errorMessage.set(savedProduct.message ?? "Product could not be saved."); return; }
    } else if (!product) {
      const createdProduct = await this.service.createProduct({ displayName: name, householdId });
      if (createdProduct.status === "error") { this.saving.set(false); this.errorMessage.set(createdProduct.message ?? "Product could not be saved."); return; }
      productId = createdProduct.product?.id;
    }
    if (!productId) { this.saving.set(false); this.errorMessage.set("Product was saved without an identifier."); return; }
    if (this.draft.createBatch) {
      const batch = await this.service.createBatch({ acquiredOn: this.draft.acquiredOn, displayName: name, expiryOn: this.draft.expiryOn || null, householdId, householdProductId: productId, quantity: this.draft.quantity, unit: this.draft.unit.trim() });
      if (batch.status === "error") { this.saving.set(false); this.errorMessage.set(`Product saved, but initial stock was not created: ${batch.message ?? "unknown error"}`); this.changed.emit(); return; }
    }
    this.saving.set(false);
    this.changed.emit();
  }
}

function createDraft(): ProductDraft {
  return { acquiredOn: new Date().toISOString().slice(0, 10), createBatch: false, displayName: "", expiryOn: "", quantity: 0, unit: "count" };
}
