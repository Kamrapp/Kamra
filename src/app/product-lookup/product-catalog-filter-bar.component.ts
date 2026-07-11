import { Component, inject, input, output } from "@angular/core";

import { LocalizationService } from "../shared/localization.service";

@Component({
  selector: "app-product-catalog-filter-bar",
  standalone: true,
  template: `
    <section class="product-filter-bar" [attr.aria-label]="loc.t('product.filters')">
      <label class="filter-field">
        <span>{{ loc.t("common.name") }}</span>
        <input
          type="search"
          [value]="name()"
          [placeholder]="loc.t('product.filterContains')"
          (input)="nameChanged.emit($any($event.target).value)"
        />
      </label>

      @if (active()) {
        <button class="filter-clear-button ui-button ui-button-quiet ui-button-sm" type="button" (click)="clearRequested.emit()">
          {{ loc.t("common.clear") }}
        </button>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .product-filter-bar {
        align-items: end;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        margin-block-end: 0.45rem;
        min-width: 0;
      }

      .filter-field {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.75rem;
        font-weight: 800;
        gap: 0.25rem;
        min-width: min(18rem, 100%);
      }

      .filter-field input {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        min-height: 2.15rem;
        min-width: 0;
        padding: 0.35rem 0.55rem;
      }

      .filter-field input::placeholder {
        color: var(--color-text-muted);
        font-weight: 600;
      }

      .filter-clear-button {
        font-size: 0.84rem;
      }
    `
  ]
})
export class ProductCatalogFilterBarComponent {
  readonly loc = inject(LocalizationService);

  readonly active = input.required<boolean>();
  readonly name = input.required<string>();
  readonly clearRequested = output<void>();
  readonly nameChanged = output<string>();
}
