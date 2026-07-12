import { FormsModule } from "@angular/forms";
import { Component, inject, input, output, signal } from "@angular/core";

import { type HouseholdShoppingListLine } from "./household-stock.service";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";

export type ShoppingListLineChange =
  | { kind: "observedPriceAmount"; value: number | string }
  | { kind: "observedPriceCurrency"; value: string }
  | { kind: "plannedAmount"; value: number | string }
  | { kind: "purchasedAmount"; value: number | string }
  | { kind: "ticked"; value: boolean }
  | { kind: "unit"; value: string };

@Component({
  selector: "app-shopping-list-line",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="shopping-line-row">
      <label class="shopping-check">
        <input
          type="checkbox"
          [checked]="item().ticked"
          (change)="changed.emit({ kind: 'ticked', value: $any($event.target).checked })"
          [disabled]="readOnly() || saving()"
        />
        <span>{{ item().displayName }}</span>
      </label>

      <div class="shopping-amounts">
        <label>
          <span>{{ loc.t("household.plannedShort") }}</span>
          <input
            type="number"
            step="0.01"
            [ngModel]="item().plannedAmount"
            (ngModelChange)="changed.emit({ kind: 'plannedAmount', value: $event })"
            [disabled]="readOnly()"
          />
        </label>
        <label>
          <span>{{ loc.t("household.purchasedShort") }}</span>
          <input
            type="number"
            step="0.01"
            [ngModel]="item().purchasedAmount"
            (ngModelChange)="changed.emit({ kind: 'purchasedAmount', value: $event })"
            [disabled]="readOnly()"
          />
        </label>
        <label class="shopping-unit">
          <span>{{ loc.t("household.unit") }}</span>
          <input
            type="text"
            [ngModel]="item().unit"
            (ngModelChange)="changed.emit({ kind: 'unit', value: $event })"
            [disabled]="readOnly()"
          />
        </label>
      </div>

      <button
        class="details-toggle icon-button"
        type="button"
        (click)="toggleExpanded()"
        [disabled]="readOnly()"
        [attr.aria-label]="
          expanded()
            ? loc.t('household.hideAdditionalDetails')
            : loc.t('household.showAdditionalDetails')
        "
        [attr.title]="
          expanded()
            ? loc.t('household.hideAdditionalDetails')
            : loc.t('household.showAdditionalDetails')
        "
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M10.5 4a6.5 6.5 0 0 1 5.18 10.43l3.45 3.44-1.42 1.42-3.44-3.45A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
          ></path>
          @if (expanded()) {
            <path d="M7.5 10h6v1.6h-6V10Z"></path>
          } @else {
            <path d="M9.7 7.8h1.6V10h2.2v1.6h-2.2v2.2H9.7v-2.2H7.5V10h2.2V7.8Z"></path>
          }
        </svg>
      </button>
    </div>

    @if (expanded()) {
      <div class="shopping-line-details">
        <div class="shopping-meta">
          <p>{{ loc.t("household.shoppingListTargetAmount", { amount: item().targetAmount }) }}</p>
          <p>
            {{
              loc.t("household.shoppingListSuggestedAmount", { amount: item().suggestedBuyAmount })
            }}
          </p>
          @if (item().reasonCode) {
            <p>{{ loc.t(reasonKey(item().reasonCode!)) }}</p>
          }
        </div>

        <div class="shopping-detail-fields">
          <label>
            <span>{{ loc.t("common.price") }}</span>
            <input
              type="number"
              step="1"
              [ngModel]="item().observedPrice?.amount ?? ''"
              (ngModelChange)="changed.emit({ kind: 'observedPriceAmount', value: $event })"
              [placeholder]="loc.t('household.observedPricePlaceholder')"
              [disabled]="readOnly()"
            />
          </label>
          <label>
            <span>{{ loc.t("household.currencyCode") }}</span>
            <input
              type="text"
              [ngModel]="item().observedPrice?.currencyCode ?? defaultCurrencyCode()"
              (ngModelChange)="changed.emit({ kind: 'observedPriceCurrency', value: $event })"
              [disabled]="readOnly()"
            />
          </label>
        </div>

        @if (item().uncertaintyFlags.length) {
          <p class="shopping-muted">
            {{ loc.t("household.shoppingListUncertainty") }}:
            {{ describeUncertainty(item()) }}
          </p>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .shopping-line-row {
        align-items: center;
        display: grid;
        gap: 0.55rem;
        grid-template-columns:
          minmax(10rem, 1fr) minmax(4.8rem, 6.5rem) minmax(4.8rem, 6.5rem)
          minmax(3.8rem, 4.5rem) 2.2rem;
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

      .shopping-meta,
      .shopping-meta p {
        display: grid;
        gap: 0.25rem;
        margin: 0;
      }

      .shopping-detail-fields {
        display: flex;
        gap: var(--space-3);
      }

      .shopping-detail-fields label {
        display: grid;
        flex: 1 1 0;
        gap: 0.35rem;
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
        .shopping-detail-fields {
          align-items: stretch;
          flex-direction: column;
        }

        .shopping-amounts {
          display: grid;
          gap: 0.35rem;
          grid-template-columns: minmax(4.8rem, 1fr) minmax(4.8rem, 1fr) minmax(3.8rem, 0.7fr);
        }

        .shopping-line-row {
          grid-template-columns: 1fr;
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
export class ShoppingListLineComponent {
  readonly loc = inject(LocalizationService);

  readonly defaultCurrencyCode = input.required<string>();
  readonly item = input.required<HouseholdShoppingListLine>();
  readonly readOnly = input.required<boolean>();
  readonly saving = input.required<boolean>();
  readonly changed = output<ShoppingListLineChange>();
  readonly expanded = signal(false);

  toggleExpanded(): void {
    if (!this.readOnly()) {
      this.expanded.update((value) => !value);
    }
  }

  describeUncertainty(item: HouseholdShoppingListLine): string {
    return item.uncertaintyFlags
      .map((flag) =>
        this.loc.t(
          flag === "missing_catalog_product"
            ? "household.uncertaintyMissingCatalogProduct"
            : "household.uncertaintyMissingProductSource"
        )
      )
      .join(", ");
  }

  reasonKey(reasonCode: NonNullable<HouseholdShoppingListLine["reasonCode"]>): TranslationKey {
    const keys = {
      at_minimum: "household.reasonAtLimit",
      below_minimum: "household.reasonBelowMinimum",
      broad_restock: "household.reasonStockUp",
      low_soon: "household.reasonLowSoon"
    } as const;

    return keys[reasonCode];
  }
}
