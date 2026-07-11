import { FormsModule } from "@angular/forms";
import { Component, effect, inject, input, output, signal } from "@angular/core";

import { LocalizationService } from "../shared/localization.service";

export type HouseholdStockEditorMode = "create" | "edit";

export interface HouseholdStockDraft {
  currentAmount: number;
  displayName: string;
  gtin: string;
  id: string;
  idealMaxLimit: number | null;
  initialAmount: number;
  minLimit: number;
  note: string;
  productSourceId: string;
  sourceName: string;
  sourceProductUrl: string;
  stockedAt: string;
  stockGroupKey: string;
  unit: string;
}

@Component({
  selector: "app-household-stock-editor",
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="editor-panel" [attr.aria-label]="loc.t('household.selectedItem')">
      <p class="card-kicker">{{ mode() === "create" ? loc.t("household.addNewItem") : loc.t("household.selectedItem") }}</p>
      <h2>{{ editorTitle() }}</h2>

      <form class="stock-form" (ngSubmit)="saveRequested.emit(draft())">
        <label>
          <span>{{ loc.t("common.name") }}</span>
          <input
            type="text"
            name="editorDisplayName"
            [ngModel]="draft().displayName"
            (ngModelChange)="setDisplayName($event)"
            [placeholder]="loc.t('household.stockNamePlaceholder')"
          />
        </label>

        <div class="split-fields">
          <label>
            <span>{{ loc.t("household.currentAmount") }}</span>
            <input
              type="number"
              step="0.01"
              name="editorCurrentAmount"
              [ngModel]="draft().currentAmount"
              (ngModelChange)="patchDraft({ currentAmount: coerceNumber($event) })"
            />
          </label>
          <label>
            <span>{{ loc.t("household.minLimit") }}</span>
            <span class="amount-stepper">
              <button type="button" [attr.aria-label]="loc.t('household.decreaseMinLimit')" (click)="adjustMinLimit(-1)">−</button>
              <input
                type="number"
                step="0.01"
                name="editorMinLimit"
                [ngModel]="draft().minLimit"
                (ngModelChange)="patchDraft({ minLimit: coerceNumber($event) })"
              />
              <button type="button" [attr.aria-label]="loc.t('household.increaseMinLimit')" (click)="adjustMinLimit(1)">+</button>
            </span>
          </label>
        </div>

        <div class="split-fields">
          <label>
            <span>{{ loc.t("household.unit") }}</span>
            <input
              type="text"
              name="editorUnit"
              [ngModel]="draft().unit"
              (ngModelChange)="patchDraft({ unit: $event })"
            />
          </label>
          <label>
            <span>{{ loc.t("household.stockedAt") }}</span>
            <input
              type="date"
              name="editorStockedAt"
              [ngModel]="draft().stockedAt"
              (ngModelChange)="patchDraft({ stockedAt: $event })"
            />
          </label>
        </div>

        <button
          class="details-toggle icon-button"
          type="button"
          (click)="detailsOpen.update((open) => !open)"
          [attr.aria-label]="detailsOpen() ? loc.t('household.hideAdditionalDetails') : loc.t('household.showAdditionalDetails')"
          [attr.title]="detailsOpen() ? loc.t('household.hideAdditionalDetails') : loc.t('household.showAdditionalDetails')"
        >
          <span aria-hidden="true">{{ detailsOpen() ? loc.t('household.hideAdditionalDetails') : loc.t('household.showAdditionalDetails') }}</span>
        </button>

        @if (detailsOpen()) {
          <div class="additional-details">
            <div class="split-fields">
              <label>
                <span>{{ loc.t("household.idealMaxLimitOptional") }}</span>
                <input
                  type="number"
                  step="0.01"
                  name="editorIdealMaxLimit"
                  [ngModel]="draft().idealMaxLimit"
                  (ngModelChange)="patchDraft({ idealMaxLimit: coerceNullableNumber($event) })"
                />
              </label>
              <label>
                <span>{{ loc.t("household.initialAmountOptional") }}</span>
                <input
                  type="number"
                  step="0.01"
                  name="editorInitialAmount"
                  [ngModel]="draft().initialAmount"
                  (ngModelChange)="patchDraft({ initialAmount: coerceNumber($event) })"
                />
              </label>
            </div>

            <div class="split-fields">
              <label>
                <span>{{ loc.t("household.stockGroupKeyOptional") }}</span>
                <input
                  type="text"
                  name="editorStockGroupKey"
                  [ngModel]="draft().stockGroupKey"
                  (ngModelChange)="patchDraft({ stockGroupKey: $event })"
                />
              </label>
              <label>
                <span>{{ loc.t("household.productSourceIdOptional") }}</span>
                <input
                  type="text"
                  name="editorProductSourceId"
                  [ngModel]="draft().productSourceId"
                  (ngModelChange)="patchDraft({ productSourceId: $event })"
                />
              </label>
            </div>

            <label>
              <span>{{ loc.t("household.gtinOptional") }}</span>
              <input
                type="text"
                name="editorGtin"
                inputmode="numeric"
                [ngModel]="draft().gtin"
                (ngModelChange)="patchDraft({ gtin: $event })"
              />
            </label>

            <div class="split-fields">
              <label>
                <span>{{ loc.t("household.sourceNameOptional") }}</span>
                <input
                  type="text"
                  name="editorSourceName"
                  [ngModel]="draft().sourceName"
                  (ngModelChange)="patchDraft({ sourceName: $event })"
                />
              </label>
              <label>
                <span>{{ loc.t("household.sourceProductUrlOptional") }}</span>
                <input
                  type="url"
                  name="editorSourceProductUrl"
                  [ngModel]="draft().sourceProductUrl"
                  (ngModelChange)="patchDraft({ sourceProductUrl: $event })"
                />
              </label>
            </div>

            <label>
              <span>{{ loc.t("editor.note") }}</span>
              <textarea
                name="editorNote"
                rows="3"
                [ngModel]="draft().note"
                (ngModelChange)="patchDraft({ note: $event })"
              ></textarea>
            </label>
          </div>
        }

        <div class="editor-actions">
          <button class="ui-button ui-button-warm add-new-button" type="button" (click)="startCreateRequested.emit()" [disabled]="saving()">
            {{ loc.t("household.addNewItem") }}
          </button>
          <button class="ui-button ui-button-primary" type="submit" [disabled]="saving()">
            {{ saving() ? loc.t("common.loading") : loc.t("common.save") }}
          </button>
          @if (mode() === "edit") {
            <button class="ui-button ui-button-quiet" type="button" (click)="archiveRequested.emit()" [disabled]="saving()">
              {{ loc.t("common.delete") }}
            </button>
          }
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .editor-panel {
        align-content: start;
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      h2,
      p {
        margin: 0;
      }

      .stock-form,
      .additional-details {
        display: grid;
        gap: var(--space-3);
      }

      .stock-form label {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.75rem;
        font-weight: 800;
        gap: 0.3rem;
      }

      .stock-form input,
      .stock-form textarea {
        background: var(--form-field-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.2rem;
        padding: 0.45rem 0.55rem;
      }

      .stock-form textarea {
        min-height: 6rem;
        resize: vertical;
      }

      .split-fields,
      .editor-actions {
        align-items: end;
        display: flex;
        gap: var(--space-3);
      }

      .split-fields {
        align-items: stretch;
      }

      .split-fields label {
        flex: 1 1 0;
      }

      .amount-stepper {
        display: grid;
        gap: 0.35rem;
        grid-template-columns: 2.35rem minmax(0, 1fr) 2.35rem;
      }

      .amount-stepper button {
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        font: inherit;
        font-size: 1rem;
        font-weight: 900;
        min-height: 2.2rem;
        padding: 0;
      }

      .amount-stepper button:hover,
      .amount-stepper button:focus-visible {
        border-color: var(--line-strong);
      }

      .icon-button {
        min-width: 2.35rem;
        padding-inline: 0;
      }

      .details-toggle {
        align-items: center;
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-weight: 800;
        justify-content: center;
        min-height: 2.4rem;
        padding: 0.45rem;
      }

      .additional-details {
        border-top: 1px solid var(--line-subtle);
        padding-top: var(--space-3);
      }

      @media (max-width: 740px) {
        .split-fields,
        .editor-actions {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `
  ]
})
export class HouseholdStockEditorComponent {
  readonly loc = inject(LocalizationService);

  readonly draftInput = input.required<HouseholdStockDraft>();
  readonly mode = input.required<HouseholdStockEditorMode>();
  readonly revision = input.required<number>();
  readonly saving = input.required<boolean>();

  readonly archiveRequested = output<void>();
  readonly saveRequested = output<HouseholdStockDraft>();
  readonly startCreateRequested = output<void>();

  readonly detailsOpen = signal(false);
  readonly draft = signal<HouseholdStockDraft>(createDraft());

  private readonly syncDraft = effect(() => {
    this.revision();
    this.detailsOpen.set(false);
    this.draft.set({ ...this.draftInput() });
  });

  editorTitle(): string {
    if (this.mode() === "create") {
      return this.loc.t("household.addStockTitle");
    }

    return this.draft().displayName || this.loc.t("household.editorTitle");
  }

  adjustMinLimit(delta: number): void {
    this.patchDraft({
      minLimit: clampAmount(this.draft().minLimit + delta)
    });
  }

  patchDraft(patch: Partial<HouseholdStockDraft>): void {
    this.draft.update((current) => ({ ...current, ...patch }));
  }

  setDisplayName(value: string): void {
    const current = this.draft();
    const previousSlug = normalizeStockGroupKey(current.displayName);
    this.patchDraft({
      displayName: value,
      stockGroupKey: !current.stockGroupKey || current.stockGroupKey === previousSlug
        ? normalizeStockGroupKey(value)
        : current.stockGroupKey
    });
  }

  coerceNumber(value: number | string): number {
    return Number(value);
  }

  coerceNullableNumber(value: number | string | null): number | null {
    if (value === "" || value === null) {
      return null;
    }

    return Number(value);
  }
}

function clampAmount(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

function createDraft(): HouseholdStockDraft {
  return {
    currentAmount: 0,
    displayName: "",
    gtin: "",
    id: "",
    idealMaxLimit: null,
    initialAmount: 0,
    minLimit: 1,
    note: "",
    productSourceId: "",
    sourceName: "",
    sourceProductUrl: "",
    stockedAt: todayDateInputValue(),
    stockGroupKey: "",
    unit: "db"
  };
}

function normalizeStockGroupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}
