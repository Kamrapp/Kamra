import { Component, computed, inject, signal, type OnInit } from "@angular/core";

import { AuthService } from "../auth.service";
import { logBrowserEvent } from "../browser-logger";
import {
  ProductCatalogService,
  type CatalogProductListItem,
  type CatalogProductOfferListItem,
  type CatalogProductOfferPrice,
  type ProductMeasurement
} from "./product-catalog.service";

interface VisibleProductRow {
  index: number;
  offset: number;
  product: CatalogProductListItem;
}

@Component({
  selector: "app-product-catalog",
  standalone: true,
  template: `
    <section class="products-page" aria-labelledby="products-title">
      <header class="page-header surface-panel">
        <div>
          <p class="ui-kicker">Catalog</p>
          <h1 id="products-title">Product offers</h1>
        </div>

        <dl class="summary-strip" aria-label="Catalog summary">
          <div>
            <dt>Products</dt>
            <dd>{{ products().length }}</dd>
          </div>
          <div>
            <dt>Offers</dt>
            <dd>{{ totalOfferCount() }}</dd>
          </div>
          <div>
            <dt>Sources</dt>
            <dd>{{ totalSourceCount() }}</dd>
          </div>
        </dl>
      </header>

      @if (!auth.token()) {
        <section class="state-panel surface-panel surface-copy">
          <p class="ui-kicker">Admin only</p>
          <p class="state-title">Sign in to view the product catalog.</p>
        </section>
      } @else {
        <section class="state-panel surface-panel surface-copy">
          <div class="state-header">
            <div>
              <p class="ui-kicker">Current state</p>
              <p class="state-title">{{ statusMessage() }}</p>
            </div>

            <button class="ui-action-button" type="button" (click)="loadProducts()" [disabled]="loadState() === 'loading'">
              {{ loadState() === "loading" ? "Loading..." : "Refresh" }}
            </button>
          </div>

          @if (errorMessage(); as errorMessage) {
            <p class="error-message">{{ errorMessage }}</p>
          }
        </section>

        @if (products().length) {
          <section class="offer-table surface-panel" aria-label="Product offer table">
            <div class="table-head" role="row">
              <span role="columnheader">Product</span>
              <span role="columnheader">Prices</span>
              <span role="columnheader">Sources</span>
              <span role="columnheader">Identifiers</span>
              <span role="columnheader">State</span>
            </div>

            <div
              class="table-viewport"
              role="table"
              [style.--row-height]="rowHeight + 'px'"
              (scroll)="onTableScroll($event)"
            >
              <div class="table-spacer" [style.height.px]="tableHeight()">
                @for (row of visibleRows(); track row.product.id) {
                  <article
                    class="product-row"
                    role="row"
                    [style.transform]="'translateY(' + row.offset + 'px)'"
                  >
                    <div class="product-main" role="cell">
                      <p class="row-title">{{ row.product.name }}</p>
                      <p class="row-muted">
                        {{ row.product.brandName || "unbranded" }} · {{ formatMeasurements(row.product.measurements) }}
                      </p>
                      <p class="row-muted">{{ row.product.primaryCategoryKey || "uncategorized" }}</p>
                    </div>

                    <div class="price-cell" role="cell">
                      @for (price of priceChips(row.product); track price) {
                        <span class="price-chip">{{ price }}</span>
                      } @empty {
                        <span class="quiet-chip">no price yet</span>
                      }
                    </div>

                    <div class="source-cell" role="cell">
                      <p class="row-strong">{{ row.product.offers.length }} offers · {{ row.product.sourceNames.length }} sources</p>
                      <p class="row-muted">{{ formatSources(row.product) }}</p>
                      <p class="row-muted">{{ formatOfferNames(row.product) }}</p>
                    </div>

                    <div class="identifier-cell" role="cell">
                      <p class="row-muted">{{ formatIdentifiers(row.product) }}</p>
                    </div>

                    <div class="state-cell" role="cell">
                      <p class="row-strong">{{ formatLatestObserved(row.product) }}</p>
                      <p class="row-muted">{{ row.product.householdStockCount }} household · {{ row.product.tagKeys.length }} tags</p>
                    </div>
                  </article>
                }
              </div>
            </div>
          </section>
        }
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }

      .products-page {
        display: grid;
        gap: var(--space-5);
      }

      dd,
      dl,
      h1,
      p {
        margin: 0;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .page-header {
        align-items: end;
        display: flex;
        gap: var(--space-5);
        justify-content: space-between;
        padding: clamp(1rem, 2.4vw, 1.4rem);
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(1.8rem, 4vw, 2.7rem);
        line-height: 1.05;
      }

      .summary-strip {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(3, minmax(5rem, 1fr));
        min-width: min(28rem, 100%);
      }

      .summary-strip div {
        background: color-mix(in srgb, var(--color-background-soft) 72%, white 28%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 14%, transparent);
        border-radius: 8px;
        min-height: 4rem;
        padding: 0.65rem 0.8rem;
      }

      .summary-strip dd {
        color: var(--color-text);
        font-size: 1.25rem;
        font-weight: 800;
      }

      .state-header {
        align-items: center;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      .state-title {
        color: var(--color-text);
        font-size: 1rem;
        font-weight: 700;
      }

      .error-message,
      .row-muted {
        color: var(--color-text-muted);
      }

      .offer-table {
        overflow: hidden;
      }

      .table-head,
      .product-row {
        display: grid;
        gap: var(--space-3);
        grid-template-columns:
          minmax(13rem, 1.25fr)
          minmax(14rem, 1.2fr)
          minmax(13rem, 1fr)
          minmax(11rem, 0.9fr)
          minmax(10rem, 0.8fr);
      }

      .table-head {
        background: color-mix(in srgb, var(--color-wood-deep) 12%, var(--color-surface) 88%);
        border-bottom: 1px solid color-mix(in srgb, var(--color-wood) 22%, transparent);
        color: var(--color-text-muted);
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0;
        padding: 0.8rem 1rem;
        text-transform: uppercase;
      }

      .table-viewport {
        height: min(64vh, 44rem);
        min-height: 24rem;
        overflow: auto;
        position: relative;
      }

      .table-spacer {
        min-width: 68rem;
        position: relative;
      }

      .product-row {
        align-items: center;
        border-bottom: 1px solid color-mix(in srgb, var(--color-wood) 12%, transparent);
        height: var(--row-height);
        left: 0;
        padding: 0.75rem 1rem;
        position: absolute;
        right: 0;
        top: 0;
      }

      .product-row:nth-child(2n) {
        background: color-mix(in srgb, var(--color-background-soft) 42%, transparent);
      }

      .product-main,
      .price-cell,
      .source-cell,
      .identifier-cell,
      .state-cell {
        min-width: 0;
      }

      .row-title,
      .row-strong {
        color: var(--color-text);
        font-weight: 800;
      }

      .row-title,
      .row-muted,
      .row-strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .row-muted {
        font-size: 0.84rem;
      }

      .price-cell {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .price-chip,
      .quiet-chip {
        border-radius: 8px;
        display: inline-flex;
        font-size: 0.8rem;
        font-weight: 800;
        min-height: 1.75rem;
        padding: 0.3rem 0.5rem;
      }

      .price-chip {
        background: color-mix(in srgb, var(--color-accent-leaf) 24%, white 76%);
        color: var(--color-text);
      }

      .quiet-chip {
        background: color-mix(in srgb, var(--color-background-soft) 68%, white 32%);
        color: var(--color-text-muted);
      }

      @media (max-width: 820px) {
        .page-header,
        .state-header {
          align-items: stretch;
          flex-direction: column;
        }

        .summary-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          min-width: 0;
        }

        .ui-action-button {
          width: 100%;
        }
      }
    `
  ]
})
export class ProductCatalogComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly catalog = inject(ProductCatalogService);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "success" | "error">("idle");
  readonly products = signal<CatalogProductListItem[]>([]);
  readonly rowHeight = 92;
  readonly scrollTop = signal(0);
  readonly statusMessage = signal("No product snapshot has been loaded yet.");
  readonly viewportHeight = 704;
  readonly tableHeight = computed(() => this.products().length * this.rowHeight);
  readonly totalOfferCount = computed(() =>
    this.products().reduce((total, product) => total + product.offers.length, 0)
  );
  readonly totalSourceCount = computed(() =>
    new Set(this.products().flatMap((product) => product.sourceNames)).size
  );
  readonly visibleRows = computed<VisibleProductRow[]>(() => {
    const products = this.products();
    const overscan = 5;
    const start = Math.max(0, Math.floor(this.scrollTop() / this.rowHeight) - overscan);
    const visibleCount = Math.ceil(this.viewportHeight / this.rowHeight) + overscan * 2;

    return products.slice(start, start + visibleCount).map((product, index) => ({
      index: start + index,
      offset: (start + index) * this.rowHeight,
      product
    }));
  });

  ngOnInit(): void {
    if (this.auth.token()) {
      void this.loadProducts();
    }
  }

  formatIdentifiers(product: CatalogProductListItem): string {
    const values = product.offers
      .flatMap((offer) => offer.identifiers)
      .map((identifier) => `${identifier.kind}:${identifier.value}`);
    const uniqueValues = [...new Set(values)].slice(0, 4);

    return uniqueValues.length ? uniqueValues.join(" · ") : "none";
  }

  formatLatestObserved(product: CatalogProductListItem): string {
    const latest = product.offers
      .flatMap((offer) => [
        offer.latestObservedAt,
        ...Object.values(offer.prices).map((price) => price?.observedAt)
      ])
      .filter((value): value is string => typeof value === "string")
      .sort()
      .at(-1);

    return latest ? latest.slice(0, 10) : "not observed";
  }

  formatMeasurements(measurements: ProductMeasurement[]): string {
    if (!measurements.length) {
      return "unknown";
    }

    return measurements.map((measurement) => `${measurement.value} ${measurement.unit}`).join(" | ");
  }

  formatOfferNames(product: CatalogProductListItem): string {
    const offerNames = product.offers
      .map((offer) => offer.sourceProductName)
      .filter((name, index, names) => names.indexOf(name) === index)
      .slice(0, 2);

    return offerNames.length ? offerNames.join(" · ") : "no source product";
  }

  formatSources(product: CatalogProductListItem): string {
    return product.sourceNames.length ? product.sourceNames.join(" · ") : "no source";
  }

  onTableScroll(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLElement) {
      this.scrollTop.set(target.scrollTop);
    }
  }

  priceChips(product: CatalogProductListItem): string[] {
    const chips: string[] = [];
    const seen = new Set<string>();
    const priceOrder: Array<keyof CatalogProductOfferListItem["prices"]> = [
      "coupon",
      "loyalty_card",
      "offer",
      "base",
      "old"
    ];

    for (const offer of product.offers) {
      for (const kind of priceOrder) {
        const price = offer.prices[kind];
        if (!price) {
          continue;
        }

        const label = `${priceKindLabel(kind)} ${formatPrice(price)}`;
        if (!seen.has(label)) {
          chips.push(label);
          seen.add(label);
        }
      }
    }

    return chips.slice(0, 4);
  }

  async loadProducts(): Promise<void> {
    if (!this.auth.token()) {
      this.loadState.set("error");
      this.statusMessage.set("Sign in before loading products.");
      return;
    }

    this.errorMessage.set("");
    this.loadState.set("loading");
    this.statusMessage.set("Loading catalog products...");

    try {
      const result = await this.catalog.listProductsForReview();

      if (result.status !== "ok") {
        this.products.set([]);
        this.loadState.set("error");
        this.statusMessage.set(result.status === "forbidden"
          ? "This view needs catalog review access."
          : "The product catalog could not be loaded.");
        this.errorMessage.set(result.message);
        return;
      }

      this.products.set(result.products);
      this.scrollTop.set(0);
      this.loadState.set("success");
      this.statusMessage.set(`Loaded ${result.products.length} products with ${this.totalOfferCount()} offers.`);

      logBrowserEvent("info", "Product catalog loaded", {
        offerCount: this.totalOfferCount(),
        productCount: result.products.length
      });
    } catch (error: unknown) {
      this.products.set([]);
      this.loadState.set("error");
      this.statusMessage.set("The browser could not reach the product catalog route.");
      this.errorMessage.set("Check the shared API path and database configuration.");

      logBrowserEvent("error", "Product catalog request failed", error);
    }
  }
}

function formatPrice(price: CatalogProductOfferPrice): string {
  return `${price.amount.toLocaleString("hu-HU")} ${price.currencyCode}`;
}

function priceKindLabel(kind: keyof CatalogProductOfferListItem["prices"]): string {
  const labels: Record<keyof CatalogProductOfferListItem["prices"], string> = {
    base: "base",
    coupon: "coupon",
    loyalty_card: "card",
    offer: "offer",
    old: "old"
  };

  return labels[kind];
}
