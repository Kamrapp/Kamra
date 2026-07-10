import { FormsModule } from "@angular/forms";
import { Component, EventEmitter, Input, Output, computed, inject, signal, type OnChanges, type SimpleChanges } from "@angular/core";

import {
  HouseholdStockService,
  type HouseholdShop,
  type HouseholdShoppingList,
  type HouseholdShoppingListLine,
  type HouseholdStockPage
} from "./household-stock.service";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

interface QuickAddDraft {
  displayName: string;
  purchasedAmount: number;
  unit: string;
}

interface PendingConfirmation {
  allowedModes: Array<"tick_all_and_update" | "update_ticked_only">;
}

@Component({
  selector: "app-household-shopping-list",
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="shopping-card" [attr.aria-label]="loc.t('household.shoppingListPanelTitle')">
      <div class="shopping-card-topline">
        <div>
          <p class="card-kicker">{{ loc.t("household.shoppingListKicker") }}</p>
          <h2>{{ loc.t("household.shoppingListPanelTitle") }}</h2>
        </div>

        <div class="shopping-card-actions">
          <button
            class="ui-button ui-button-quiet ui-button-sm"
            type="button"
            (click)="reloadShoppingList()"
            [disabled]="loadState() === 'loading' || !householdId"
          >
            {{ loc.t("common.refresh") }}
          </button>
          <button
            class="ui-button ui-button-primary ui-button-sm"
            type="button"
            (click)="generateShoppingList()"
            [disabled]="loadState() === 'loading' || mutationState() === 'saving' || !householdId"
          >
            {{ shoppingList() ? loc.t("household.regenerateShoppingList") : loc.t("household.generateShoppingList") }}
          </button>
        </div>
      </div>

      <p class="shopping-scale-copy">
        {{ loc.t("household.shoppingListScaleLabel") }}:
        <strong>{{ shoppingScaleLabel() }}</strong>
      </p>

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
        <div class="shopping-toolbar">
          <label>
            <span>{{ loc.t("household.shoppingListShop") }}</span>
            <select
              [ngModel]="shoppingList()!.shopId ?? ''"
              (ngModelChange)="changeShop($event)"
              [disabled]="mutationState() === 'saving'"
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
              [disabled]="mutationState() === 'saving'"
            />
          </label>

          <button
            class="ui-button ui-button-primary ui-button-sm"
            type="button"
            (click)="applyPurchasedItems()"
            [disabled]="mutationState() === 'saving' || shoppingList()!.items.length === 0"
          >
            {{ loc.t("household.applyShoppingListToStock") }}
          </button>
        </div>

        @if (pendingConfirmation(); as confirmation) {
          <section class="confirmation-panel">
            <p>{{ loc.t("household.shoppingListConfirmationPrompt") }}</p>
            <div class="confirmation-actions">
              @if (confirmation.allowedModes.includes("tick_all_and_update")) {
                <button class="ui-button ui-button-primary ui-button-sm" type="button" (click)="applyPurchasedItems('tick_all_and_update')">
                  {{ loc.t("household.tickAllAndApply") }}
                </button>
              }
              @if (confirmation.allowedModes.includes("update_ticked_only")) {
                <button class="ui-button ui-button-quiet ui-button-sm" type="button" (click)="applyPurchasedItems('update_ticked_only')">
                  {{ loc.t("household.applyTickedOnly") }}
                </button>
              }
              <button class="ui-button ui-button-quiet ui-button-sm" type="button" (click)="pendingConfirmation.set(null)">
                {{ loc.t("common.close") }}
              </button>
            </div>
          </section>
        }

        <div class="quick-add-row">
          <input
            type="text"
            [ngModel]="quickAddDraft().displayName"
            (ngModelChange)="updateQuickAddText($event)"
            [placeholder]="loc.t('household.quickAddPlaceholder')"
          />
          <input
            type="number"
            step="0.01"
            [ngModel]="quickAddDraft().purchasedAmount"
            (ngModelChange)="updateQuickAddAmount($event)"
          />
          <input
            type="text"
            [ngModel]="quickAddDraft().unit"
            (ngModelChange)="updateQuickAddUnit($event)"
            [placeholder]="loc.t('household.unit')"
          />
          <button class="ui-button ui-button-quiet ui-button-sm" type="button" (click)="addManualLine()">
            {{ loc.t("household.quickAddAction") }}
          </button>
        </div>

        <div class="shopping-list-shell">
          @for (item of shoppingList()!.items; track item.id) {
            <article class="shopping-line" [class.shopping-line-ticked]="item.ticked">
              <div class="shopping-line-row">
                <label class="shopping-check">
                  <input
                    type="checkbox"
                    [checked]="item.ticked"
                    (change)="toggleTicked(item.id, $any($event.target).checked)"
                    [disabled]="mutationState() === 'saving'"
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
                    />
                  </label>
                  <label>
                    <span>{{ loc.t("household.purchasedShort") }}</span>
                    <input
                      type="number"
                      step="0.01"
                      [ngModel]="item.purchasedAmount"
                      (ngModelChange)="updateLineNumber(item.id, 'purchasedAmount', $event)"
                    />
                  </label>
                  <label class="shopping-unit">
                    <span>{{ loc.t("household.unit") }}</span>
                    <input
                      type="text"
                      [ngModel]="item.unit"
                      (ngModelChange)="updateLineText(item.id, 'unit', $event)"
                    />
                  </label>
                </div>

                <button class="details-toggle" type="button" (click)="toggleExpanded(item.id)">
                  <span>{{ expandedLineIds().includes(item.id) ? loc.t("household.hideAdditionalDetails") : loc.t("household.showAdditionalDetails") }}</span>
                  <strong aria-hidden="true">{{ expandedLineIds().includes(item.id) ? "−" : "+" }}</strong>
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
                      />
                    </label>
                    <label>
                      <span>{{ loc.t("household.currencyCode") }}</span>
                      <input
                        type="text"
                        [ngModel]="item.observedPrice?.currencyCode ?? defaultCurrencyCode"
                        (ngModelChange)="updateObservedPriceCurrency(item.id, $event)"
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
            </article>
          } @empty {
            <p class="shopping-note">{{ loc.t("household.shoppingListNoItems") }}</p>
          }
        </div>
      }

      @if (statusMessage()) {
        <p class="shopping-note">{{ statusMessage() }}</p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .shopping-card {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      .shopping-card-topline,
      .shopping-card-actions,
      .shopping-toolbar,
      .quick-add-row,
      .shopping-line-row,
      .shopping-amounts,
      .confirmation-actions {
        align-items: center;
        display: flex;
        gap: var(--space-3);
      }

      .shopping-card-topline,
      .shopping-toolbar {
        justify-content: space-between;
      }

      .shopping-scale-copy,
      .shopping-note,
      .shopping-muted,
      .shopping-meta p {
        margin: 0;
      }

      .shopping-empty,
      .confirmation-panel {
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

      .shopping-toolbar,
      .quick-add-row {
        flex-wrap: wrap;
      }

      .shopping-toolbar label,
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

      .shopping-list-shell {
        display: grid;
        gap: 0.75rem;
        max-height: 28rem;
        overflow: auto;
      }

      .shopping-line {
        background: var(--pulse-row-background);
        border: 1px solid var(--pulse-row-border);
        border-radius: var(--radius-ui);
        display: grid;
        gap: 0.75rem;
        padding: 0.8rem;
      }

      .shopping-line-ticked {
        opacity: 0.68;
      }

      .shopping-line-row {
        align-items: flex-start;
        justify-content: space-between;
      }

      .shopping-check {
        align-items: center;
        display: flex;
        gap: 0.6rem;
        font-weight: 800;
      }

      .shopping-amounts {
        flex: 1 1 auto;
        justify-content: flex-end;
      }

      .shopping-amounts input {
        width: 6.5rem;
      }

      .shopping-unit input {
        width: 4.5rem;
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
        gap: 0.6rem;
        justify-content: space-between;
        min-height: 2.3rem;
        padding: 0.45rem 0.65rem;
      }

      @media (max-width: 900px) {
        .shopping-card-topline,
        .shopping-toolbar,
        .shopping-line-row,
        .shopping-amounts,
        .shopping-detail-fields {
          align-items: stretch;
          flex-direction: column;
        }

        .shopping-amounts {
          width: 100%;
        }

        .shopping-amounts input,
        .shopping-unit input {
          width: 100%;
        }
      }
    `
  ]
})
export class HouseholdShoppingListComponent implements OnChanges {
  @Input({ required: true }) householdId = "";
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
  readonly quickAddDraft = signal<QuickAddDraft>({
    displayName: "",
    purchasedAmount: 1,
    unit: "db"
  });
  readonly shoppingList = signal<HouseholdShoppingList | null>(null);
  readonly shops = signal<HouseholdShop[]>([]);
  readonly statusMessage = signal("");
  readonly shoppingScaleLabel = computed(() => {
    const key = this.shoppingScale === "business_as_usual"
      ? "household.shoppingScaleUsual"
      : this.shoppingScale === "keep_it_chill"
        ? "household.shoppingScaleChill"
        : "household.shoppingScaleStockUp";

    return this.loc.t(key);
  });
  readonly stockAppliedAt = signal(todayDateInputValue());
  private loadSerial = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["householdId"]?.currentValue) {
      void this.loadPanelState();
    }
  }

  async addManualLine(): Promise<void> {
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
    if (!this.householdId) {
      return;
    }

    this.mutationState.set("saving");
    this.errorMessage.set("");
    const result = await this.household.createShoppingList({
      householdId: this.householdId,
      scale: this.shoppingScale,
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

  async reloadShoppingList(): Promise<void> {
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
      at_limit: "household.reasonAtLimit",
      below_minimum: "household.reasonBelowMinimum",
      low_soon: "household.reasonLowSoon",
      stock_up: "household.reasonStockUp"
    } as const;

    return keys[reasonCode];
  }

  toggleExpanded(id: string): void {
    this.expandedLineIds.update((ids) =>
      ids.includes(id)
        ? ids.filter((existingId) => existingId !== id)
        : [...ids, id]
    );
  }

  async toggleTicked(id: string, ticked: boolean): Promise<void> {
    await this.updateLine(id, (item) => ({
      ...item,
      ticked
    }));
  }

  async updateLineNumber(
    id: string,
    field: "plannedAmount" | "purchasedAmount",
    value: number | string
  ): Promise<void> {
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
    await this.updateLine(id, (item) => ({
      ...item,
      [field]: value
    }));
  }

  async updateObservedPriceAmount(id: string, value: number | string): Promise<void> {
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

  private async loadPanelState(): Promise<void> {
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
