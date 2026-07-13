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
  market = { id: "", displayName: "", countryCode: "HU", currencyCode: "HUF" };
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
