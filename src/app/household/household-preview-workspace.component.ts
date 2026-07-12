import { Component, inject, input } from "@angular/core";

import type { HouseholdShoppingList, HouseholdStockItemListItem } from "./household-stock.service";
import { HouseholdShoppingListComponent } from "./household-shopping-list.component";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";

export interface HouseholdPreviewStockItem {
  currentAmount: number;
  displayName: string;
  id: string;
  minLimit: number;
  stockStatus: HouseholdStockItemListItem["stockStatus"];
  unit: string;
}

@Component({
  selector: "app-household-preview-workspace",
  standalone: true,
  imports: [HouseholdShoppingListComponent],
  template: `
    <section class="stock-workspace" aria-labelledby="preview-home-title">
      <section
        class="stock-panel preview-surface"
        [attr.aria-label]="loc.t('household.stockPanelLabel')"
      >
        <div class="panel-topline">
          <p class="panel-title" id="preview-home-title">
            {{ loc.t("household.stockPanelTitle") }}
          </p>
        </div>

        <div class="household-bar">
          <div class="household-picker-group">
            <label class="household-select">
              <span>{{ loc.t("household.activeHousehold") }}</span>
              <select disabled>
                <option>{{ loc.t("home.pantryPulse") }}</option>
              </select>
            </label>

            <button
              class="ui-button ui-button-quiet ui-button-sm manage-household-button"
              type="button"
              disabled
            >
              {{ loc.t("household.manageHousehold") }}
            </button>
          </div>

          <button
            class="ui-button ui-button-quiet ui-button-sm icon-button"
            type="button"
            disabled
            [attr.aria-label]="loc.t('common.refresh')"
            [attr.title]="loc.t('common.refresh')"
          >
            <span aria-hidden="true">↻</span>
          </button>
        </div>

        <div class="stock-table-shell">
          <div class="stock-table-header" aria-hidden="true">
            <div class="stock-header-main">
              <span>{{ loc.t("common.product") }}</span>
              <span>{{ loc.t("household.currentShort") }}</span>
              <span aria-hidden="true"></span>
              <span>{{ loc.t("household.minShort") }}</span>
              <span>{{ loc.t("common.state") }}</span>
            </div>
          </div>

          <div class="stock-table-body">
            @for (item of previewStockItems(); track item.id) {
              <div class="stock-table-row stock-table-grid preview-stock-row">
                <button class="stock-row-main" type="button" disabled>
                  <span class="stock-name">{{ item.displayName }}</span>
                  <span>{{ formatAmount(item.currentAmount, item.unit) }}</span>
                  <span
                    class="relation-symbol"
                    [class.relation-below]="
                      item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'
                    "
                    [class.relation-watch]="item.stockStatus === 'low_soon'"
                    [class.relation-steady]="item.stockStatus === 'steady'"
                  >
                    {{ relationSymbol(item.stockStatus) }}
                  </span>
                  <span>{{ formatAmount(item.minLimit, item.unit) }}</span>
                  <span
                    class="status-badge"
                    [class.status-danger]="
                      item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'
                    "
                    [class.status-watch]="item.stockStatus === 'low_soon'"
                  >
                    {{ loc.t(stockStatusTranslationKey(item.stockStatus)) }}
                  </span>
                </button>

                <button
                  class="stock-list-add"
                  type="button"
                  disabled
                  [attr.title]="loc.t('household.shoppingListAddRequiresExisting')"
                >
                  <span aria-hidden="true">🛒+</span>
                </button>
              </div>
            }
          </div>
        </div>

        <button class="ui-button ui-button-primary add-new-button" type="button" disabled>
          {{ loc.t("household.addNewItem") }}
        </button>
      </section>

      <section
        class="editor-panel preview-surface"
        [attr.aria-label]="loc.t('household.selectedItem')"
      >
        <p class="card-kicker">{{ loc.t("household.selectedItem") }}</p>
        <h2>{{ previewEditorItem().displayName }}</h2>

        <form class="stock-form">
          <label>
            <span>{{ loc.t("common.name") }}</span>
            <input type="text" [value]="previewEditorItem().displayName" disabled />
          </label>

          <div class="split-fields">
            <label>
              <span>{{ loc.t("household.currentAmount") }}</span>
              <input
                type="number"
                step="0.01"
                [value]="previewEditorItem().currentAmount"
                disabled
              />
            </label>
            <label>
              <span>{{ loc.t("household.minLimit") }}</span>
              <input type="number" step="0.01" [value]="previewEditorItem().minLimit" disabled />
            </label>
          </div>

          <div class="split-fields">
            <label>
              <span>{{ loc.t("household.unit") }}</span>
              <input type="text" [value]="previewEditorItem().unit" disabled />
            </label>
            <label>
              <span>{{ loc.t("household.stockedAt") }}</span>
              <input type="date" value="2026-07-10" disabled />
            </label>
          </div>

          <button
            class="details-toggle icon-button"
            type="button"
            disabled
            [attr.aria-label]="loc.t('household.showAdditionalDetails')"
            [attr.title]="loc.t('household.showAdditionalDetails')"
          >
            <span>{{ loc.t("household.showAdditionalDetails") }}</span>
          </button>

          <div class="editor-actions">
            <button class="ui-button ui-button-primary" type="button" disabled>
              {{ loc.t("common.save") }}
            </button>
            <button class="ui-button ui-button-quiet" type="button" disabled>
              {{ loc.t("common.delete") }}
            </button>
          </div>
        </form>
      </section>

      <app-household-shopping-list
        householdId="preview_household"
        [demoShoppingList]="demoShoppingList()"
        [shoppingScale]="shoppingScale()"
      />
    </section>
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-column: 1 / -1;
      }

      .stock-workspace {
        align-items: stretch;
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(0, 1fr);
      }

      .stock-panel,
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

      .panel-topline,
      .household-bar,
      .household-picker-group,
      .split-fields,
      .editor-actions {
        align-items: end;
        display: flex;
        gap: var(--space-3);
      }

      .panel-topline,
      .household-bar {
        justify-content: space-between;
      }

      .preview-surface :is(button, input, select, textarea) {
        cursor: not-allowed;
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

      h2,
      .stock-name {
        color: var(--color-text);
      }

      .household-select,
      .stock-form label {
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
        grid-template-columns:
          minmax(8rem, 1.5fr) minmax(4.25rem, 0.72fr) 1.8rem minmax(4.25rem, 0.72fr)
          minmax(5.5rem, 0.9fr);
        min-width: 0;
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

      .stock-row-main {
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
        background: color-mix(
          in srgb,
          var(--color-accent-leaf) 12%,
          var(--surface-soft-background)
        );
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
        background: color-mix(
          in srgb,
          var(--color-status-danger) 14%,
          var(--surface-soft-background)
        );
      }

      .status-watch {
        background: color-mix(
          in srgb,
          var(--color-status-warning) 22%,
          var(--surface-soft-background)
        );
      }

      .add-new-button {
        justify-self: start;
      }

      .preview-stock-row {
        cursor: default;
      }

      .preview-stock-row:hover {
        background: var(--pulse-row-background);
      }

      .preview-stock-row .stock-row-main {
        cursor: not-allowed;
      }

      .stock-form {
        display: grid;
        gap: var(--space-3);
      }

      .stock-form input,
      .household-select select {
        background: var(--form-field-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.2rem;
        padding: 0.45rem 0.55rem;
      }

      .split-fields {
        align-items: stretch;
      }

      .split-fields label {
        flex: 1 1 0;
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

      @media (min-width: 900px) {
        .stock-workspace {
          grid-template-columns: minmax(26rem, 1.2fr) minmax(20rem, 0.8fr);
          grid-template-rows: auto auto auto;
        }
      }

      @media (max-width: 740px) {
        .panel-topline,
        .household-bar,
        .household-picker-group,
        .split-fields,
        .editor-actions {
          align-items: stretch;
          flex-direction: column;
        }

        .stock-table-shell {
          overflow-x: auto;
        }

        .stock-table-grid,
        .stock-row-main,
        .stock-header-main {
          min-width: 40rem;
        }
      }
    `
  ]
})
export class HouseholdPreviewWorkspaceComponent {
  readonly loc = inject(LocalizationService);

  readonly previewStockItems = input.required<readonly HouseholdPreviewStockItem[]>();
  readonly previewEditorItem = input.required<HouseholdPreviewStockItem>();
  readonly demoShoppingList = input.required<HouseholdShoppingList>();
  readonly shoppingScale = input.required<HouseholdShoppingList["scale"]>();

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
}
