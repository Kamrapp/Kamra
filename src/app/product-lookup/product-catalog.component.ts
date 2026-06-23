import { Component, inject, signal, type OnInit } from "@angular/core";

import { AuthService } from "../auth.service";
import { logBrowserEvent } from "../browser-logger";
import {
  ProductCatalogService,
  type CatalogProductListItem,
  type ProductMeasurement
} from "./product-catalog.service";

@Component({
  selector: "app-product-catalog",
  standalone: true,
  template: `
    <section class="products-page" aria-labelledby="products-title">
      <div class="page-copy surface-panel surface-copy">
        <p class="ui-kicker">Catalog</p>
        <h1 id="products-title">Seeded products</h1>
        <p>
          A lightweight Stage 3 catalog view for checking names, source coverage,
          tags, and household-stock linkage before crawler work begins.
        </p>
      </div>

      @if (!auth.token()) {
        <section class="state-panel surface-panel surface-copy">
          <p class="ui-kicker">Admin only</p>
          <p class="state-title">Sign in to view the seeded product catalog.</p>
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
          <section class="product-list" aria-label="Seeded products">
            @for (product of products(); track product.id) {
              <article class="product-card surface-panel">
                <div class="product-heading">
                  <div>
                    <p class="ui-kicker">{{ product.primaryCategoryKey ?? "uncategorized" }}</p>
                    <h2>{{ product.name }}</h2>
                  </div>
                  <p class="source-count">{{ product.sourceNames.length }} sources</p>
                </div>

                <dl class="product-meta">
                  <div>
                    <dt>Brand</dt>
                    <dd>{{ product.brandName || "unbranded" }}</dd>
                  </div>
                  <div>
                    <dt>Measures</dt>
                    <dd>{{ formatMeasurements(product.measurements) }}</dd>
                  </div>
                  <div>
                    <dt>Household links</dt>
                    <dd>{{ product.householdStockCount }}</dd>
                  </div>
                </dl>

                <div class="token-row">
                  @for (sourceName of product.sourceNames; track sourceName) {
                    <span class="ui-token ui-token-source">{{ sourceName }}</span>
                  }
                </div>

                <div class="token-row">
                  @for (tagKey of product.tagKeys; track tagKey) {
                    <span class="ui-token ui-token-tag">{{ tagKey }}</span>
                  }
                </div>
              </article>
            }
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

      dt {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      h1,
      h2,
      p,
      dl,
      dd {
        margin: 0;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(2rem, 5vw, 3.2rem);
        line-height: 1.05;
      }

      .page-copy p:last-child,
      .error-message {
        color: var(--color-text-muted);
        line-height: 1.6;
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

      .product-list {
        display: grid;
        gap: var(--space-4);
      }

      .product-card {
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 2vw, 1.25rem);
      }

      .product-heading {
        align-items: start;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      h2 {
        color: var(--color-text);
        font-size: 1.08rem;
        line-height: 1.25;
      }

      .source-count {
        color: var(--color-text-muted);
        font-size: 0.86rem;
        white-space: nowrap;
      }

      .product-meta {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .product-meta div {
        background: color-mix(in srgb, var(--color-background-soft) 74%, white 26%);
        border-radius: 8px;
        display: grid;
        gap: 0.2rem;
        min-height: 4.5rem;
        padding: 0.8rem;
      }

      dd {
        color: var(--color-text);
        line-height: 1.5;
      }

      .token-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }

      @media (max-width: 720px) {
        .state-header,
        .product-heading {
          align-items: start;
          flex-direction: column;
        }

        .product-meta {
          grid-template-columns: 1fr;
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
  readonly statusMessage = signal("No product snapshot has been loaded yet.");

  ngOnInit(): void {
    if (this.auth.token()) {
      void this.loadProducts();
    }
  }

  formatMeasurements(measurements: ProductMeasurement[]): string {
    if (!measurements.length) {
      return "unknown";
    }

    return measurements.map((measurement) => `${measurement.value} ${measurement.unit}`).join(" | ");
  }

  async loadProducts(): Promise<void> {
    if (!this.auth.token()) {
      this.loadState.set("error");
      this.statusMessage.set("Sign in before loading products.");
      return;
    }

    this.errorMessage.set("");
    this.loadState.set("loading");
    this.statusMessage.set("Loading the seeded catalog from the shared API route...");

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
      this.loadState.set("success");
      this.statusMessage.set(`Loaded ${result.products.length} seeded products.`);

      logBrowserEvent("info", "Product catalog loaded", {
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

