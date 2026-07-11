import { FormsModule } from "@angular/forms";
import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { HouseholdListItem, HouseholdStockItemListItem } from "./household-stock.service";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";

@Component({
  selector: "app-household-stock-panel",
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="stock-panel" [attr.aria-label]="loc.t('household.stockPanelLabel')">
      <div class="panel-topline">
        <p class="panel-title" id="home-title">{{ loc.t("household.stockPanelTitle") }}</p>
      </div>

      <div class="household-bar">
        <div class="household-picker-group">
          <label class="household-select">
            <span>{{ loc.t("household.activeHousehold") }}</span>
            <select
              [ngModel]="selectedHouseholdId()"
              (ngModelChange)="householdSelected.emit($event)"
              [disabled]="loadState() === 'loading' || households().length === 0"
            >
              @for (household of households(); track household.id) {
                <option [value]="household.id">{{ household.name }}</option>
              }
            </select>
          </label>

          <button
            class="ui-button ui-button-quiet ui-button-sm manage-household-button"
            type="button"
            [routerLink]="selectedHouseholdId() ? ['/household', selectedHouseholdId()] : ['/']"
            [disabled]="!selectedHouseholdId()"
          >
            {{ loc.t("household.manageHousehold") }}
          </button>
        </div>

        <button
          class="ui-button ui-button-quiet ui-button-sm icon-button"
          type="button"
          (click)="refreshRequested.emit()"
          [disabled]="loadState() === 'loading'"
          [attr.aria-label]="loc.t('common.refresh')"
          [attr.title]="loc.t('common.refresh')"
        >
          <span aria-hidden="true">↻</span>
        </button>
      </div>

      @if (loadState() === "loading" && !hasHouseholdPage()) {
        <section class="state-panel">
          <p>{{ loc.t("household.loading") }}</p>
        </section>
      } @else if (errorMessage()) {
        <section class="state-panel state-panel-error">
          <h2>{{ loc.t("household.loadFailure") }}</h2>
          <p>{{ errorMessage() }}</p>
        </section>
      } @else if (!households().length) {
        <section class="state-panel">
          <h2>{{ loc.t("household.noHouseholdTitle") }}</h2>
          <p>{{ loc.t("household.noHouseholdDescription") }}</p>
          <form class="stack-form" (ngSubmit)="submitCreateHousehold()">
            <label>
              <span>{{ loc.t("household.householdName") }}</span>
              <input
                type="text"
                name="householdName"
                [ngModel]="createHouseholdName()"
                (ngModelChange)="createHouseholdName.set($event)"
                [placeholder]="loc.t('household.householdNamePlaceholder')"
              />
            </label>
            <button class="ui-button ui-button-primary" type="submit" [disabled]="loadState() === 'loading'">
              {{ loc.t("household.createHousehold") }}
            </button>
          </form>
        </section>
      } @else if (showStockTable()) {
        <div class="stock-table-shell">
          <div class="stock-table-header" aria-hidden="true">
            <div class="stock-header-main" [class.selection-active]="shoppingSelectionMode()">
              @if (shoppingSelectionMode()) { <span></span> }
              <span>{{ loc.t("common.product") }}</span>
              <span>{{ loc.t("household.currentShort") }}</span>
              <span aria-hidden="true"></span>
              <span>{{ loc.t("household.minShort") }}</span>
              <span>{{ loc.t("common.state") }}</span>
            </div>
          </div>

          <div class="stock-table-body">
            @for (item of stockItems(); track item.id) {
              <div
                class="stock-table-row stock-table-grid"
                [class.selected-row]="selectedItemId() === item.id"
              >
                <div class="stock-row-main" [class.selection-active]="shoppingSelectionMode()">
                  @if (shoppingSelectionMode()) { <input class="stock-select" type="checkbox" [checked]="selectedShoppingItemIds().has(item.id)" (change)="shoppingSelectionToggled.emit(item.id)" [attr.aria-label]="'Select ' + item.displayName" /> }
                  <button class="stock-row-content" type="button" (click)="itemSelected.emit(item)">
                  <span class="stock-name">{{ item.displayName }}</span>
                  <span>{{ formatAmount(item.currentAmount, item.unit) }}</span>
                  <span
                    class="relation-symbol"
                    [class.relation-below]="item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'"
                    [class.relation-watch]="item.stockStatus === 'low_soon'"
                    [class.relation-steady]="item.stockStatus === 'steady'"
                  >
                    {{ relationSymbol(item.stockStatus) }}
                  </span>
                  <span>{{ formatAmount(item.minLimit, item.unit) }}</span>
                  <span
                    class="status-badge"
                    [class.status-danger]="item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'"
                    [class.status-watch]="item.stockStatus === 'low_soon'"
                  >
                    {{ loc.t(stockStatusTranslationKey(item.stockStatus)) }}
                  </span>
                  </button>
                </div>

                <button
                  class="stock-list-add"
                  type="button"
                  [disabled]="!hasExistingShoppingList() || existingShoppingLineItemIds().has(item.id)"
                  [attr.title]="hasExistingShoppingList()
                    ? (existingShoppingLineItemIds().has(item.id)
                      ? loc.t('household.shoppingListAlreadyAdded')
                      : loc.t('household.shoppingListAddItemAction'))
                    : loc.t('household.shoppingListAddRequiresExisting')"
                  (click)="shoppingListAddRequested.emit(item)"
                >
                  <span aria-hidden="true">🛒+</span>
                </button>
              </div>
            } @empty {
              <p class="empty-copy">{{ loc.t("household.noStockItems") }}</p>
            }
          </div>
        </div>
      }

      @if (statusMessage()) {
        <small class="status-note">{{ statusMessage() }}</small>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .stock-panel,
      .state-panel {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
      }

      .stock-panel {
        align-content: start;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      .panel-topline,
      .household-bar,
      .household-picker-group {
        align-items: end;
        display: flex;
        gap: var(--space-3);
      }

      .panel-topline,
      .household-bar {
        justify-content: space-between;
      }

      h2,
      p {
        margin: 0;
      }

      .panel-title {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .status-note,
      .empty-copy,
      .state-panel p {
        color: var(--color-text-muted);
        line-height: 1.6;
      }

      .status-note {
        line-height: 1;
      }

      .household-select,
      .stack-form label {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.75rem;
        font-weight: 800;
        gap: 0.3rem;
      }

      .household-select {
        min-width: min(22rem, 100%);
      }

      .manage-household-button {
        flex: 0 1 auto;
        min-width: max-content;
        white-space: nowrap;
      }

      .icon-button {
        min-width: 2.35rem;
        padding-inline: 0;
      }

      .icon-button span {
        display: inline-flex;
        font-size: 1rem;
        font-weight: 900;
        justify-content: center;
        width: 100%;
      }

      .state-panel {
        align-content: center;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1.1rem, 3vw, 1.75rem);
      }

      .state-panel-error {
        border-color: color-mix(in srgb, var(--color-status-danger) 45%, var(--line-panel));
      }

      .stack-form {
        display: grid;
        gap: var(--space-3);
      }

      .stack-form input,
      .household-select select {
        background: var(--form-field-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.2rem;
        padding: 0.45rem 0.55rem;
      }

      .stock-table-shell {
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        overflow: hidden;
      }

      .stock-table-grid {
        align-items: center;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: minmax(0, 1fr) 2.35rem;
      }

      .stock-table-header {
        align-items: center;
        background: color-mix(in srgb, var(--pulse-row-background) 72%, transparent);
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.66rem;
        font-weight: 900;
        gap: 0.55rem;
        grid-template-columns: minmax(0, 1fr) 2.35rem;
        line-height: 1;
        min-height: 2.25rem;
        padding: 0.45rem 0.65rem;
        text-transform: uppercase;
      }

      .stock-header-main,
      .stock-row-main {
        align-items: center;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: minmax(8rem, 1.5fr) minmax(4.25rem, 0.72fr) 1.8rem minmax(4.25rem, 0.72fr) minmax(5.5rem, 0.9fr);
        min-width: 0;
      }

      .stock-header-main.selection-active,
      .stock-row-main.selection-active {
        grid-template-columns: 1.35rem minmax(0, 1fr);
      }

      .stock-header-main span {
        line-height: 1.1;
        white-space: nowrap;
      }

      .stock-table-body {
        max-height: 18rem;
        overflow: auto;
      }

      .stock-table-row {
        align-items: center;
        background: var(--pulse-row-background);
        border-bottom: 1px solid var(--pulse-row-border);
        color: var(--pulse-row-text);
        min-height: 2.65rem;
        padding: 0.42rem 0.65rem;
      }

      .stock-table-row:hover,
      .selected-row {
        background: var(--row-hover-background);
      }

      .stock-row-main {
        min-width: 0;
      }

      .stock-row-content {
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 0;
        min-width: 0;
        padding: 0;
        text-align: left;
        width: 100%;
      }

      .stock-select {
        accent-color: var(--color-accent-leaf-strong);
        height: 1rem;
        margin: 0;
        width: 1rem;
      }

      .stock-list-add {
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        font: inherit;
        font-size: 0.92rem;
        font-weight: 900;
        line-height: 1;
        min-height: 2rem;
        min-width: 2.15rem;
        padding: 0;
      }

      .stock-list-add:disabled {
        cursor: not-allowed;
        opacity: 0.68;
      }

      .stock-name {
        color: var(--color-text);
        font-weight: 900;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .relation-symbol {
        align-items: center;
        border-radius: var(--radius-ui);
        display: inline-flex;
        font-family: var(--font-mono);
        font-size: 0.98rem;
        font-weight: 900;
        justify-content: center;
        line-height: 1;
        min-height: 1.55rem;
      }

      .relation-below {
        color: var(--color-status-danger-text);
      }

      .relation-watch {
        color: var(--color-status-warning);
      }

      .relation-steady {
        color: var(--color-accent-leaf-strong);
      }

      .status-badge {
        align-self: center;
        background: color-mix(in srgb, var(--color-accent-leaf) 12%, var(--surface-soft-background));
        border-radius: var(--radius-ui);
        color: var(--color-text);
        display: inline-flex;
        font-size: 0.88rem;
        font-weight: 900;
        justify-content: center;
        justify-self: start;
        line-height: 1;
        min-height: 1.45rem;
        padding: 0.24rem 0.45rem;
        text-transform: uppercase;
        white-space: nowrap;
        width: max-content;
      }

      .status-danger {
        background: color-mix(in srgb, var(--color-status-danger) 14%, var(--surface-soft-background));
      }

      .status-watch {
        background: color-mix(in srgb, var(--color-status-warning) 22%, var(--surface-soft-background));
      }

      @media (max-width: 740px) {
        .panel-topline,
        .household-bar,
        .household-picker-group {
          align-items: stretch;
          flex-direction: column;
        }

        .stock-table-shell {
          overflow-x: auto;
        }

        .stock-table-grid,
        .stock-row-content,
        .stock-header-main {
          min-width: 40rem;
        }
      }
    `
  ]
})
export class HouseholdStockPanelComponent {
  readonly loc = inject(LocalizationService);

  readonly errorMessage = input.required<string>();
  readonly existingShoppingLineItemIds = input.required<ReadonlySet<string>>();
  readonly hasExistingShoppingList = input.required<boolean>();
  readonly hasHouseholdPage = input.required<boolean>();
  readonly households = input.required<readonly HouseholdListItem[]>();
  readonly loadState = input.required<"idle" | "loading" | "ready" | "error">();
  readonly selectedHouseholdId = input.required<string>();
  readonly selectedItemId = input.required<string | null>();
  readonly selectedShoppingItemIds = input.required<ReadonlySet<string>>();
  readonly showStockTable = input(false);
  readonly shoppingSelectionMode = input.required<boolean>();
  readonly statusMessage = input.required<string>();
  readonly stockItems = input.required<readonly HouseholdStockItemListItem[]>();

  readonly createHouseholdRequested = output<string>();
  readonly householdSelected = output<string>();
  readonly itemSelected = output<HouseholdStockItemListItem>();
  readonly refreshRequested = output<void>();
  readonly shoppingListAddRequested = output<HouseholdStockItemListItem>();
  readonly shoppingSelectionToggled = output<string>();

  readonly createHouseholdName = signal("");

  formatAmount(amount: number, unit: string): string {
    return `${amount.toLocaleString(this.loc.language() === "hu" ? "hu-HU" : "en-US")} ${unit}`;
  }

  relationSymbol(status: HouseholdStockItemListItem["stockStatus"]): string {
    const symbols: Record<HouseholdStockItemListItem["stockStatus"], string> = {
      at_limit: "=",
      below_limit: "<",
      low_soon: "~",
      steady: ">"
    };

    return symbols[status];
  }

  stockStatusTranslationKey(status: HouseholdStockItemListItem["stockStatus"]): TranslationKey {
    const keys = {
      at_limit: "household.atLimit",
      below_limit: "household.belowLimit",
      low_soon: "household.lowSoonShort",
      steady: "household.steady"
    } as const;

    return keys[status];
  }

  submitCreateHousehold(): void {
    const name = this.createHouseholdName().trim();
    if (!name) {
      return;
    }

    this.createHouseholdRequested.emit(name);
    this.createHouseholdName.set("");
  }
}
