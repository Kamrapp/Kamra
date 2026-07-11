import { NgTemplateOutlet } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, EventEmitter, Input, Output, computed, inject, signal, type OnChanges, type SimpleChanges } from "@angular/core";

import {
  HouseholdStockService,
  type HouseholdShop,
  type HouseholdShoppingList,
  type HouseholdShoppingListLine,
  type HouseholdStockItemListItem,
  type HouseholdStockPage
} from "./household-stock.service";
import {
  ShoppingListCompletionPanelComponent,
  type ShoppingListCompletionMode
} from "./shopping-list-completion-panel.component";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

interface QuickAddDraft {
  displayName: string;
  purchasedAmount: number;
  unit: string;
}

interface PendingConfirmation {
  allowedModes: ShoppingListCompletionMode[];
}

@Component({
  selector: "app-household-shopping-list",
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, ShoppingListCompletionPanelComponent],
  template: `
    <section class="ui-panel-card shopping-card" [attr.aria-label]="loc.t('household.shoppingListPanelTitle')">
      <div class="shopping-layout">
        <section class="shopping-overview">
          <div class="shopping-card-topline">
            <div>
              <p class="ui-kicker">{{ loc.t("household.shoppingListKicker") }}</p>
              <h2 class="ui-card-title">{{ loc.t("household.shoppingListPanelTitle") }}</h2>
            </div>
          </div>

          @if (loadState() === "loading" && !shoppingList()) {
            <p class="shopping-note">{{ loc.t("household.shoppingListLoading") }}</p>
          } @else if (errorMessage()) {
            <div class="shopping-note shopping-error">
              <strong>{{ loc.t("household.shoppingListLoadFailure") }}</strong>
              <p>{{ errorMessage() }}</p>
            </div>
          } @else if (!shoppingList()) {
            <div class="shopping-empty">
              <p>{{ loc.t("household.shoppingListEmpty") }}</p>
              <p class="shopping-muted">{{ loc.t("household.shoppingListEmptyHint") }}</p>
            </div>
          } @else {
            <div class="quick-add-row">
              <input
                type="text"
                [ngModel]="quickAddDraft().displayName"
                (ngModelChange)="updateQuickAddText($event)"
                [placeholder]="loc.t('household.quickAddPlaceholder')"
                [disabled]="isReadOnly()"
              />
              <input
                type="number"
                step="0.01"
                [ngModel]="quickAddDraft().purchasedAmount"
                (ngModelChange)="updateQuickAddAmount($event)"
                [disabled]="isReadOnly()"
              />
              <input
                type="text"
                [ngModel]="quickAddDraft().unit"
                (ngModelChange)="updateQuickAddUnit($event)"
                [placeholder]="loc.t('household.unit')"
                [disabled]="isReadOnly()"
              />
              <button
                class="ui-button ui-button-quiet ui-button-sm icon-button"
                type="button"
                (click)="addManualLine()"
                [disabled]="isReadOnly()"
                [attr.aria-label]="loc.t('household.quickAddAction')"
                [attr.title]="loc.t('household.quickAddAction')"
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>

            <div class="shopping-list-table">
              @if (pendingItems().length || purchasedItems().length) {
                <div class="shopping-list-header" aria-hidden="true">
                  <span></span>
                  <span>{{ loc.t("household.plannedShort") }}</span>
                  <span>{{ loc.t("household.purchasedShort") }}</span>
                  <span>{{ loc.t("household.unit") }}</span>
                  <span></span>
                </div>
              }

              <div class="shopping-list-shell">
                @if (pendingItems().length) {
                  @for (item of pendingItems(); track item.id) {
                    <article class="shopping-line">
                      <ng-container [ngTemplateOutlet]="shoppingLineTemplate" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
                    </article>
                  }
                } @else if (!purchasedItems().length) {
                  <p class="shopping-note">{{ loc.t("household.shoppingListNoItems") }}</p>
                }

                @if (purchasedItems().length) {
                  <section class="purchased-group">
                    <button class="purchased-toggle" type="button" (click)="togglePurchasedSection()" [disabled]="isReadOnly()">
                      <span>{{ loc.t("household.shoppingListPurchasedGroup", { count: purchasedItems().length }) }}</span>
                      <strong aria-hidden="true">{{ purchasedSectionCollapsed() ? "+" : "−" }}</strong>
                    </button>

                    @if (!purchasedSectionCollapsed()) {
                      <div class="purchased-shell">
                        @for (item of purchasedItems(); track item.id) {
                          <article class="shopping-line shopping-line-ticked">
                            <ng-container [ngTemplateOutlet]="shoppingLineTemplate" [ngTemplateOutletContext]="{ $implicit: item }"></ng-container>
                          </article>
                        }
                      </div>
                    }
                  </section>
                }
              </div>
            </div>
          }
        </section>

        <section class="shopping-finalize">
          <div>
            <p class="ui-kicker">{{ loc.t("household.shoppingListFinalizeKicker") }}</p>
            <h3 class="finalize-title">{{ loc.t("household.shoppingListFinalizeTitle") }}</h3>
          </div>

          @if (shoppingList()) {
            <label>
              <span>{{ loc.t("household.shoppingListShop") }}</span>
              <select
                [ngModel]="shoppingList()!.shopId ?? ''"
                (ngModelChange)="changeShop($event)"
                [disabled]="isReadOnly() || mutationState() === 'saving'"
              >
                <option value="">{{ loc.t("household.shoppingListShopNone") }}</option>
                @for (shop of shops(); track shop.id) {
                  <option [value]="shop.id">{{ shop.label }}</option>
                }
              </select>
            </label>

            <label>
              <span>{{ loc.t("household.shoppingListAppliedDate") }}</span>
              <input
                type="date"
                [ngModel]="stockAppliedAt()"
                (ngModelChange)="setStockAppliedDate($event)"
                [disabled]="isReadOnly() || mutationState() === 'saving'"
              />
            </label>

            <button
              class="ui-button ui-button-primary"
              type="button"
              (click)="applyPurchasedItems()"
              [disabled]="isReadOnly() || mutationState() === 'saving' || shoppingList()!.items.length === 0"
            >
              {{ loc.t("household.applyShoppingListToStock") }}
            </button>

            @if (pendingConfirmation(); as confirmation) {
              <app-shopping-list-completion-panel
                [allowedModes]="confirmation.allowedModes"
                (cancelRequested)="pendingConfirmation.set(null)"
                (confirmRequested)="applyPurchasedItems($event)"
              />
            }

            <button class="ui-button ui-button-quiet receipt-button" type="button" (click)="notifyReceiptUploadComingSoon()" [disabled]="isReadOnly()">
              {{ loc.t("household.uploadReceipt") }}
            </button>
          } @else {
            <div class="shopping-empty">
              <p>{{ loc.t("household.shoppingListFinalizeEmpty") }}</p>
              <p class="shopping-muted">{{ loc.t("household.shoppingListFinalizeEmptyHint") }}</p>
            </div>
          }
        </section>
      </div>

      @if (statusMessage()) {
        <p class="shopping-note">{{ statusMessage() }}</p>
      }

      <ng-template #shoppingLineTemplate let-item>
        <div class="shopping-line-row">
          <label class="shopping-check">
            <input
              type="checkbox"
              [checked]="item.ticked"
              (change)="toggleTicked(item.id, $any($event.target).checked)"
              [disabled]="isReadOnly() || mutationState() === 'saving'"
            />
            <span>{{ item.displayName }}</span>
          </label>

          <div class="shopping-amounts">
            <label>
              <span>{{ loc.t("household.plannedShort") }}</span>
              <input
                type="number"
                step="0.01"
                [ngModel]="item.plannedAmount"
                (ngModelChange)="updateLineNumber(item.id, 'plannedAmount', $event)"
                [disabled]="isReadOnly()"
              />
            </label>
            <label>
              <span>{{ loc.t("household.purchasedShort") }}</span>
              <input
                type="number"
                step="0.01"
                [ngModel]="item.purchasedAmount"
                (ngModelChange)="updateLineNumber(item.id, 'purchasedAmount', $event)"
                [disabled]="isReadOnly()"
              />
            </label>
            <label class="shopping-unit">
              <span>{{ loc.t("household.unit") }}</span>
              <input
                type="text"
                [ngModel]="item.unit"
                (ngModelChange)="updateLineText(item.id, 'unit', $event)"
                [disabled]="isReadOnly()"
              />
            </label>
          </div>

          <button
            class="details-toggle icon-button"
            type="button"
            (click)="toggleExpanded(item.id)"
            [disabled]="isReadOnly()"
            [attr.aria-label]="expandedLineIds().includes(item.id) ? loc.t('household.hideAdditionalDetails') : loc.t('household.showAdditionalDetails')"
            [attr.title]="expandedLineIds().includes(item.id) ? loc.t('household.hideAdditionalDetails') : loc.t('household.showAdditionalDetails')"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M10.5 4a6.5 6.5 0 0 1 5.18 10.43l3.45 3.44-1.42 1.42-3.44-3.45A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"></path>
              @if (expandedLineIds().includes(item.id)) {
                <path d="M7.5 10h6v1.6h-6V10Z"></path>
              } @else {
                <path d="M9.7 7.8h1.6V10h2.2v1.6h-2.2v2.2H9.7v-2.2H7.5V10h2.2V7.8Z"></path>
              }
            </svg>
          </button>
        </div>

        @if (expandedLineIds().includes(item.id)) {
          <div class="shopping-line-details">
            <div class="shopping-meta">
              <p>{{ loc.t("household.shoppingListTargetAmount", { amount: item.targetAmount }) }}</p>
              <p>{{ loc.t("household.shoppingListSuggestedAmount", { amount: item.suggestedBuyAmount }) }}</p>
              @if (item.reasonCode) {
                <p>{{ loc.t(reasonKey(item.reasonCode)) }}</p>
              }
            </div>

            <div class="shopping-detail-fields">
              <label>
                <span>{{ loc.t("common.price") }}</span>
                <input
                  type="number"
                  step="1"
                  [ngModel]="item.observedPrice?.amount ?? ''"
                  (ngModelChange)="updateObservedPriceAmount(item.id, $event)"
                  [placeholder]="loc.t('household.observedPricePlaceholder')"
                  [disabled]="isReadOnly()"
                />
              </label>
              <label>
                <span>{{ loc.t("household.currencyCode") }}</span>
                <input
                  type="text"
                  [ngModel]="item.observedPrice?.currencyCode ?? defaultCurrencyCode"
                  (ngModelChange)="updateObservedPriceCurrency(item.id, $event)"
                  [disabled]="isReadOnly()"
                />
              </label>
            </div>

            @if (item.uncertaintyFlags.length) {
              <p class="shopping-muted">
                {{ loc.t("household.shoppingListUncertainty") }}:
                {{ describeUncertainty(item) }}
              </p>
            }
          </div>
        }
      </ng-template>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .shopping-card {
        gap: var(--space-4);
      }

      .shopping-card-topline,
      .quick-add-row,
      .shopping-line-row,
      .shopping-amounts {
        align-items: center;
        display: flex;
        gap: var(--space-3);
      }

      .shopping-scale-copy,
      .shopping-note,
      .shopping-muted,
      .shopping-meta p {
        margin: 0;
      }

      .icon-button {
        min-width: 2.35rem;
        padding-inline: 0.45rem;
      }

      .icon-button span {
        display: inline-flex;
        font-size: 1rem;
        font-weight: 900;
        justify-content: center;
        width: 100%;
      }

      .shopping-layout {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
      }

      .shopping-overview,
      .shopping-finalize {
        display: grid;
        gap: var(--space-4);
      }

      .shopping-finalize {
        align-content: start;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        padding: 1rem;
      }

      .shopping-empty {
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: var(--space-2);
        padding: 0.9rem 1rem;
      }

      .shopping-error {
        color: var(--color-status-danger-text);
      }

      .quick-add-row {
        flex-wrap: wrap;
      }

      .shopping-finalize label,
      .shopping-amounts label,
      .shopping-detail-fields label {
        display: grid;
        gap: 0.35rem;
      }

      .shopping-card select,
      .shopping-card input {
        background: var(--form-field-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.2rem;
        padding: 0.45rem 0.55rem;
      }

      .quick-add-row input:first-child {
        flex: 1 1 14rem;
      }

      .quick-add-row input:not(:first-child) {
        width: 7rem;
      }

      .shopping-list-table {
        display: grid;
        gap: 0.45rem;
        min-height: 0;
      }

      .shopping-list-shell {
        display: grid;
        gap: 0.45rem;
        max-height: 28rem;
        overflow: auto;
      }

      .purchased-group,
      .purchased-shell {
        display: grid;
        gap: 0.75rem;
      }

      .shopping-line {
        background: var(--pulse-row-background);
        border: 1px solid var(--pulse-row-border);
        border-radius: var(--radius-ui);
        display: grid;
        gap: 0.55rem;
        padding: 0.55rem 0.65rem;
      }

      .shopping-line-ticked {
        opacity: 0.68;
      }

      .purchased-toggle {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-weight: 800;
        justify-content: space-between;
        min-height: 2.65rem;
        padding: 0.55rem 0.8rem;
      }

      .shopping-line-row {
        align-items: center;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: minmax(10rem, 1fr) minmax(4.8rem, 6.5rem) minmax(4.8rem, 6.5rem) minmax(3.8rem, 4.5rem) 2.2rem;
        justify-content: stretch;
      }

      .shopping-list-header {
        align-items: end;
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.68rem;
        font-weight: 900;
        gap: 0.55rem;
        grid-template-columns: minmax(10rem, 1fr) minmax(4.8rem, 6.5rem) minmax(4.8rem, 6.5rem) minmax(3.8rem, 4.5rem) 2.2rem;
        line-height: 1;
        padding: 0 0.65rem 0.15rem;
      }

      .shopping-check {
        align-items: center;
        display: flex;
        gap: 0.6rem;
        font-weight: 800;
      }

      .shopping-amounts {
        display: contents;
      }

      .shopping-amounts label {
        display: contents;
      }

      .shopping-amounts label span {
        height: 1px;
        margin: -1px;
        overflow: hidden;
        position: absolute;
        width: 1px;
      }

      .shopping-amounts input {
        min-width: 0;
        width: 100%;
      }

      .shopping-line-details {
        border-top: 1px solid var(--line-subtle);
        display: grid;
        gap: 0.75rem;
        padding-top: 0.75rem;
      }

      .shopping-meta {
        display: grid;
        gap: 0.25rem;
      }

      .shopping-detail-fields {
        display: flex;
        gap: var(--space-3);
      }

      .finalize-title {
        margin: 0;
      }

      .receipt-button {
        min-height: 3.25rem;
      }

      .details-toggle {
        align-items: center;
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        display: inline-grid;
        font: inherit;
        font-weight: 800;
        justify-content: center;
        min-height: 2rem;
        min-width: 2rem;
        padding: 0;
        place-items: center;
        white-space: nowrap;
      }

      .details-toggle svg {
        display: block;
        fill: currentColor;
        height: 1rem;
        width: 1rem;
      }

      @media (max-width: 900px) {
        .shopping-layout,
        .shopping-card-topline,
        .shopping-detail-fields {
          align-items: stretch;
          flex-direction: column;
        }

        .shopping-layout {
          display: grid;
          grid-template-columns: 1fr;
        }

        .shopping-amounts {
          display: grid;
          gap: 0.35rem;
          grid-template-columns: minmax(4.8rem, 1fr) minmax(4.8rem, 1fr) minmax(3.8rem, 0.7fr);
        }

        .shopping-line-row {
          grid-template-columns: 1fr;
        }

        .shopping-list-header {
          display: none;
        }

        .shopping-amounts label span {
          height: auto;
          margin: 0;
          overflow: visible;
          position: static;
          width: auto;
        }

        .details-toggle {
          justify-self: start;
        }
      }
    `
  ]
})
export class HouseholdShoppingListComponent implements OnChanges {
  @Input({ required: true }) householdId = "";
  @Input() demoShoppingList: HouseholdShoppingList | null = null;
  @Input() shoppingScale: HouseholdShoppingList["scale"] = "keep_it_chill";
  @Output() stockPageUpdated = new EventEmitter<HouseholdStockPage>();

  readonly loc = inject(LocalizationService);
  private readonly household = inject(HouseholdStockService);
  private readonly toast = inject(ToastService);

  readonly defaultCurrencyCode = "HUF";
  readonly errorMessage = signal("");
  readonly expandedLineIds = signal<string[]>([]);
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly mutationState = signal<"idle" | "saving">("idle");
  readonly pendingConfirmation = signal<PendingConfirmation | null>(null);
  readonly purchasedSectionCollapsed = signal(true);
  readonly quickAddDraft = signal<QuickAddDraft>({
    displayName: "",
    purchasedAmount: 1,
    unit: "db"
  });
  readonly shoppingScaleValue = signal<HouseholdShoppingList["scale"]>("keep_it_chill");
  readonly shoppingList = signal<HouseholdShoppingList | null>(null);
  readonly shops = signal<HouseholdShop[]>([]);
  readonly statusMessage = signal("");
  readonly shoppingScaleLabel = computed(() => {
    const key = this.shoppingScaleValue() === "business_as_usual"
      ? "household.shoppingScaleUsual"
      : this.shoppingScaleValue() === "keep_it_chill"
        ? "household.shoppingScaleChill"
        : this.shoppingScaleValue() === "start_fresh"
          ? "household.shoppingScaleStartFresh"
          : "household.shoppingScaleStockUp";

    return this.loc.t(key);
  });
  readonly pendingItems = computed(() =>
    [...(this.shoppingList()?.items ?? [])]
      .filter((item) => !item.ticked)
      .sort(compareShoppingLines)
  );
  readonly purchasedItems = computed(() =>
    [...(this.shoppingList()?.items ?? [])]
      .filter((item) => item.ticked)
      .sort(compareShoppingLines)
  );
  readonly stockAppliedAt = signal(todayDateInputValue());
  private loadSerial = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["shoppingScale"]) {
      this.shoppingScaleValue.set(changes["shoppingScale"].currentValue ?? "keep_it_chill");
    }

    if (changes["demoShoppingList"]) {
      this.applyDemoShoppingList();
      return;
    }

    if (this.demoShoppingList) {
      return;
    }

    if (changes["householdId"]?.currentValue) {
      void this.loadPanelState();
    }
  }

  isReadOnly(): boolean {
    return this.demoShoppingList !== null;
  }

  async addManualLine(): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    const draft = this.quickAddDraft();
    if (!list) {
      this.toast.push(this.loc.t("household.generateShoppingList"), "info");
      return;
    }

    if (!draft.displayName.trim() || !draft.unit.trim()) {
      this.toast.push(this.loc.t("household.quickAddInvalid"), "warning");
      return;
    }

    const manualLine: HouseholdShoppingListLine = {
      currentAmount: 0,
      displayName: draft.displayName.trim(),
      id: `manual_${Date.now()}_${normalizeStockGroupKey(draft.displayName)}`,
      idealMaxLimit: null,
      minLimit: 0,
      observedPrice: null,
      plannedAmount: coerceNumber(draft.purchasedAmount, 1),
      purchasedAmount: coerceNumber(draft.purchasedAmount, 1),
      reasonCode: null,
      sourceKind: "manual",
      status: "not_applied",
      stockGroupKey: normalizeStockGroupKey(draft.displayName),
      suggestedBuyAmount: coerceNumber(draft.purchasedAmount, 1),
      targetAmount: coerceNumber(draft.purchasedAmount, 1),
      ticked: false,
      uncertaintyFlags: ["missing_catalog_product", "missing_product_source"],
      unit: draft.unit.trim()
    };
    const nextItems = [
      ...list.items,
      manualLine
    ];

    this.quickAddDraft.set({
      displayName: "",
      purchasedAmount: 1,
      unit: draft.unit.trim()
    });
    await this.persistShoppingList({
      ...list,
      items: nextItems
    }, this.loc.t("household.quickAddSaved"));
  }

  async applyPurchasedItems(confirmationMode?: "tick_all_and_update" | "update_ticked_only"): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      return;
    }

    this.mutationState.set("saving");
    this.errorMessage.set("");
    const result = await this.household.updateShoppingListStocks({
      confirmationMode: confirmationMode ?? null,
      householdId: list.householdId,
      id: list.id,
      stockAppliedAt: this.stockAppliedAt()
    });
    this.mutationState.set("idle");

    if (result.status === "confirmation_required") {
      this.pendingConfirmation.set({
        allowedModes: result.allowedConfirmationModes
      });
      this.shoppingList.set(result.shoppingList);
      return;
    }

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.pendingConfirmation.set(null);
    this.shoppingList.set(result.shoppingList);
    this.stockPageUpdated.emit(result.householdStockPage);
    this.statusMessage.set(this.loc.t("household.shoppingListApplySuccess", { count: result.appliedLineCount }));
  }

  async changeShop(shopId: string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      return;
    }

    await this.persistShoppingList({
      ...list,
      shopId: shopId || null
    });
  }

  async generateShoppingList(): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    if (!this.householdId) {
      return;
    }

    this.mutationState.set("saving");
    this.errorMessage.set("");
    const result = await this.household.createShoppingList({
      householdId: this.householdId,
      scale: this.shoppingScaleValue(),
      shopId: this.shoppingList()?.shopId ?? null
    });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.pendingConfirmation.set(null);
    this.shoppingList.set(result.shoppingList);
    this.stockAppliedAt.set(readPreferredStockAppliedAt(result.shoppingList.stockAppliedAt));
    this.statusMessage.set(this.loc.t("household.shoppingListGenerated", { count: result.shoppingList.items.length }));
  }

  async cancelShoppingList(): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      return;
    }

    this.pendingConfirmation.set(null);
    this.mutationState.set("saving");
    const result = await this.household.updateShoppingList({
      householdId: list.householdId,
      id: list.id,
      status: "archived"
    });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.shoppingList.set(null);
    this.stockAppliedAt.set(todayDateInputValue());
    this.statusMessage.set(this.loc.t("household.shoppingListCancelled"));
  }

  async reloadShoppingList(): Promise<void> {
    if (this.isReadOnly()) {
      this.applyDemoShoppingList();
      return;
    }

    await this.loadPanelState();
  }

  describeUncertainty(item: HouseholdShoppingListLine): string {
    return item.uncertaintyFlags
      .map((flag) => this.loc.t(flag === "missing_catalog_product"
        ? "household.uncertaintyMissingCatalogProduct"
        : "household.uncertaintyMissingProductSource"))
      .join(", ");
  }

  reasonKey(reasonCode: NonNullable<HouseholdShoppingListLine["reasonCode"]>): "household.reasonAtLimit" | "household.reasonBelowMinimum" | "household.reasonLowSoon" | "household.reasonStockUp" {
    const keys = {
      at_minimum: "household.reasonAtLimit",
      below_minimum: "household.reasonBelowMinimum",
      broad_restock: "household.reasonStockUp",
      low_soon: "household.reasonLowSoon",
    } as const;

    return keys[reasonCode];
  }

  toggleExpanded(id: string): void {
    if (this.isReadOnly()) {
      return;
    }

    this.expandedLineIds.update((ids) =>
      ids.includes(id)
        ? ids.filter((existingId) => existingId !== id)
        : [...ids, id]
    );
  }

  async toggleTicked(id: string, ticked: boolean): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    if (ticked) {
      this.purchasedSectionCollapsed.set(true);
    }

    await this.updateLine(id, (item) => ({
      ...item,
      purchasedAmount: ticked && item.purchasedAmount === 0 ? item.plannedAmount : item.purchasedAmount,
      ticked
    }));
  }

  togglePurchasedSection(): void {
    this.purchasedSectionCollapsed.update((collapsed) => !collapsed);
  }

  hasShoppingLineForStockItem(stockItemId: string): boolean {
    return (this.shoppingList()?.items ?? []).some((item) => item.householdStockItemId === stockItemId);
  }

  notifyReceiptUploadComingSoon(): void {
    this.toast.push(this.loc.t("household.receiptUploadComingSoon"), "info");
  }

  async addStockItemFromHouseholdStock(
    item: HouseholdStockItemListItem,
    planning: {
      plannedAmount: number;
      reasonCode: HouseholdShoppingListLine["reasonCode"];
      targetAmount: number;
    }
  ): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      this.toast.push(this.loc.t("household.shoppingListAddRequiresExisting"), "info");
      return;
    }

    if (this.hasShoppingLineForStockItem(item.id)) {
      return;
    }

    const manualLine: HouseholdShoppingListLine = {
      catalogProductId: item.catalogProductId ?? null,
      catalogProductNameSnapshot: item.catalogProductNameSnapshot ?? null,
      currentAmount: item.currentAmount,
      displayName: item.displayName,
      gtin: item.gtin ?? null,
      householdProductId: item.householdProductId,
      householdStockItemId: item.id,
      id: `manual_stock_${Date.now()}_${normalizeStockGroupKey(item.displayName)}`,
      idealMaxLimit: item.idealMaxLimit ?? null,
      minLimit: item.minLimit,
      observedPrice: null,
      plannedAmount: Math.max(0, planning.plannedAmount),
      productSourceId: item.productSourceId ?? null,
      purchasedAmount: 0,
      reasonCode: planning.reasonCode,
      sourceKind: "manual",
      sourceName: item.sourceName ?? null,
      sourceProductUrl: item.sourceProductUrl ?? null,
      status: "not_applied",
      stockGroupKey: item.stockGroupKey,
      stockStatus: item.stockStatus,
      suggestedBuyAmount: Math.max(0, planning.plannedAmount),
      targetAmount: planning.targetAmount,
      ticked: false,
      uncertaintyFlags: [
        ...(item.catalogProductId ? [] : ["missing_catalog_product" as const]),
        ...(item.productSourceId ? [] : ["missing_product_source" as const])
      ],
      unit: item.unit
    };

    await this.persistShoppingList({
      ...list,
      items: [...list.items, manualLine]
    }, this.loc.t("household.shoppingListAddItemSuccess", { name: item.displayName }));
  }

  async updateLineNumber(
    id: string,
    field: "plannedAmount" | "purchasedAmount",
    value: number | string
  ): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      [field]: coerceNumber(value, item[field])
    }));
  }

  async updateLineText(
    id: string,
    field: "unit",
    value: string
  ): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      [field]: value
    }));
  }

  async updateObservedPriceAmount(id: string, value: number | string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      observedPrice: value === "" || value === null
        ? null
        : {
            amount: Math.max(0, Math.round(coerceNumber(value, item.observedPrice?.amount ?? 0))),
            currencyCode: item.observedPrice?.currencyCode ?? this.defaultCurrencyCode,
            observedAt: item.observedPrice?.observedAt ?? toObservedAt(this.stockAppliedAt())
          }
    }));
  }

  async updateObservedPriceCurrency(id: string, value: string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      observedPrice: {
        amount: item.observedPrice?.amount ?? 0,
        currencyCode: value.trim() || this.defaultCurrencyCode,
        observedAt: item.observedPrice?.observedAt ?? toObservedAt(this.stockAppliedAt())
      }
    }));
  }

  updateQuickAddAmount(value: number | string): void {
    this.quickAddDraft.update((draft) => ({
      ...draft,
      purchasedAmount: coerceNumber(value, draft.purchasedAmount)
    }));
  }

  updateQuickAddText(value: string): void {
    this.quickAddDraft.update((draft) => ({
      ...draft,
      displayName: value
    }));
  }

  updateQuickAddUnit(value: string): void {
    this.quickAddDraft.update((draft) => ({
      ...draft,
      unit: value
    }));
  }

  setStockAppliedDate(value: string): void {
    this.stockAppliedAt.set(value || todayDateInputValue());
  }

  private applyDemoShoppingList(): void {
    const demoList = this.demoShoppingList;
    if (!demoList) {
      return;
    }

    this.errorMessage.set("");
    this.loadState.set("ready");
    this.mutationState.set("idle");
    this.pendingConfirmation.set(null);
    this.purchasedSectionCollapsed.set(true);
    this.shoppingList.set(demoList);
    this.shops.set([]);
    this.stockAppliedAt.set(readPreferredStockAppliedAt(demoList.stockAppliedAt));
    this.statusMessage.set("");
  }

  private async loadPanelState(): Promise<void> {
    if (this.isReadOnly()) {
      this.applyDemoShoppingList();
      return;
    }

    if (!this.householdId) {
      this.shoppingList.set(null);
      this.shops.set([]);
      return;
    }

    const currentLoad = ++this.loadSerial;
    this.loadState.set("loading");
    this.errorMessage.set("");
    this.statusMessage.set("");
    this.pendingConfirmation.set(null);

    const [listResult, shopsResult] = await Promise.all([
      this.household.loadLatestShoppingList(this.householdId),
      this.household.listShops()
    ]);
    if (currentLoad !== this.loadSerial) {
      return;
    }

    if (shopsResult.status === "ok") {
      this.shops.set(shopsResult.shops);
    }

    if (listResult.status === "ok") {
      this.shoppingList.set(listResult.shoppingList);
      this.purchasedSectionCollapsed.set(true);
      this.stockAppliedAt.set(readPreferredStockAppliedAt(listResult.shoppingList.stockAppliedAt));
      this.loadState.set("ready");
      return;
    }

    if (listResult.status === "not_found") {
      this.shoppingList.set(null);
      this.stockAppliedAt.set(todayDateInputValue());
      this.loadState.set("ready");
      return;
    }

    this.loadState.set("error");
    this.errorMessage.set(listResult.message);
  }

  private async persistShoppingList(nextList: HouseholdShoppingList, successMessage?: string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    this.shoppingList.set(nextList);
    this.pendingConfirmation.set(null);
    this.mutationState.set("saving");
    const result = await this.household.updateShoppingList({
      householdId: nextList.householdId,
      id: nextList.id,
      items: nextList.items,
      shopId: nextList.shopId ?? null
    });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.shoppingList.set(result.shoppingList);
    this.statusMessage.set(successMessage ?? this.loc.t("household.shoppingListSaved"));
  }

  private async updateLine(
    id: string,
    updater: (item: HouseholdShoppingListLine) => HouseholdShoppingListLine
  ): Promise<void> {
    const list = this.shoppingList();
    if (!list) {
      return;
    }

    const nextList: HouseholdShoppingList = {
      ...list,
      items: list.items.map((item) => item.id === id ? updater(item) : item)
    };
    await this.persistShoppingList(nextList);
  }
}

function coerceNumber(value: number | string, fallback: number): number {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
}

function normalizeStockGroupKey(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "item";
}

function readPreferredStockAppliedAt(stockAppliedAt: string | null | undefined): string {
  return stockAppliedAt?.slice(0, 10) || todayDateInputValue();
}

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toObservedAt(dateInput: string): string {
  const trimmed = dateInput.trim();
  return trimmed
    ? new Date(`${trimmed}T12:00:00.000Z`).toISOString()
    : new Date().toISOString();
}

function compareShoppingLines(left: HouseholdShoppingListLine, right: HouseholdShoppingListLine): number {
  return left.displayName.localeCompare(right.displayName, "hu-HU");
}
