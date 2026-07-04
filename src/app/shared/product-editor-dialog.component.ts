import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { CatalogProductListItem } from "../product-lookup/product-catalog.service";
import {
  productReviewDecisionReasons,
  type IngestionProductReviewItem,
  type ProductReviewCandidateDraft,
  type ProductReviewDecisionReason
} from "../site-admin/ingestion-admin.service";

type EditorMode = "catalog" | "review";

@Component({
  imports: [FormsModule],
  selector: "app-product-editor-dialog",
  standalone: true,
  template: `
    @if (open) {
      <section class="dialog-backdrop" role="presentation" (click)="close.emit()">
        <article class="editor-dialog" role="dialog" aria-modal="true" [attr.aria-label]="title" (click)="$event.stopPropagation()">
          <header class="editor-header">
            <div>
              <p class="kicker">{{ mode === "review" ? "Crawl review" : "Catalog product" }}</p>
              <h2>{{ title }}</h2>
              <p class="muted">{{ subtitle }}</p>
            </div>
            <button class="icon-button" type="button" title="Close" aria-label="Close editor" (click)="close.emit()">x</button>
          </header>

          <div class="editor-body">
            <form class="field-panel" (submit)="$event.preventDefault()">
              <label>
                Product name
                <input name="name" [(ngModel)]="draftName" />
              </label>
              <label>
                Brand
                <input name="brand" [(ngModel)]="draftBrandName" placeholder="unbranded" />
              </label>
              <label>
                Category key
                <input name="category" [(ngModel)]="draftCategoryKey" placeholder="uncategorized" />
              </label>
              <label>
                Note
                <textarea name="note" rows="3" [(ngModel)]="draftNote"></textarea>
              </label>

              @if (mode === "review" && reviewItem) {
                <section class="context-panel" aria-label="Raw crawl context">
                  <p class="kicker">Raw crawl context</p>
                  <pre>{{ formatJson(reviewItem.rawRowPreview) }}</pre>
                </section>
              }

              @if (mode === "catalog" && product) {
                <section class="context-panel" aria-label="Catalog context">
                  <p class="kicker">Catalog context</p>
                  <p class="muted">{{ product.validationStatus }} · {{ product.sourceNames.join(", ") || "no source" }}</p>
                  <p class="muted">{{ product.offers.length }} offers · {{ product.tagKeys.length }} tags</p>
                </section>
              }
            </form>

            <aside class="json-panel">
              <div class="json-panel-header">
                <label class="json-panel-title">
                  JSON editor
                </label>
                <div class="json-actions">
                  <button
                    class="secondary-button json-action-button"
                    type="button"
                    [disabled]="hasPriceObservations()"
                    title="Insert an empty price observation entry"
                    (click)="addEmptyPriceObservation()"
                  >
                    Add empty priceObservation
                  </button>
                  <button
                    class="secondary-button json-action-button"
                    type="button"
                    [disabled]="hasMeasurements()"
                    title="Insert an empty measurement entry"
                    (click)="addEmptyMeasurement()"
                  >
                    Add empty measurement
                  </button>
                </div>
              </div>
              <textarea name="json" rows="16" [(ngModel)]="jsonText"></textarea>
              @if (jsonError()) {
                <p class="error-text">{{ jsonError() }}</p>
              }
              <button class="secondary-button" type="button" (click)="applyJson()">Apply JSON</button>
            </aside>
          </div>

          <footer class="editor-actions">
            @if (mode === "review" && reviewItem) {
              <select [(ngModel)]="declineReason" aria-label="Decline reason">
                @for (reason of declineReasons; track reason) {
                  <option [ngValue]="reason">{{ reason }}</option>
                }
              </select>
              <button class="secondary-button" type="button" (click)="emitReviewPatch()">Save draft</button>
              <button class="danger-button" type="button" (click)="declineReview.emit({ id: reviewItem.id, note: draftNote || null, reason: declineReason })">Decline</button>
              <button class="primary-button" type="button" (click)="acceptReview.emit({ id: reviewItem.id, note: draftNote || null })">Accept</button>
            } @else if (mode === "catalog" && product) {
              <button class="danger-button" type="button" (click)="deleteProduct.emit(product.id)">Delete</button>
              <button class="secondary-button" type="button" (click)="invalidateProduct.emit({ id: product.id, note: draftNote || null })">Invalidate</button>
              <button class="secondary-button" type="button" (click)="validateProduct.emit({ id: product.id, note: draftNote || null })">Validate</button>
              <button class="primary-button" type="button" (click)="emitProductSave()">Save</button>
            }
          </footer>
        </article>
      </section>
    }
  `,
  styles: [
    `
      .dialog-backdrop {
        align-items: center;
        background: color-mix(in srgb, black 28%, transparent);
        display: flex;
        inset: 0;
        justify-content: center;
        padding: 1rem;
        position: fixed;
        z-index: 60;
      }

      .editor-dialog {
        background: var(--color-surface);
        border: 1px solid color-mix(in srgb, var(--color-wood) 24%, transparent);
        border-radius: 8px;
        box-shadow: 0 1.4rem 4rem color-mix(in srgb, black 24%, transparent);
        display: grid;
        gap: var(--space-4);
        max-height: min(92vh, 58rem);
        max-width: min(94vw, 74rem);
        overflow: auto;
        padding: 1rem;
        width: 100%;
      }

      .editor-header,
      .editor-actions {
        align-items: center;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      .editor-body {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(18rem, 1fr) minmax(18rem, 0.9fr);
        min-width: 0;
      }

      .field-panel,
      .json-panel {
        display: grid;
        gap: var(--space-3);
        min-width: 0;
      }

      .json-panel-header {
        align-items: start;
        display: grid;
        gap: 0.55rem;
      }

      .json-panel-title {
        align-items: center;
        display: flex;
        gap: 0.6rem;
      }

      .json-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      label {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.78rem;
        font-weight: 800;
        gap: 0.35rem;
        text-transform: uppercase;
      }

      input,
      select,
      textarea {
        background: color-mix(in srgb, var(--color-background-soft) 74%, white 26%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 26%, transparent);
        border-radius: 8px;
        color: var(--color-text);
        font: inherit;
        padding: 0.55rem 0.65rem;
        text-transform: none;
      }

      textarea {
        min-height: 5rem;
        resize: vertical;
      }

      pre {
        background: color-mix(in srgb, var(--color-background-soft) 68%, white 32%);
        border-radius: 8px;
        color: var(--color-text-muted);
        margin: 0;
        max-height: 13rem;
        overflow: auto;
        padding: 0.7rem;
        white-space: pre-wrap;
      }

      h2,
      p {
        margin: 0;
      }

      h2 {
        color: var(--color-text);
        font-size: 1.2rem;
      }

      .kicker {
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .muted,
      .error-text {
        color: var(--color-text-muted);
        font-size: 0.84rem;
      }

      .error-text {
        color: #9f1d1d;
      }

      .icon-button,
      .primary-button,
      .secondary-button,
      .danger-button {
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        min-height: 2.25rem;
        padding: 0.45rem 0.75rem;
      }

      .icon-button {
        aspect-ratio: 1;
        background: color-mix(in srgb, var(--color-background-soft) 78%, white 22%);
        padding: 0;
        width: 2.25rem;
      }

      .primary-button {
        background: var(--color-accent-leaf-strong);
        color: white;
      }

      .secondary-button {
        background: color-mix(in srgb, var(--color-accent-sky) 22%, white 78%);
        color: var(--color-text);
      }

      .danger-button {
        background: color-mix(in srgb, #b42318 16%, white 84%);
        color: #842018;
      }

      .json-action-button {
        min-height: 2rem;
        padding: 0.35rem 0.55rem;
      }

      @media (max-width: 840px) {
        .editor-body {
          grid-template-columns: 1fr;
        }

        .editor-actions {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `
  ]
})
export class ProductEditorDialogComponent {
  @Input() mode: EditorMode = "catalog";
  @Input() open = false;
  @Output() readonly acceptReview = new EventEmitter<{ id: string; note: string | null }>();
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly declineReview = new EventEmitter<{ id: string; note: string | null; reason: ProductReviewDecisionReason }>();
  @Output() readonly deleteProduct = new EventEmitter<string>();
  @Output() readonly invalidateProduct = new EventEmitter<{ id: string; note: string | null }>();
  @Output() readonly saveProduct = new EventEmitter<CatalogProductListItem>();
  @Output() readonly updateReviewCandidate = new EventEmitter<{ candidate: ProductReviewCandidateDraft; id: string }>();
  @Output() readonly validateProduct = new EventEmitter<{ id: string; note: string | null }>();

  readonly declineReasons = productReviewDecisionReasons;
  readonly jsonError = signal("");
  declineReason: ProductReviewDecisionReason = "bad_name";
  draftBrandName = "";
  draftCategoryKey = "";
  draftName = "";
  draftNote = "";
  jsonText = "";
  private currentProduct: CatalogProductListItem | null = null;
  private currentReviewItem: IngestionProductReviewItem | null = null;

  get product(): CatalogProductListItem | null {
    return this.currentProduct;
  }

  @Input() set product(value: CatalogProductListItem | null) {
    this.currentProduct = value;
    if (value) {
      this.draftName = value.name;
      this.draftBrandName = value.brandName ?? "";
      this.draftCategoryKey = value.primaryCategoryKey ?? "";
      this.jsonText = this.formatJson(value);
      this.jsonError.set("");
    }
  }

  get reviewItem(): IngestionProductReviewItem | null {
    return this.currentReviewItem;
  }

  @Input() set reviewItem(value: IngestionProductReviewItem | null) {
    this.currentReviewItem = value;
    if (value) {
      this.draftName = value.candidate.product.name;
      this.draftBrandName = value.candidate.product.brandName ?? "";
      this.draftCategoryKey = value.candidate.product.primaryCategoryKey ?? "";
      this.draftNote = value.decision?.note ?? "";
      this.jsonText = this.formatJson(value.candidate);
      this.jsonError.set("");
    }
  }

  get title(): string {
    return this.mode === "review" ? this.draftName || "Review product" : this.draftName || "Edit product";
  }

  get subtitle(): string {
    if (this.mode === "review" && this.reviewItem) {
      return `${this.reviewItem.sourceName} · ${this.reviewItem.candidateMatch} · ${this.reviewItem.status}`;
    }

    return this.product ? `${this.product.id} · ${this.product.validationStatus}` : "";
  }

  applyJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        this.jsonError.set("JSON must be an object.");
        return;
      }

      this.jsonError.set("");
      if (this.mode === "review") {
        const candidate = parsed as ProductReviewCandidateDraft;
        this.draftName = candidate.product?.name ?? this.draftName;
        this.draftBrandName = candidate.product?.brandName ?? "";
        this.draftCategoryKey = candidate.product?.primaryCategoryKey ?? "";
        return;
      }

      const product = parsed as CatalogProductListItem;
      this.draftName = product.name ?? this.draftName;
      this.draftBrandName = product.brandName ?? "";
      this.draftCategoryKey = product.primaryCategoryKey ?? "";
    } catch {
      this.jsonError.set("JSON could not be parsed.");
    }
  }

  addEmptyPriceObservation(): void {
    if (this.hasPriceObservations()) {
      return;
    }

    const parsed = this.parseJsonText();
    if (!parsed) {
      return;
    }

    const priceObservations = Array.isArray(parsed["priceObservations"]) ? parsed["priceObservations"] : [];
    priceObservations.push({
      currencyCode: "HUF",
      observedAt: "",
      price: 0
    });
    parsed["priceObservations"] = priceObservations;
    this.jsonText = this.formatJson(parsed);
    this.jsonError.set("");
  }

  addEmptyMeasurement(): void {
    if (this.hasMeasurements()) {
      return;
    }

    const parsed = this.parseJsonText();
    if (!parsed) {
      return;
    }

    const measurements = Array.isArray(parsed["measurements"]) ? parsed["measurements"] : [];
    measurements.push({
      unit: "",
      value: 0
    });
    parsed["measurements"] = measurements;
    this.jsonText = this.formatJson(parsed);
    this.jsonError.set("");
  }

  emitProductSave(): void {
    if (!this.product) {
      return;
    }

    this.saveProduct.emit({
      ...this.product,
      brandName: this.draftBrandName.trim() || null,
      name: this.draftName.trim(),
      primaryCategoryKey: this.draftCategoryKey.trim() || null
    });
  }

  emitReviewPatch(): void {
    if (!this.reviewItem) {
      return;
    }

    try {
      const candidate = JSON.parse(this.jsonText) as ProductReviewCandidateDraft;
      candidate.product = {
        ...candidate.product,
        brandName: this.draftBrandName.trim() || null,
        name: this.draftName.trim(),
        normalizedName: this.draftName.trim().toLocaleLowerCase("hu-HU").replace(/\s+/g, " "),
        primaryCategoryKey: this.draftCategoryKey.trim() || null
      };
      this.updateReviewCandidate.emit({
        candidate,
        id: this.reviewItem.id
      });
    } catch {
      this.jsonError.set("JSON could not be parsed.");
    }
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  hasPriceObservations(): boolean {
    const parsed = this.parseJsonText();
    return Array.isArray(parsed?.["priceObservations"]) && parsed["priceObservations"].length > 0;
  }

  hasMeasurements(): boolean {
    const parsed = this.parseJsonText();
    return Array.isArray(parsed?.["measurements"]) && parsed["measurements"].length > 0;
  }

  private parseJsonText(): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(this.jsonText) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
}
