import { Component, computed, inject, signal, type OnInit } from "@angular/core";

import { logBrowserEvent } from "./browser-logger";
import { AuthService } from "./auth.service";

interface HealthReport {
  checklist?: HealthCheckItem[];
  checks: {
    api: HealthCheckItem;
    database: HealthCheckItem;
  };
  stage: string;
  status: string;
}

interface HealthCheckError {
  code?: string;
  message: string;
  name: string;
}

interface HealthCheckItem {
  databaseName?: string | null;
  error?: HealthCheckError;
  id: string;
  label: string;
  message: string;
  status: string;
}

@Component({
  selector: "app-health-check",
  standalone: true,
  template: `
    <section class="health-page" aria-labelledby="health-title">
      <div class="health-copy">
        <p class="eyebrow">Runtime</p>
        <h1 id="health-title">Health check</h1>
        <p>
          Verify the shared API route and database connection path used by local
          development and Vercel Functions.
        </p>
      </div>

      @if (!auth.token()) {
        <section class="status-panel unauthorized-panel" aria-live="polite">
          <div class="status-heading">
            <p class="status-kicker">Admin only</p>
            <p class="status-summary">Sign in to view health checks.</p>
          </div>
          <p class="status-message">
            Use the header login with an active admin user, then the health checklist will be available here.
          </p>
        </section>
      } @else {
        <section class="status-panel" aria-live="polite">
        <div class="status-heading">
          <p class="status-kicker">Current State</p>
          <p class="status-summary">{{ healthSummary() }}</p>
        </div>

        @if (healthMessage(); as message) {
          <p class="status-message">{{ message }}</p>
        }

        <div class="button-row">
          <button
            class="run-button"
            type="button"
            (click)="runHealthCheck()"
            [disabled]="isMaintenanceBusy()"
          >
            {{ healthState() === "loading" ? "Checking..." : "Run health check" }}
          </button>

          <button
            class="maintenance-button"
            type="button"
            title="Runs MongoDB collMod for each catalog collection, replacing its validator with the current catalog/v1 JSON schema. Requires a MongoDB user with collection validator privileges such as dbAdmin."
            (click)="upgradeCatalogValidators()"
            [disabled]="isMaintenanceBusy()"
          >
            {{ validatorUpgradeState() === "loading" ? "Upgrading..." : "Upgrade catalog validators" }}
          </button>

          <button
            class="maintenance-button"
            type="button"
            title="Sets missing product validation fields to validationStatus=unvalidated on legacy product documents. Run the validator upgrade first if MongoDB rejects the new validation fields."
            (click)="backfillLegacyProductsAsUnvalidated()"
            [disabled]="isMaintenanceBusy()"
          >
            {{ invalidationState() === "loading" ? "Updating..." : "Set legacy products unvalidated" }}
          </button>
        </div>

        @if (validatorUpgradeMessage(); as message) {
          <p class="maintenance-message">{{ message }}</p>
        }

        @if (invalidationMessage(); as message) {
          <p class="maintenance-message">{{ message }}</p>
        }

        @if (healthChecks().length) {
          <div class="check-list" aria-label="Health checks">
            @for (check of healthChecks(); track check.id) {
              <article
                class="check-card"
                [class.check-card-ok]="check.status === 'ok'"
                [class.check-card-problem]="check.status !== 'ok'"
              >
                <div class="check-heading">
                  <h2>{{ check.label }}</h2>
                  <span>{{ check.status }}</span>
                </div>
                <p>{{ check.message }}</p>

                @if (check.databaseName !== undefined) {
                  <dl>
                    <div>
                      <dt>Database</dt>
                      <dd>{{ check.databaseName ?? "not configured" }}</dd>
                    </div>
                  </dl>
                }

                @if (check.error; as error) {
                  <div class="error-block">
                    <p class="error-title">{{ error.name }}</p>
                    <p>{{ error.message }}</p>
                    @if (error.code) {
                      <p>Code: {{ error.code }}</p>
                    }
                  </div>
                }
              </article>
            }
          </div>
        }
        </section>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }

      .health-page {
        display: grid;
        gap: var(--space-6);
        grid-template-columns: minmax(0, 1fr);
      }

      .health-copy {
        display: grid;
        gap: var(--space-3);
        max-width: 43rem;
      }

      .eyebrow,
      .status-kicker {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(2rem, 5vw, 3.4rem);
        line-height: 1.05;
      }

      .health-copy p:last-child {
        color: var(--color-text-muted);
        font-size: 1rem;
        line-height: 1.65;
      }

      .status-panel {
        background: color-mix(in srgb, var(--color-surface) 90%, white 10%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 18%, transparent);
        border-radius: 8px;
        box-shadow: 0 1.2rem 2.6rem rgb(48 43 50 / 10%);
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 2.5vw, 1.5rem);
      }

      .unauthorized-panel {
        align-content: center;
      }

      .status-heading {
        display: grid;
        gap: 0.35rem;
      }

      .status-summary,
      .status-message {
        color: var(--color-text);
      }

      .status-summary {
        font-size: 1.05rem;
        font-weight: 700;
      }

      .run-button {
        background: var(--color-accent-leaf-strong);
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf-strong) 72%, black 28%);
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        justify-self: start;
        min-height: 2.75rem;
        min-width: 11rem;
        padding: 0.72rem 1rem;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .maintenance-button {
        background: color-mix(in srgb, var(--color-wood) 88%, white 12%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 72%, black 28%);
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        min-height: 2.75rem;
        min-width: 13rem;
        padding: 0.72rem 1rem;
      }

      .run-button:disabled {
        cursor: progress;
        opacity: 0.74;
      }

      .maintenance-button:disabled {
        cursor: progress;
        opacity: 0.74;
      }

      .maintenance-message {
        color: var(--color-text-muted);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0;
      }

      .check-list {
        display: grid;
        gap: var(--space-3);
      }

      .check-card {
        background: color-mix(in srgb, var(--color-background-soft) 74%, white 26%);
        border: 1px solid rgb(255 255 255 / 66%);
        border-radius: 8px;
        display: grid;
        gap: var(--space-3);
        padding: 1rem;
      }

      .check-card-ok {
        border-color: color-mix(in srgb, var(--color-accent-leaf) 36%, white 64%);
      }

      .check-card-problem {
        border-color: color-mix(in srgb, var(--color-wood) 38%, white 62%);
      }

      .check-heading {
        align-items: center;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      h2 {
        color: var(--color-text);
        font-size: 1rem;
        line-height: 1.25;
        margin: 0;
      }

      .check-heading span {
        background: rgb(255 255 255 / 60%);
        border-radius: 8px;
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        padding: 0.35rem 0.55rem;
      }

      .check-card p {
        color: var(--color-text);
        margin: 0;
      }

      dl {
        display: grid;
        margin: 0;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        font-weight: 700;
        margin: 0;
        text-transform: uppercase;
      }

      dd {
        color: var(--color-text);
        font-size: 1rem;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .error-block {
        background: rgb(255 255 255 / 58%);
        border-radius: 8px;
        display: grid;
        gap: 0.35rem;
        padding: 0.85rem;
      }

      .error-block .error-title {
        color: var(--color-text);
        font-weight: 700;
      }

      .error-block p {
        color: var(--color-text-muted);
        overflow-wrap: anywhere;
      }

      @media (min-width: 900px) {
        .health-page {
          grid-template-columns: minmax(16rem, 0.65fr) minmax(24rem, 1fr);
        }
      }
    `
  ]
})
export class HealthCheckComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly healthMessage = signal("Run the health check to verify the shared server path.");
  readonly healthReport = signal<HealthReport | null>(null);
  readonly healthState = signal<"idle" | "loading" | "error" | "success">("idle");
  readonly invalidationMessage = signal("");
  readonly invalidationState = signal<"idle" | "loading" | "error" | "success">("idle");
  readonly validatorUpgradeMessage = signal("");
  readonly validatorUpgradeState = signal<"idle" | "loading" | "error" | "success">("idle");
  readonly healthChecks = computed((): HealthCheckItem[] => {
    const report = this.healthReport();
    if (!report) {
      return [];
    }

    if (report.checklist?.length) {
      return report.checklist;
    }

    return [report.checks.api, report.checks.database];
  });
  readonly healthSummary = computed(() => {
    const state = this.healthState();
    const report = this.healthReport();

    if (state === "loading") {
      return "Checking API and database connectivity...";
    }

    if (report) {
      return `Health is ${report.status}.`;
    }

    if (state === "error") {
      return "Health check could not be completed.";
    }

    return "No health check has been run yet.";
  });
  readonly isMaintenanceBusy = computed(() =>
    this.healthState() === "loading"
      || this.invalidationState() === "loading"
      || this.validatorUpgradeState() === "loading"
  );

  ngOnInit(): void {
    void this.auth.loadCurrentUser();
  }

  async runHealthCheck(): Promise<void> {
    if (!this.auth.token()) {
      this.healthReport.set(null);
      this.healthState.set("error");
      this.healthMessage.set("Sign in before running the health check.");
      return;
    }

    this.healthState.set("loading");
    this.healthMessage.set("");

    logBrowserEvent("info", "Health check requested from health screen", {
      pathname: window.location.pathname
    });

    try {
      const response = await fetch("/api/health", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "GET"
      });

      if (response.status === 401) {
        await this.auth.logout();
        this.healthReport.set(null);
        this.healthState.set("error");
        this.healthMessage.set("Sign in before running the health check.");
        return;
      }

      const report = (await response.json()) as HealthReport;

      this.healthReport.set(report);
      this.healthState.set(response.ok ? "success" : "error");
      this.healthMessage.set(response.ok
        ? "Shared API health route responded successfully."
        : "Shared API health route responded with a degraded or failed status.");

      logBrowserEvent("info", "Health check response received", {
        httpStatus: response.status,
        databaseStatus: report.checks.database.status,
        status: report.status
      });
    } catch (error: unknown) {
      this.healthReport.set(null);
      this.healthState.set("error");
      this.healthMessage.set("The browser could not reach the health route.");

      logBrowserEvent("error", "Health check request failed", error);
    }
  }

  async upgradeCatalogValidators(): Promise<void> {
    if (!this.auth.token()) {
      this.validatorUpgradeState.set("error");
      this.validatorUpgradeMessage.set("Sign in before using the validator upgrade action.");
      return;
    }

    this.validatorUpgradeState.set("loading");
    this.validatorUpgradeMessage.set("");

    logBrowserEvent("info", "Catalog validator upgrade requested from health screen", {
      pathname: window.location.pathname
    });

    try {
      const response = await fetch("/api/health/upgrade-catalog-validators", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });

      if (response.status === 401) {
        await this.auth.logout();
        this.validatorUpgradeState.set("error");
        this.validatorUpgradeMessage.set("Sign in before using the validator upgrade action.");
        return;
      }

      const payload = (await response.json()) as {
        createdCollections?: string[];
        message?: string;
        upgradedCollections?: string[];
      };

      this.validatorUpgradeState.set(response.ok ? "success" : "error");
      this.validatorUpgradeMessage.set(response.ok
        ? `Upgraded ${payload.upgradedCollections?.length ?? 0} catalog validators and created ${payload.createdCollections?.length ?? 0} missing collections.`
        : "Catalog validators could not be upgraded.");

      logBrowserEvent("info", "Catalog validator upgrade response received", {
        createdCollectionCount: payload.createdCollections?.length,
        httpStatus: response.status,
        upgradedCollectionCount: payload.upgradedCollections?.length
      });
    } catch (error: unknown) {
      this.validatorUpgradeState.set("error");
      this.validatorUpgradeMessage.set("The browser could not reach the validator upgrade route.");

      logBrowserEvent("error", "Catalog validator upgrade request failed", error);
    }
  }

  async backfillLegacyProductsAsUnvalidated(): Promise<void> {
    if (!this.auth.token()) {
      this.invalidationState.set("error");
      this.invalidationMessage.set("Sign in before using the maintenance action.");
      return;
    }

    this.invalidationState.set("loading");
    this.invalidationMessage.set("");

    logBrowserEvent("info", "Legacy validation backfill requested from health screen", {
      pathname: window.location.pathname
    });

    try {
      const response = await fetch("/api/health/backfill-unvalidated-products", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });

      if (response.status === 401) {
        await this.auth.logout();
        this.invalidationState.set("error");
        this.invalidationMessage.set("Sign in before using the maintenance action.");
        return;
      }

      const payload = (await response.json()) as {
        message?: string;
        skippedCount?: number;
        status?: "updated" | "validator_incompatible";
        updatedCount?: number;
      };

      this.invalidationState.set(response.ok ? "success" : "error");
      this.invalidationMessage.set(response.ok
        ? this.formatLegacyBackfillMessage(payload)
        : "Legacy product backfill could not be completed.");

      logBrowserEvent("info", "Legacy validation backfill response received", {
        httpStatus: response.status,
        skippedCount: payload.skippedCount,
        status: payload.status,
        updatedCount: payload.updatedCount
      });
    } catch (error: unknown) {
      this.invalidationState.set("error");
      this.invalidationMessage.set("The browser could not reach the backfill route.");

      logBrowserEvent("error", "Legacy validation backfill request failed", error);
    }
  }

  private formatLegacyBackfillMessage(payload: {
    message?: string;
    skippedCount?: number;
    status?: "updated" | "validator_incompatible";
    updatedCount?: number;
  }): string {
    if (payload.status === "validator_incompatible") {
      return `No product documents were changed; ${payload.skippedCount ?? 0} legacy products are already shown as unvalidated by compatibility fallback.`;
    }

    return `Marked ${payload.updatedCount ?? 0} legacy products as unvalidated.`;
  }
}
