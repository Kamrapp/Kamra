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
import { ResizableTableComponent, type ResizableTableColumn } from "../shared/resizable-table.component";

interface VisibleProductRow {
  index: number;
  offset: number;
  product: CatalogProductListItem;
}

const noOfferSourceKey = "__none__";

@Component({
  imports: [ResizableTableComponent],
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
            <dt>Shown</dt>
            <dd>{{ filteredProducts().length }} / {{ totalProductCount() }}</dd>
          </div>
          <div>
            <dt>Offers</dt>
            <dd>{{ totalFilteredOfferCount() }}</dd>
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
          <section class="filter-panel surface-panel" aria-label="Offer source filters">
            <div>
              <p class="ui-kicker">Offer sources</p>
              <p class="filter-summary">{{ products().length }} of {{ totalProductCount() }} products loaded</p>
            </div>

            <div class="source-filter-list">
              @for (source of offerSourceOptions(); track source.key) {
                <label class="source-filter-option">
                  <input
                    type="checkbox"
                    [checked]="selectedOfferSources().has(source.key)"
                    (change)="toggleOfferSource(source.key)"
                  >
                  <span>{{ source.label }}</span>
                </label>
              }
            </div>
          </section>
        }

        @if (products().length) {
          <section class="pagination-panel surface-panel" aria-label="Product pagination">
            <button class="ui-action-button" type="button" (click)="loadNextProductsPage()" [disabled]="!hasNextPage() || loadState() === 'loading'">
              {{ loadState() === "loading" ? "Loading..." : "Load more" }}
            </button>
          </section>
        }

        @if (products().length) {
          <app-resizable-table #productTable ariaLabel="Product offer table" [columns]="tableColumns">
              <div
                class="table-viewport"
                [style.--row-height]="rowHeight + 'px'"
                (scroll)="onTableScroll($event)"
              >
                <div class="table-spacer" [style.height.px]="tableHeight()">
                  @for (row of visibleRows(); track row.product.id) {
                    <article
                      class="product-row"
                      role="row"
                      [style.grid-template-columns]="productTable.columnTemplate()"
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
                        <p class="row-strong">{{ filteredOffers(row.product).length }} offers · {{ filteredSourceNames(row.product).length }} sources</p>
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
          </app-resizable-table>
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

      .filter-panel {
        align-items: center;
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(12rem, 0.4fr) minmax(0, 1fr);
        padding: clamp(1rem, 2.2vw, 1.25rem);
      }

      .filter-summary {
        color: var(--color-text-muted);
        font-size: 0.88rem;
      }

      .source-filter-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-end;
      }

      .source-filter-option {
        align-items: center;
        background: color-mix(in srgb, var(--color-accent-sky) 18%, white 82%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 14%, transparent);
        border-radius: 8px;
        color: var(--color-text);
        display: inline-flex;
        font-size: 0.84rem;
        font-weight: 800;
        gap: 0.45rem;
        min-height: 2rem;
        padding: 0.35rem 0.55rem;
      }

      .source-filter-option input {
        accent-color: var(--color-accent-leaf-strong);
        height: 1rem;
        width: 1rem;
      }

      .pagination-panel {
        align-items: center;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
        padding: 0.75rem 1rem;
      }

      .pagination-panel p {
        color: var(--color-text-muted);
        font-size: 0.88rem;
        font-weight: 800;
      }

      .product-row {
        box-sizing: border-box;
        display: grid;
        gap: var(--space-3);
        min-width: var(--table-width);
      }

      .table-viewport {
        height: min(64vh, 44rem);
        min-height: 24rem;
        min-width: var(--table-width);
        overflow-x: hidden;
        overflow-y: auto;
        position: relative;
      }

      .table-spacer {
        min-width: 100%;
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

        .filter-panel {
          align-items: stretch;
          grid-template-columns: 1fr;
        }

        .pagination-panel {
          align-items: stretch;
          flex-direction: column;
        }

        .source-filter-list {
          justify-content: flex-start;
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
  readonly selectedOfferSources = signal<Set<string>>(new Set([noOfferSourceKey]));
  readonly offerSourceNames = signal<string[]>([]);
  readonly currentPage = signal(0);
  readonly pageSize = signal(25);
  readonly sourceFilterTouched = signal(false);
  readonly totalProductCount = signal(0);
  readonly totalPages = signal(0);
  readonly tableColumns: readonly ResizableTableColumn[] = [
    { key: "product", label: "Product", minWidth: 140, maxWidth: 640, width: 300 },
    { key: "prices", label: "Prices", minWidth: 140, maxWidth: 640, width: 260 },
    { key: "sources", label: "Sources", minWidth: 140, maxWidth: 640, width: 280 },
    { key: "identifiers", label: "Identifiers", minWidth: 140, maxWidth: 640, width: 220 },
    { key: "state", label: "State", minWidth: 140, maxWidth: 640, width: 190 }
  ];
  readonly rowHeight = 92;
  readonly scrollTop = signal(0);
  readonly statusMessage = signal("No product snapshot has been loaded yet.");
  readonly viewportHeight = 704;
  readonly offerSourceOptions = computed(() => [
    ...this.offerSourceNames().map((sourceName) => ({
      key: sourceName,
      label: sourceName
    })),
    {
      key: noOfferSourceKey,
      label: "none"
    }
  ]);
  readonly filteredProducts = computed(() =>
    this.products().filter((product) => this.productMatchesSelectedSources(product))
  );
  readonly tableHeight = computed(() => this.filteredProducts().length * this.rowHeight);
  readonly totalOfferCount = computed(() =>
    this.products().reduce((total, product) => total + product.offers.length, 0)
  );
  readonly totalFilteredOfferCount = computed(() =>
    this.filteredProducts().reduce((total, product) => total + this.filteredOffers(product).length, 0)
  );
  readonly totalSourceCount = computed(() =>
    new Set(this.filteredProducts().flatMap((product) => this.filteredSourceNames(product))).size
  );
  readonly hasNextPage = computed(() =>
    this.totalProductCount() === 0
      ? this.currentPage() === 0
      : this.currentPage() < this.totalPages()
  );
  readonly visibleRows = computed<VisibleProductRow[]>(() => {
    const products = this.filteredProducts();
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

  filteredOffers(product: CatalogProductListItem): CatalogProductOfferListItem[] {
    const selectedSources = this.selectedOfferSources();
    const offers = product.offers.filter((offer) => selectedSources.has(offer.sourceName));

    return offers;
  }

  filteredSourceNames(product: CatalogProductListItem): string[] {
    return [...new Set(this.filteredOffers(product).map((offer) => offer.sourceName))].sort();
  }

  formatIdentifiers(product: CatalogProductListItem): string {
    const values = this.filteredOffers(product)
      .flatMap((offer) => offer.identifiers)
      .map((identifier) => `${identifier.kind}:${identifier.value}`);
    const uniqueValues = [...new Set(values)].slice(0, 4);

    return uniqueValues.length ? uniqueValues.join(" · ") : "none";
  }

  formatLatestObserved(product: CatalogProductListItem): string {
    const latest = this.filteredOffers(product)
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
    const offerNames = this.filteredOffers(product)
      .map((offer) => offer.sourceProductName)
      .filter((name, index, names) => names.indexOf(name) === index)
      .slice(0, 2);

    return offerNames.length ? offerNames.join(" · ") : "no source product";
  }

  formatSources(product: CatalogProductListItem): string {
    const sources = this.filteredSourceNames(product);

    return sources.length ? sources.join(" · ") : "no source";
  }

  onTableScroll(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLElement) {
      this.scrollTop.set(target.scrollTop);

      const remainingDistance = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remainingDistance < this.rowHeight * 6) {
        void this.loadNextProductsPage();
      }
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

    for (const offer of this.filteredOffers(product)) {
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

  toggleOfferSource(sourceKey: string): void {
    this.sourceFilterTouched.set(true);
    this.selectedOfferSources.update((selectedSources) => {
      const next = new Set(selectedSources);

      if (next.has(sourceKey)) {
        next.delete(sourceKey);
      } else {
        next.add(sourceKey);
      }

      return next;
    });
    void this.reloadProductsForCurrentFilters();
  }

  async loadProducts(): Promise<void> {
    if (!this.auth.token()) {
      this.loadState.set("error");
      this.statusMessage.set("Sign in before loading products.");
      return;
    }

    this.errorMessage.set("");
    this.products.set([]);
    this.currentPage.set(0);
    this.offerSourceNames.set([]);
    this.totalProductCount.set(0);
    this.totalPages.set(0);
    this.sourceFilterTouched.set(false);
    this.statusMessage.set("Loading catalog products...");

    const sourceResult = await this.catalog.listOfferSourceNames();
    if (sourceResult.status !== "ok") {
      this.products.set([]);
      this.loadState.set("error");
      this.statusMessage.set(sourceResult.status === "forbidden"
        ? "This view needs catalog review access."
        : "The product catalog sources could not be loaded.");
      this.errorMessage.set(sourceResult.message);
      return;
    }

    this.offerSourceNames.set(sourceResult.sourceNames);
    this.selectedOfferSources.set(new Set(this.offerSourceOptions().map((source) => source.key)));
    await this.loadNextProductsPage();
  }

  async loadNextProductsPage(): Promise<void> {
    if (!this.auth.token() || this.loadState() === "loading" || !this.hasNextPage()) {
      return;
    }

    this.errorMessage.set("");
    this.loadState.set("loading");
    const pageToLoad = this.currentPage() + 1;
    try {
      const selectedServerSources = this.selectedServerSourceNames();
      if (this.sourceFilterTouched() && this.selectedOfferSources().size === 0) {
        this.products.set([]);
        this.currentPage.set(1);
        this.totalProductCount.set(0);
        this.totalPages.set(0);
        this.scrollTop.set(0);
        this.loadState.set("success");
        this.statusMessage.set("No source filters selected.");
        return;
      }

      const result = await this.catalog.listProductsForReview(pageToLoad, this.pageSize(), selectedServerSources);

      if (result.status !== "ok") {
        this.loadState.set("error");
        this.statusMessage.set(result.status === "forbidden"
          ? "This view needs catalog review access."
          : "The product catalog could not be loaded.");
        this.errorMessage.set(result.message);
        return;
      }

      this.products.update((products) => mergeProductsById(products, result.products));
      this.currentPage.set(result.pagination.page);
      this.totalProductCount.set(result.pagination.totalCount);
      this.totalPages.set(result.pagination.totalPages);
      if (!this.sourceFilterTouched()) {
        this.selectedOfferSources.set(new Set(this.offerSourceOptions().map((source) => source.key)));
      }
      if (pageToLoad === 1) {
        this.scrollTop.set(0);
      }
      this.loadState.set("success");
      this.statusMessage.set(
        `Loaded ${this.products().length} of ${result.pagination.totalCount} products · page ${result.pagination.page} of ${result.pagination.totalPages}`
      );

      logBrowserEvent("info", "Product catalog loaded", {
        offerCount: this.totalOfferCount(),
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        productCount: this.products().length,
        totalProductCount: result.pagination.totalCount
      });
    } catch (error: unknown) {
      this.loadState.set("error");
      this.statusMessage.set("The browser could not reach the product catalog route.");
      this.errorMessage.set("Check the shared API path and database configuration.");

      logBrowserEvent("error", "Product catalog request failed", error);
    }
  }

  private productMatchesSelectedSources(product: CatalogProductListItem): boolean {
    const selectedSources = this.selectedOfferSources();

    if (product.offers.length === 0) {
      return selectedSources.has(noOfferSourceKey);
    }

    return product.offers.some((offer) => selectedSources.has(offer.sourceName));
  }

  private async reloadProductsForCurrentFilters(): Promise<void> {
    this.products.set([]);
    this.currentPage.set(0);
    this.totalProductCount.set(0);
    this.totalPages.set(0);
    this.scrollTop.set(0);
    await this.loadNextProductsPage();
  }

  private selectedServerSourceNames(): string[] {
    const selectedSources = this.selectedOfferSources();
    const selectedRealSources = this.offerSourceNames().filter((sourceName) => selectedSources.has(sourceName));
    const everyRealSourceSelected = selectedRealSources.length === this.offerSourceNames().length;

    return everyRealSourceSelected && selectedSources.has(noOfferSourceKey)
      ? []
      : selectedRealSources;
  }
}

function mergeProductsById(
  existingProducts: CatalogProductListItem[],
  nextProducts: CatalogProductListItem[]
): CatalogProductListItem[] {
  const productsById = new Map(existingProducts.map((product) => [product.id, product]));

  for (const product of nextProducts) {
    productsById.set(product.id, product);
  }

  return [...productsById.values()];
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
