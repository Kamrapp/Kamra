import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { LocalizationService } from "../shared/localization.service";

interface Market {
  id: string;
  displayName: string;
  countryCode: string;
  currencyCode: string;
}
interface Submission {
  id: string;
  revision: number;
  facts: { displayName: string; quantity: number; unit: string };
  status: string;
}
interface ShopProduct {
  id: string;
  productId: string;
  shopMarketId: string;
  displayName: string;
  packageQuantity: number;
  packageUnit: string;
}
interface PriceObservation {
  id: string;
  kind: string;
  observedAt: string;
  price: number;
  currencyCode: string;
  validFrom?: string | null;
  validTo?: string | null;
}

@Component({
  selector: "app-stage9-admin",
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="ui-page-stack">
      <section class="ui-panel-card">
        <p class="ui-kicker">{{ loc.t("household.stage9Admin.kicker") }}</p>
        <h1 class="ui-page-title">{{ loc.t("household.stage9Admin.title") }}</h1>
        <p>{{ loc.t("household.stage9Admin.description") }}</p>
      </section>
      <section class="ui-panel-card">
        <h2 class="ui-card-title">{{ loc.t("household.stage9Admin.markets") }}</h2>
        <div class="stage9-form">
          <input [(ngModel)]="market.id" placeholder="shop-market:lidl-hu" />
          <input [(ngModel)]="market.displayName" placeholder="Lidl Hungary" />
          <input [(ngModel)]="market.countryCode" placeholder="HU" />
          <input [(ngModel)]="market.currencyCode" placeholder="HUF" />
          <button class="ui-button ui-button-primary" type="button" (click)="createMarket()">
            {{ loc.t("common.save") }}
          </button>
        </div>
        @for (item of markets(); track item.id) {
          <p>
            {{ item.displayName }} · {{ item.countryCode }} / {{ item.currencyCode }}
            <small>{{ item.id }}</small>
          </p>
        }
      </section>
      <section class="ui-panel-card">
        <h2 class="ui-card-title">{{ loc.t("household.stage9Admin.shopProducts") }}</h2>
        <div class="stage9-form">
          <select [(ngModel)]="selectedMarketId" (ngModelChange)="loadProducts()">
            <option value="">{{ loc.t("household.stage9Admin.selectMarket") }}</option>
            @for (item of markets(); track item.id) {
              <option [value]="item.id">{{ item.displayName }}</option>
            }
          </select>
          <input [(ngModel)]="shopProduct.id" placeholder="shop-product:milk" />
          <input [(ngModel)]="shopProduct.productId" placeholder="catalog-product:milk" />
          <input [(ngModel)]="shopProduct.displayName" placeholder="Milk 1 l" />
          <input type="number" [(ngModel)]="shopProduct.packageQuantity" placeholder="1" />
          <input [(ngModel)]="shopProduct.packageUnit" placeholder="l" />
          <button class="ui-button ui-button-primary" type="button" (click)="saveShopProduct()">
            {{ loc.t("common.save") }}
          </button>
        </div>
        @for (item of products(); track item.id) {
          <button class="stage9-row stage9-select-row" type="button" (click)="selectProduct(item)">
            <span>{{ item.displayName }} · {{ item.packageQuantity }} {{ item.packageUnit }}</span>
            <small>{{ item.id }}</small>
          </button>
        }
      </section>
      <section class="ui-panel-card">
        <h2 class="ui-card-title">{{ loc.t("household.stage9Admin.prices") }}</h2>
        @if (selectedProduct(); as product) {
          <p>
            <strong>{{ product.displayName }}</strong>
            · {{ product.id }}
          </p>
        }
        <div class="stage9-form">
          <select [(ngModel)]="price.kind">
            <option value="base">base</option>
            <option value="offer">offer</option>
            <option value="coupon">coupon</option>
            <option value="loyalty_card">loyalty card</option>
          </select>
          <input type="number" [(ngModel)]="price.amount" placeholder="499" />
          <input [(ngModel)]="price.currencyCode" placeholder="HUF" />
          <input type="date" [(ngModel)]="price.validFrom" />
          <input type="date" [(ngModel)]="price.validTo" />
          <button
            class="ui-button ui-button-primary"
            type="button"
            (click)="appendPrice()"
            [disabled]="!selectedProduct()"
          >
            {{ loc.t("household.stage9Admin.appendPrice") }}
          </button>
        </div>
        @for (item of prices(); track item.id) {
          <p class="stage9-price-row">
            {{ item.kind }} · {{ item.price }} {{ item.currencyCode }} ·
            {{ item.observedAt.slice(0, 10) }}
            @if (item.validFrom || item.validTo) {
              · {{ item.validFrom || "…" }}–{{ item.validTo || "…" }}
            }
          </p>
        }
      </section>
      <section class="ui-panel-card">
        <h2 class="ui-card-title">{{ loc.t("household.stage9Admin.submissions") }}</h2>
        @if (!submissions().length) {
          <p>{{ loc.t("household.stage9Admin.noSubmissions") }}</p>
        }
        @for (item of submissions(); track item.id) {
          <article class="stage9-row">
            <span>
              <strong>{{ item.facts.displayName }}</strong>
              · {{ item.facts.quantity }} {{ item.facts.unit }}
              <small>{{ item.id }}</small>
            </span>
            <span>
              <button
                class="ui-button ui-button-primary ui-button-sm"
                type="button"
                (click)="review(item, 'accepted')"
              >
                {{ loc.t("household.stage9Admin.accept") }}
              </button>
              <button
                class="ui-button ui-button-danger ui-button-sm"
                type="button"
                (click)="review(item, 'rejected')"
              >
                {{ loc.t("household.stage9Admin.reject") }}
              </button>
            </span>
          </article>
        }
      </section>
    </main>
  `,
  styles: [
    `
      .ui-page-stack {
        display: grid;
        gap: 1rem;
      }
      .stage9-form {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .stage9-form input {
        min-width: 10rem;
      }
      .stage9-row {
        align-items: center;
        border-top: 1px solid var(--ui-border);
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        padding: 0.7rem 0;
      }
      .stage9-row small {
        display: block;
        opacity: 0.6;
      }
      .stage9-row span {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
    `
  ]
})
export class Stage9AdminComponent {
  readonly auth = inject(AuthService);
  readonly loc = inject(LocalizationService);
  readonly markets = signal<Market[]>([]);
  readonly submissions = signal<Submission[]>([]);
  readonly products = signal<ShopProduct[]>([]);
  readonly prices = signal<PriceObservation[]>([]);
  readonly selectedProduct = signal<ShopProduct | null>(null);
  market = { id: "", displayName: "", countryCode: "HU", currencyCode: "HUF" };
  selectedMarketId = "";
  shopProduct = {
    id: "",
    productId: "",
    shopMarketId: "",
    displayName: "",
    packageQuantity: 1,
    packageUnit: "count"
  };
  price = { kind: "base", amount: 0, currencyCode: "HUF", validFrom: "", validTo: "" };
  ngOnInit(): void {
    void this.load();
  }
  private headers(): HeadersInit {
    return {
      accept: "application/json",
      "content-type": "application/json",
      ...this.auth.getAuthorizationHeaders()
    };
  }
  async load(): Promise<void> {
    const [markets, submissions] = await Promise.all([
      fetch(buildApiUrl("/api/admin/shop-markets"), { headers: this.headers() }),
      fetch(buildApiUrl("/api/admin/ingestion-submissions?status=pending"), {
        headers: this.headers()
      })
    ]);
    if (markets.ok) this.markets.set(((await markets.json()) as { markets: Market[] }).markets);
    if (submissions.ok)
      this.submissions.set(
        ((await submissions.json()) as { submissions: Submission[] }).submissions
      );
    if (this.markets().length && !this.selectedMarketId) {
      this.selectedMarketId = this.markets()[0]!.id;
      this.shopProduct.shopMarketId = this.selectedMarketId;
      await this.loadProducts();
    }
  }
  async loadProducts(): Promise<void> {
    if (!this.selectedMarketId) return;
    this.shopProduct.shopMarketId = this.selectedMarketId;
    const response = await fetch(
      buildApiUrl(
        `/api/admin/shop-products?shopMarketId=${encodeURIComponent(this.selectedMarketId)}`
      ),
      { headers: this.headers() }
    );
    if (response.ok)
      this.products.set(((await response.json()) as { products: ShopProduct[] }).products);
  }
  async selectProduct(product: ShopProduct): Promise<void> {
    this.selectedProduct.set(product);
    const response = await fetch(
      buildApiUrl(`/api/admin/price-observations?shopProductId=${encodeURIComponent(product.id)}`),
      { headers: this.headers() }
    );
    if (response.ok)
      this.prices.set(
        ((await response.json()) as { observations: PriceObservation[] }).observations
      );
  }
  async saveShopProduct(): Promise<void> {
    const response = await fetch(buildApiUrl("/api/admin/shop-products"), {
      body: JSON.stringify({ ...this.shopProduct, aliases: [] }),
      headers: this.headers(),
      method: "POST"
    });
    if (response.ok) await this.loadProducts();
  }
  async appendPrice(): Promise<void> {
    const product = this.selectedProduct();
    if (!product) return;
    const response = await fetch(buildApiUrl("/api/admin/price-observations"), {
      body: JSON.stringify({
        id: `price:${product.id}:${Date.now()}`,
        shopProductId: product.id,
        currencyCode: this.price.currencyCode,
        kind: this.price.kind,
        observedAt: new Date().toISOString(),
        price: this.price.amount,
        validFrom: this.price.validFrom || null,
        validTo: this.price.validTo || null
      }),
      headers: this.headers(),
      method: "POST"
    });
    if (response.ok) await this.selectProduct(product);
  }
  async createMarket(): Promise<void> {
    const response = await fetch(buildApiUrl("/api/admin/shop-markets"), {
      body: JSON.stringify(this.market),
      headers: this.headers(),
      method: "POST"
    });
    if (response.ok) {
      this.market = { id: "", displayName: "", countryCode: "HU", currencyCode: "HUF" };
      await this.load();
    }
  }
  async review(item: Submission, status: "accepted" | "rejected"): Promise<void> {
    const response = await fetch(
      buildApiUrl(`/api/admin/ingestion-submissions/${encodeURIComponent(item.id)}`),
      {
        body: JSON.stringify({ expectedRevision: item.revision, status }),
        headers: this.headers(),
        method: "PATCH"
      }
    );
    if (response.ok) await this.load();
  }
}
