import { Component, EventEmitter, inject, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { CatalogProductListItem } from "../product-lookup/product-catalog.service";
import {
  productReviewDecisionReasons,
  type IngestionProductReviewItem,
  type ProductReviewCandidateDraft,
  type ProductReviewDecisionReason
} from "../site-admin/ingestion-admin.service";
import { LocalizationService, type TranslationKey } from "./localization.service";

type EditorMode = "catalog" | "review";

@Component({
  imports: [FormsModule],
  selector: "app-product-editor-dialog",
  standalone: true,
  template: `
    @if (open) {
      <section class="dialog-backdrop" role="presentation" (click)="close.emit()">
        <article
          class="editor-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
          (click)="$event.stopPropagation()"
        >
          <header class="editor-header">
            <div>
              <p class="kicker">
                {{
                  mode === "review" ? loc.t("common.crawlReview") : loc.t("common.catalogProduct")
                }}
              </p>
              <h2>{{ title }}</h2>
              <p class="muted">{{ subtitle }}</p>
            </div>
            <button
              class="icon-button"
              type="button"
              [title]="loc.t('common.close')"
              [attr.aria-label]="loc.t('common.closeEditor')"
              (click)="close.emit()"
            >
              x
            </button>
          </header>

          <div class="editor-body">
            <form class="field-panel" (submit)="$event.preventDefault()">
              <label>
                {{ loc.t("editor.productName") }}
                <input name="name" [(ngModel)]="draftName" />
              </label>
              <label>
                {{ loc.t("editor.brand") }}
                <input
                  name="brand"
                  [(ngModel)]="draftBrandName"
                  [placeholder]="loc.t('common.unbranded')"
                />
              </label>
              <label>
                {{ loc.t("editor.categoryKey") }}
                <input
                  name="category"
                  [(ngModel)]="draftCategoryKey"
                  [placeholder]="loc.t('common.uncategorized')"
                />
              </label>
              <label>
                {{ loc.t("editor.note") }}
                <textarea name="note" rows="3" [(ngModel)]="draftNote"></textarea>
              </label>

              @if (mode === "review" && reviewItem) {
                <section class="context-panel" [attr.aria-label]="loc.t('editor.rawCrawlContext')">
                  <p class="kicker">{{ loc.t("editor.rawCrawlContext") }}</p>
                  <pre>{{ formatJson(reviewItem.rawRowPreview) }}</pre>
                </section>
              }

              @if (mode === "catalog" && product) {
                <section class="context-panel" [attr.aria-label]="loc.t('editor.catalogContext')">
                  <p class="kicker">{{ loc.t("editor.catalogContext") }}</p>
                  <p class="muted">
                    {{ validationStatusLabel(product.validationStatus) }} ·
                    {{ product.sourceNames.join(", ") || loc.t("common.noSource") }}
                  </p>
                  <p class="muted">
                    {{ product.offers.length }} {{ loc.t("common.offers") }} ·
                    {{ product.tagKeys.length }} {{ loc.t("common.tags") }}
                  </p>
                </section>
              }
            </form>

            <aside class="json-panel">
              <div class="json-panel-header">
                <label class="json-panel-title">
                  {{ loc.t("editor.jsonEditor") }}
                </label>
                <div class="json-actions">
                  <button
                    class="secondary-button json-action-button"
                    type="button"
                    [disabled]="hasPriceObservations()"
                    [title]="loc.t('editor.addEmptyPriceObservationTitle')"
                    (click)="addEmptyPriceObservation()"
                  >
                    {{ loc.t("editor.addEmptyPriceObservation") }}
                  </button>
                  <button
                    class="secondary-button json-action-button"
                    type="button"
                    [disabled]="hasMeasurements()"
                    [title]="loc.t('editor.addEmptyMeasurementTitle')"
                    (click)="addEmptyMeasurement()"
                  >
                    {{ loc.t("editor.addEmptyMeasurement") }}
                  </button>
                </div>
              </div>
              <textarea name="json" rows="16" [(ngModel)]="jsonText"></textarea>
              @if (jsonError()) {
                <p class="error-text">{{ jsonError() }}</p>
              }
              <button class="secondary-button" type="button" (click)="applyJson()">
                {{ loc.t("common.applyJson") }}
              </button>
            </aside>
          </div>

          <footer class="editor-actions">
            @if (mode === "review" && reviewItem) {
              <select [(ngModel)]="declineReason" [attr.aria-label]="loc.t('editor.declineReason')">
                @for (reason of declineReasons; track reason) {
                  <option [ngValue]="reason">{{ declineReasonLabel(reason) }}</option>
                }
              </select>
              <button class="secondary-button" type="button" (click)="emitReviewPatch()">
                {{ loc.t("common.saveDraft") }}
              </button>
              <button
                class="danger-button"
                type="button"
                (click)="
                  declineReview.emit({
                    id: reviewItem.id,
                    note: draftNote || null,
                    reason: declineReason
                  })
                "
              >
                {{ loc.t("common.decline") }}
              </button>
              <button
                class="primary-button"
                type="button"
                (click)="acceptReview.emit({ id: reviewItem.id, note: draftNote || null })"
              >
                {{ loc.t("common.accept") }}
              </button>
            } @else if (mode === "catalog" && product) {
              <button class="danger-button" type="button" (click)="deleteProduct.emit(product.id)">
                {{ loc.t("common.delete") }}
              </button>
              <button
                class="secondary-button"
                type="button"
                (click)="invalidateProduct.emit({ id: product.id, note: draftNote || null })"
              >
                {{ loc.t("common.invalidate") }}
              </button>
              <button
                class="secondary-button"
                type="button"
                (click)="validateProduct.emit({ id: product.id, note: draftNote || null })"
              >
                {{ loc.t("common.validate") }}
              </button>
              <button class="primary-button" type="button" (click)="emitProductSave()">
                {{ loc.t("common.save") }}
              </button>
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
        border: 1px solid var(--line-strong);
        border-radius: var(--radius-ui);
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
        border-radius: var(--radius-ui);
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
        border-radius: var(--radius-ui);
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
        color: var(--color-status-danger);
      }

      .icon-button,
      .primary-button,
      .secondary-button,
      .danger-button {
        border: 0;
        border-radius: var(--radius-ui);
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
        background: var(--danger-soft-background);
        color: var(--color-status-danger-text);
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
  readonly loc = inject(LocalizationService);
  @Input() mode: EditorMode = "catalog";
  @Input() open = false;
  @Output() readonly acceptReview = new EventEmitter<{ id: string; note: string | null }>();
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly declineReview = new EventEmitter<{
    id: string;
    note: string | null;
    reason: ProductReviewDecisionReason;
  }>();
  @Output() readonly deleteProduct = new EventEmitter<string>();
  @Output() readonly invalidateProduct = new EventEmitter<{ id: string; note: string | null }>();
  @Output() readonly saveProduct = new EventEmitter<CatalogProductListItem>();
  @Output() readonly updateReviewCandidate = new EventEmitter<{
    candidate: ProductReviewCandidateDraft;
    id: string;
  }>();
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
    return this.mode === "review"
      ? this.draftName || this.loc.t("editor.reviewProduct")
      : this.draftName || this.loc.t("editor.editProduct");
  }

  get subtitle(): string {
    if (this.mode === "review" && this.reviewItem) {
      return `${this.reviewItem.sourceName} · ${this.candidateMatchLabel(this.reviewItem.candidateMatch)} · ${this.reviewStatusLabel(this.reviewItem.status)}`;
    }

    return this.product
      ? `${this.product.id} · ${this.validationStatusLabel(this.product.validationStatus)}`
      : "";
  }

  candidateMatchLabel(match: ProductReviewCandidateDraft["matchConfidence"]): string {
    return this.loc.t(`candidateMatch.${match}` as TranslationKey);
  }

  declineReasonLabel(reason: ProductReviewDecisionReason): string {
    return this.loc.t(`reviewReason.${reason}` as TranslationKey);
  }

  reviewStatusLabel(status: IngestionProductReviewItem["status"]): string {
    return this.loc.t(`reviewStatus.${status}` as TranslationKey);
  }

  validationStatusLabel(status: CatalogProductListItem["validationStatus"]): string {
    return this.loc.t(`validationStatus.${status}` as TranslationKey);
  }

  applyJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        this.jsonError.set(this.loc.t("editor.jsonInvalidObject"));
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
      this.jsonError.set(this.loc.t("editor.jsonParseError"));
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

    const priceObservations = this.readArrayField(parsed, "priceObservations");
    priceObservations.push({
      currencyCode: "HUF",
      observedAt:
        this.mode === "review"
          ? (this.reviewItem?.candidate.origin.capturedAt ?? "")
          : new Date().toISOString(),
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

    const measurements =
      this.mode === "review"
        ? this.readProductArrayField(parsed, "measurements")
        : this.readArrayField(parsed, "measurements");
    measurements.push({
      unit: "",
      value: 0
    });
    if (this.mode === "review") {
      parsed["product"] = {
        ...(this.readObjectField(parsed, "product") ?? {}),
        measurements
      };
    } else {
      parsed["measurements"] = measurements;
    }
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
      this.jsonError.set(this.loc.t("editor.jsonParseError"));
    }
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  hasPriceObservations(): boolean {
    const parsed = this.parseJsonText();
    return this.readArrayField(parsed, "priceObservations").length > 0;
  }

  hasMeasurements(): boolean {
    const parsed = this.parseJsonText();
    return this.mode === "review"
      ? this.readProductArrayField(parsed, "measurements").length > 0
      : this.readArrayField(parsed, "measurements").length > 0;
  }

  private parseJsonText(): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(this.jsonText) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private readArrayField(value: Record<string, unknown> | null, key: string): unknown[] {
    const field = value?.[key];
    return Array.isArray(field) ? field : [];
  }

  private readObjectField(
    value: Record<string, unknown> | null,
    key: string
  ): Record<string, unknown> | null {
    const field = value?.[key];
    return field && typeof field === "object" && !Array.isArray(field)
      ? (field as Record<string, unknown>)
      : null;
  }

  private readProductArrayField(value: Record<string, unknown> | null, key: string): unknown[] {
    return this.readArrayField(this.readObjectField(value, "product"), key);
  }
}
