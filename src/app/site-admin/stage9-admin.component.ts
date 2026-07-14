import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { BrowserLoggerService } from "../browser-logger.service";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";
import { isRecord, isRecordArray } from "../shared/api-response-guards";

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
        @if (errorMessage()) {
          <p class="ui-copy-error" role="alert">{{ errorMessage() }}</p>
        }
        @if (statusMessage()) {
          <p class="stage9-status" role="status">{{ statusMessage() }}</p>
        }
      </section>
      <section class="ui-panel-card">
        <h2 class="ui-card-title">{{ loc.t("household.stage9Admin.markets") }}</h2>
        <div class="stage9-form">
          <input
            [(ngModel)]="market.id"
            [placeholder]="loc.t('household.stage9Admin.marketIdPlaceholder')"
          />
          <input
            [(ngModel)]="market.displayName"
            [placeholder]="loc.t('household.stage9Admin.marketNamePlaceholder')"
          />
          <input
            [(ngModel)]="market.countryCode"
            [placeholder]="loc.t('household.stage9Admin.countryCodePlaceholder')"
          />
          <input
            [(ngModel)]="market.currencyCode"
            [placeholder]="loc.t('household.stage9Admin.currencyCodePlaceholder')"
          />
          <button
            class="ui-button ui-button-primary"
            type="button"
            (click)="createMarket()"
            [disabled]="isBusy()"
          >
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
          <select
            [(ngModel)]="selectedMarketId"
            (ngModelChange)="loadProducts()"
            [disabled]="isBusy()"
          >
            <option value="">{{ loc.t("household.stage9Admin.selectMarket") }}</option>
            @for (item of markets(); track item.id) {
              <option [value]="item.id">{{ item.displayName }}</option>
            }
          </select>
          <input
            [(ngModel)]="shopProduct.id"
            [placeholder]="loc.t('household.stage9Admin.shopProductIdPlaceholder')"
          />
          <input
            [(ngModel)]="shopProduct.productId"
            [placeholder]="loc.t('household.stage9Admin.catalogProductIdPlaceholder')"
          />
          <input
            [(ngModel)]="shopProduct.displayName"
            [placeholder]="loc.t('household.stage9Admin.shopProductNamePlaceholder')"
          />
          <input
            type="number"
            [(ngModel)]="shopProduct.packageQuantity"
            [placeholder]="loc.t('household.stage9Admin.packageQuantityPlaceholder')"
          />
          <input
            [(ngModel)]="shopProduct.packageUnit"
            [placeholder]="loc.t('household.stage9Admin.packageUnitPlaceholder')"
          />
          <button
            class="ui-button ui-button-primary"
            type="button"
            (click)="saveShopProduct()"
            [disabled]="isBusy()"
          >
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
          <select [(ngModel)]="price.kind" [disabled]="isBusy()">
            <option value="base">{{ loc.t("household.stage9Admin.priceBase") }}</option>
            <option value="offer">{{ loc.t("household.stage9Admin.priceOffer") }}</option>
            <option value="coupon">{{ loc.t("household.stage9Admin.priceCoupon") }}</option>
            <option value="loyalty_card">
              {{ loc.t("household.stage9Admin.priceLoyaltyCard") }}
            </option>
          </select>
          <input
            type="number"
            [(ngModel)]="price.amount"
            [placeholder]="loc.t('household.stage9Admin.priceAmountPlaceholder')"
          />
          <input
            [(ngModel)]="price.currencyCode"
            [placeholder]="loc.t('household.stage9Admin.currencyCodePlaceholder')"
          />
          <input
            type="date"
            [(ngModel)]="price.validFrom"
            [attr.aria-label]="loc.t('household.stage9Admin.validFrom')"
          />
          <input
            type="date"
            [(ngModel)]="price.validTo"
            [attr.aria-label]="loc.t('household.stage9Admin.validTo')"
          />
          <button
            class="ui-button ui-button-primary"
            type="button"
            (click)="appendPrice()"
            [disabled]="!selectedProduct() || isBusy()"
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
                [disabled]="isBusy()"
              >
                {{ loc.t("household.stage9Admin.accept") }}
              </button>
              <button
                class="ui-button ui-button-danger ui-button-sm"
                type="button"
                (click)="review(item, 'rejected')"
                [disabled]="isBusy()"
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
      .stage9-status {
        color: var(--ui-text-muted);
        margin: 0;
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
  readonly errorMessage = signal("");
  readonly statusMessage = signal("");
  readonly isBusy = signal(false);
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
  private readonly logger = inject(BrowserLoggerService);
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
  async load(): Promise<boolean> {
    this.beginAction();
    this.isBusy.set(true);
    try {
      const [markets, submissions] = await Promise.all([
        fetch(buildApiUrl("/api/admin/shop-markets"), { headers: this.headers() }),
        fetch(buildApiUrl("/api/admin/ingestion-submissions?status=pending"), {
          headers: this.headers()
        })
      ]);
      let failed = false;
      if (markets.ok) {
        const payload = (await markets.json().catch(() => null)) as unknown;
        if (isRecord(payload) && isRecordArray(payload["markets"])) {
          this.markets.set(payload["markets"] as unknown as Market[]);
        } else {
          failed = true;
          this.failAction("household.stage9Admin.loadFailure", "Stage 9 admin markets load failed");
        }
      } else {
        failed = true;
        this.failAction("household.stage9Admin.loadFailure", "Stage 9 admin markets load failed", {
          status: markets.status
        });
      }
      if (submissions.ok) {
        const payload = (await submissions.json().catch(() => null)) as unknown;
        if (isRecord(payload) && isRecordArray(payload["submissions"])) {
          this.submissions.set(payload["submissions"] as unknown as Submission[]);
        } else {
          failed = true;
          this.failAction(
            "household.stage9Admin.loadFailure",
            "Stage 9 admin submissions load failed"
          );
        }
      } else {
        failed = true;
        this.failAction(
          "household.stage9Admin.loadFailure",
          "Stage 9 admin submissions load failed",
          { status: submissions.status }
        );
      }
      if (!failed && this.markets().length && !this.selectedMarketId) {
        this.selectedMarketId = this.markets()[0]!.id;
        this.shopProduct.shopMarketId = this.selectedMarketId;
        return await this.loadProducts();
      }
      return !failed;
    } catch (error: unknown) {
      this.failAction("household.stage9Admin.requestFailure", "Stage 9 admin load failed", {
        error
      });
      return false;
    } finally {
      this.isBusy.set(false);
    }
  }
  async loadProducts(): Promise<boolean> {
    if (!this.selectedMarketId) return false;
    this.beginAction();
    this.shopProduct.shopMarketId = this.selectedMarketId;
    this.selectedProduct.set(null);
    this.prices.set([]);
    this.isBusy.set(true);
    try {
      const response = await fetch(
        buildApiUrl(
          `/api/admin/shop-products?shopMarketId=${encodeURIComponent(this.selectedMarketId)}`
        ),
        { headers: this.headers() }
      );
      if (!response.ok) {
        this.failAction("household.stage9Admin.loadFailure", "Shop Product load failed", {
          status: response.status,
          shopMarketId: this.selectedMarketId
        });
        return false;
      }
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!isRecord(payload) || !isRecordArray(payload["products"])) {
        this.failAction("household.stage9Admin.loadFailure", "Shop Product load failed", {
          shopMarketId: this.selectedMarketId
        });
        return false;
      }
      this.products.set(payload["products"] as unknown as ShopProduct[]);
      return true;
    } catch (error: unknown) {
      this.failAction("household.stage9Admin.requestFailure", "Shop Product load failed", {
        error,
        shopMarketId: this.selectedMarketId
      });
      return false;
    } finally {
      this.isBusy.set(false);
    }
  }
  async selectProduct(product: ShopProduct): Promise<boolean> {
    this.selectedProduct.set(product);
    this.beginAction();
    this.isBusy.set(true);
    try {
      const response = await fetch(
        buildApiUrl(
          `/api/admin/price-observations?shopProductId=${encodeURIComponent(product.id)}`
        ),
        { headers: this.headers() }
      );
      if (!response.ok) {
        this.failAction("household.stage9Admin.loadFailure", "Price history load failed", {
          status: response.status,
          shopProductId: product.id
        });
        return false;
      }
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!isRecord(payload) || !isRecordArray(payload["observations"])) {
        this.failAction("household.stage9Admin.loadFailure", "Price history load failed", {
          shopProductId: product.id
        });
        return false;
      }
      this.prices.set(payload["observations"] as unknown as PriceObservation[]);
      return true;
    } catch (error: unknown) {
      this.failAction("household.stage9Admin.requestFailure", "Price history load failed", {
        error,
        shopProductId: product.id
      });
      return false;
    } finally {
      this.isBusy.set(false);
    }
  }
  async saveShopProduct(): Promise<void> {
    if (
      !this.shopProduct.id.trim() ||
      !this.shopProduct.productId.trim() ||
      !this.shopProduct.displayName.trim() ||
      !this.shopProduct.packageUnit.trim() ||
      !Number.isFinite(this.shopProduct.packageQuantity) ||
      this.shopProduct.packageQuantity <= 0
    ) {
      this.failAction("household.stage9Admin.invalidShopProduct", "Invalid Shop Product form");
      return;
    }
    this.beginAction();
    this.isBusy.set(true);
    try {
      const response = await fetch(buildApiUrl("/api/admin/shop-products"), {
        body: JSON.stringify({
          ...this.shopProduct,
          aliases: [],
          displayName: this.shopProduct.displayName.trim(),
          id: this.shopProduct.id.trim(),
          packageUnit: this.shopProduct.packageUnit.trim(),
          productId: this.shopProduct.productId.trim()
        }),
        headers: this.headers(),
        method: "POST"
      });
      if (!response.ok) {
        this.failAction("household.stage9Admin.saveFailure", "Shop Product save failed", {
          status: response.status,
          shopProductId: this.shopProduct.id
        });
        return;
      }
      if (await this.loadProducts())
        this.succeedAction("household.stage9Admin.shopProductSaved", "Shop Product saved");
    } catch (error: unknown) {
      this.failAction("household.stage9Admin.requestFailure", "Shop Product save failed", {
        error,
        shopProductId: this.shopProduct.id
      });
    } finally {
      this.isBusy.set(false);
    }
  }
  async appendPrice(): Promise<void> {
    const product = this.selectedProduct();
    if (!product) return;
    if (
      !this.price.currencyCode.trim() ||
      !Number.isFinite(this.price.amount) ||
      this.price.amount < 0 ||
      (this.price.validFrom && this.price.validTo && this.price.validFrom > this.price.validTo)
    ) {
      this.failAction("household.stage9Admin.invalidPrice", "Invalid price observation form");
      return;
    }
    this.beginAction();
    this.isBusy.set(true);
    try {
      const response = await fetch(buildApiUrl("/api/admin/price-observations"), {
        body: JSON.stringify({
          id: `price:${product.id}:${Date.now()}`,
          shopProductId: product.id,
          currencyCode: this.price.currencyCode.trim(),
          kind: this.price.kind,
          observedAt: new Date().toISOString(),
          price: this.price.amount,
          validFrom: this.price.validFrom || null,
          validTo: this.price.validTo || null
        }),
        headers: this.headers(),
        method: "POST"
      });
      if (!response.ok) {
        this.failAction("household.stage9Admin.saveFailure", "Price observation save failed", {
          status: response.status,
          shopProductId: product.id
        });
        return;
      }
      if (await this.selectProduct(product))
        this.succeedAction("household.stage9Admin.priceSaved", "Price observation saved");
    } catch (error: unknown) {
      this.failAction("household.stage9Admin.requestFailure", "Price observation save failed", {
        error,
        shopProductId: product.id
      });
    } finally {
      this.isBusy.set(false);
    }
  }
  async createMarket(): Promise<void> {
    if (
      !this.market.id.trim() ||
      !this.market.displayName.trim() ||
      !this.market.countryCode.trim() ||
      !this.market.currencyCode.trim()
    ) {
      this.failAction("household.stage9Admin.invalidMarket", "Invalid Shop Market form");
      return;
    }
    this.beginAction();
    this.isBusy.set(true);
    try {
      const response = await fetch(buildApiUrl("/api/admin/shop-markets"), {
        body: JSON.stringify({
          ...this.market,
          countryCode: this.market.countryCode.trim(),
          currencyCode: this.market.currencyCode.trim(),
          displayName: this.market.displayName.trim(),
          id: this.market.id.trim()
        }),
        headers: this.headers(),
        method: "POST"
      });
      if (!response.ok) {
        this.failAction("household.stage9Admin.saveFailure", "Shop Market save failed", {
          status: response.status,
          marketId: this.market.id
        });
        return;
      }
      this.market = { id: "", displayName: "", countryCode: "HU", currencyCode: "HUF" };
      if (await this.load())
        this.succeedAction("household.stage9Admin.marketSaved", "Shop Market saved");
    } catch (error: unknown) {
      this.failAction("household.stage9Admin.requestFailure", "Shop Market save failed", {
        error,
        marketId: this.market.id
      });
    } finally {
      this.isBusy.set(false);
    }
  }
  async review(item: Submission, status: "accepted" | "rejected"): Promise<void> {
    this.beginAction();
    this.isBusy.set(true);
    try {
      const response = await fetch(
        buildApiUrl(`/api/admin/ingestion-submissions/${encodeURIComponent(item.id)}`),
        {
          body: JSON.stringify({ expectedRevision: item.revision, status }),
          headers: this.headers(),
          method: "PATCH"
        }
      );
      if (!response.ok) {
        this.failAction(
          "household.stage9Admin.reviewFailure",
          "Ingestion submission review failed",
          {
            status: response.status,
            submissionId: item.id
          }
        );
        return;
      }
      if (await this.load())
        this.succeedAction(
          "household.stage9Admin.submissionReviewed",
          "Ingestion submission reviewed"
        );
    } catch (error: unknown) {
      this.failAction(
        "household.stage9Admin.requestFailure",
        "Ingestion submission review failed",
        {
          error,
          submissionId: item.id
        }
      );
    } finally {
      this.isBusy.set(false);
    }
  }
  private beginAction(): void {
    this.errorMessage.set("");
    this.statusMessage.set("");
  }
  private failAction(
    messageKey: TranslationKey,
    logMessage: string,
    details?: Record<string, unknown>
  ): void {
    this.errorMessage.set(this.loc.t(messageKey));
    this.logger.log("error", logMessage, details);
  }
  private succeedAction(messageKey: TranslationKey, logMessage: string): void {
    this.errorMessage.set("");
    this.statusMessage.set(this.loc.t(messageKey));
    this.logger.log("info", logMessage);
  }
}
