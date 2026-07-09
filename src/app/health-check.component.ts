import { Component, computed, inject, signal, type OnInit } from "@angular/core";

import { logBrowserEvent } from "./browser-logger";
import { AuthService } from "./auth.service";
import { readApiErrorMessage } from "./shared/api-errors";
import { LocalizationService } from "./shared/localization.service";
import { ToastService } from "./shared/toast.service";

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
        <p class="eyebrow">{{ loc.t("health.runtime") }}</p>
        <h1 id="health-title">{{ loc.t("common.healthCheck") }}</h1>
        <p>
          {{ loc.t("health.description") }}
        </p>
      </div>

      @if (!auth.token()) {
        <section class="status-panel unauthorized-panel" aria-live="polite">
          <div class="status-heading">
            <p class="status-kicker">{{ loc.t("common.adminOnly") }}</p>
            <p class="status-summary">{{ loc.t("health.signIn") }}</p>
          </div>
          <p class="status-message">
            {{ loc.t("health.intro") }}
          </p>
        </section>
      } @else {
        <section class="status-panel" aria-live="polite">
        <div class="status-heading">
          <p class="status-kicker">{{ loc.t("common.state") }}</p>
          <p class="status-summary">{{ healthSummary() }}</p>
        </div>

        @if (healthMessage(); as message) {
          <p class="status-message">{{ message }}</p>
        }

        <div class="button-row">
          <button
            class="run-button ui-button"
            type="button"
            (click)="runHealthCheck()"
            [disabled]="isMaintenanceBusy()"
          >
            {{ healthState() === "loading" ? loc.t("health.checking") : loc.t("health.run") }}
          </button>

          <button
            class="maintenance-button ui-button ui-button-warm"
            type="button"
            [title]="loc.t('health.upgradeTitle')"
            (click)="upgradeCatalogValidators()"
            [disabled]="isMaintenanceBusy()"
          >
            {{ validatorUpgradeState() === "loading" ? loc.t("health.upgrading") : loc.t("health.upgradeValidators") }}
          </button>

          <button
            class="maintenance-button ui-button ui-button-warm"
            type="button"
            [title]="loc.t('health.backfillTitle')"
            (click)="backfillLegacyProductsAsUnvalidated()"
            [disabled]="isMaintenanceBusy()"
          >
            {{ invalidationState() === "loading" ? loc.t("health.updating") : loc.t("health.unvalidated") }}
          </button>
        </div>

        @if (validatorUpgradeMessage(); as message) {
          <p class="maintenance-message">{{ message }}</p>
        }

        @if (invalidationMessage(); as message) {
          <p class="maintenance-message">{{ message }}</p>
        }

        @if (healthChecks().length) {
          <div class="check-list" [attr.aria-label]="loc.t('common.healthCheck')">
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
                      <dt>{{ loc.t("common.database") }}</dt>
                      <dd>{{ check.databaseName ?? loc.t("common.notConfigured") }}</dd>
                    </div>
                  </dl>
                }

                @if (check.error; as error) {
                  <div class="error-block">
                    <p class="error-title">{{ error.name }}</p>
                    <p>{{ error.message }}</p>
                    @if (error.code) {
                      <p>{{ loc.t("common.code") }}: {{ error.code }}</p>
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
        background: var(--surface-panel-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
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
        justify-self: start;
        min-width: 11rem;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .maintenance-button {
        min-width: 13rem;
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
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: var(--space-3);
        padding: 1rem;
      }

      .check-card-ok {
        border-color: color-mix(in srgb, var(--color-accent-leaf) 36%, var(--color-card-tint) 64%);
      }

      .check-card-problem {
        border-color: color-mix(in srgb, var(--color-wood) 38%, var(--color-card-tint) 62%);
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
        background: color-mix(in srgb, var(--color-card-tint) 54%, var(--color-surface) 46%);
        border-radius: var(--radius-ui);
        color: var(--color-on-soft-accent);
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
        background: var(--surface-soft-background);
        border-radius: var(--radius-ui);
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
  readonly loc = inject(LocalizationService);
  readonly toast = inject(ToastService);
  readonly healthMessage = signal("");
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
      return this.loc.t("health.checkingConnectivity");
    }

    if (report) {
      return this.loc.t("health.summary", { status: report.status });
    }

    if (state === "error") {
      return this.loc.t("health.failure");
    }

    return this.loc.t("health.noRun");
  });
  readonly isMaintenanceBusy = computed(() =>
    this.healthState() === "loading"
      || this.invalidationState() === "loading"
      || this.validatorUpgradeState() === "loading"
  );

  ngOnInit(): void {
    void this.auth.loadCurrentUser();
    this.healthMessage.set(this.loc.t("health.runFirst"));
  }

  async runHealthCheck(): Promise<void> {
    if (!this.auth.token()) {
      this.healthReport.set(null);
      this.healthState.set("error");
      this.healthMessage.set(this.loc.t("health.signInBeforeRun"));
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
        this.healthMessage.set(this.loc.t("health.signInBeforeRun"));
        this.toast.push(this.loc.t("health.signInBeforeRun"), "error");
        return;
      }

      const report = (await response.json()) as HealthReport;

      this.healthReport.set(report);
      this.healthState.set(response.ok ? "success" : "error");
      this.healthMessage.set(response.ok
        ? this.loc.t("health.success")
        : this.loc.t("health.degraded"));
      if (!response.ok) {
        this.toast.push(await readApiErrorMessage(response, this.loc.t("health.routeError")), "error");
      }

      logBrowserEvent("info", "Health check response received", {
        httpStatus: response.status,
        databaseStatus: report.checks.database.status,
        status: report.status
      });
    } catch (error: unknown) {
      this.healthReport.set(null);
      this.healthState.set("error");
      this.healthMessage.set(this.loc.t("health.browserHealthFailure"));
      this.toast.push(this.loc.t("health.browserHealthFailure"), "error");

      logBrowserEvent("error", "Health check request failed", error);
    }
  }

  async upgradeCatalogValidators(): Promise<void> {
    if (!this.auth.token()) {
      this.validatorUpgradeState.set("error");
      this.validatorUpgradeMessage.set(this.loc.t("health.signInBeforeValidator"));
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
        this.validatorUpgradeMessage.set(this.loc.t("health.signInBeforeValidator"));
        this.toast.push(this.loc.t("health.signInBeforeValidator"), "error");
        return;
      }

      const payload = (await response.json()) as {
        createdCollections?: string[];
        message?: string;
        upgradedCollections?: string[];
      };

      this.validatorUpgradeState.set(response.ok ? "success" : "error");
      this.validatorUpgradeMessage.set(response.ok
        ? this.loc.t("health.upgradeSuccess", {
          created: payload.createdCollections?.length ?? 0,
          upgraded: payload.upgradedCollections?.length ?? 0
        })
        : this.loc.t("health.upgradeFailure"));
      if (!response.ok) {
        this.toast.push(payload.message ?? this.loc.t("health.upgradeFailure"), "error");
      }

      logBrowserEvent("info", "Catalog validator upgrade response received", {
        createdCollectionCount: payload.createdCollections?.length,
        httpStatus: response.status,
        upgradedCollectionCount: payload.upgradedCollections?.length
      });
    } catch (error: unknown) {
      this.validatorUpgradeState.set("error");
      this.validatorUpgradeMessage.set(this.loc.t("health.browserValidatorFailure"));
      this.toast.push(this.loc.t("health.browserValidatorFailure"), "error");

      logBrowserEvent("error", "Catalog validator upgrade request failed", error);
    }
  }

  async backfillLegacyProductsAsUnvalidated(): Promise<void> {
    if (!this.auth.token()) {
      this.invalidationState.set("error");
      this.invalidationMessage.set(this.loc.t("health.signInBeforeMaintenance"));
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
        this.invalidationMessage.set(this.loc.t("health.signInBeforeMaintenance"));
        this.toast.push(this.loc.t("health.signInBeforeMaintenance"), "error");
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
        : this.loc.t("health.backfillFailure"));
      if (!response.ok) {
        this.toast.push(payload.message ?? this.loc.t("health.backfillFailure"), "error");
      }

      logBrowserEvent("info", "Legacy validation backfill response received", {
        httpStatus: response.status,
        skippedCount: payload.skippedCount,
        status: payload.status,
        updatedCount: payload.updatedCount
      });
    } catch (error: unknown) {
      this.invalidationState.set("error");
      this.invalidationMessage.set(this.loc.t("health.browserBackfillFailure"));
      this.toast.push(this.loc.t("health.browserBackfillFailure"), "error");

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
      return this.loc.t("health.backfillIncompatible", { count: payload.skippedCount ?? 0 });
    }

    return this.loc.t("health.backfillSuccess", { count: payload.updatedCount ?? 0 });
  }
}
