import { Component, computed, inject, signal, type OnInit, type WritableSignal } from "@angular/core";

import { buildApiUrl } from "../api-url";
import { logBrowserEvent } from "../browser-logger";
import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

interface HealthReport {
  checklist?: HealthCheckItem[];
  checks: {
    api: HealthCheckItem;
    database: HealthCheckItem;
  };
  stage: string;
  status: string;
}

interface DemoHouseholdReseedResponse {
  counts: {
    households: number;
    localProducts: number;
    memberships: number;
    stockItems: number;
    users: number;
  };
  databaseName: string;
  ensuredCollections: string[];
  message: string;
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

interface FeatureFlagListItem {
  enabled: boolean;
  key: string;
}

type AsyncActionState = "idle" | "loading" | "error" | "success";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  template: `
    <section class="admin-dashboard-page" aria-labelledby="admin-dashboard-title">
      <div class="admin-dashboard-copy">
        <p class="eyebrow">{{ loc.t("health.runtime") }}</p>
        <h1 id="admin-dashboard-title">{{ loc.t("common.adminDashboard") }}</h1>
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
      } @else if (!auth.user()) {
        <section class="status-panel unauthorized-panel" aria-live="polite">
          <div class="status-heading">
            <p class="status-kicker">{{ loc.t("common.adminOnly") }}</p>
            <p class="status-summary">{{ loc.t("common.loading") }}</p>
          </div>
          <p class="status-message">
            {{ loc.t("health.checkingAccess") }}
          </p>
        </section>
      } @else if (!isAdminUser()) {
        <section class="status-panel unauthorized-panel" aria-live="polite">
          <div class="status-heading">
            <p class="status-kicker">{{ loc.t("common.adminOnly") }}</p>
            <p class="status-summary">{{ loc.t("common.adminDashboard") }}</p>
          </div>
          <p class="status-message">
            {{ loc.t("health.adminOnlyDescription") }}
          </p>
        </section>
      } @else {
        <section class="admin-grid" aria-label="Admin utilities">
          <article class="status-panel utility-card" aria-live="polite">
            <div class="status-heading">
              <p class="status-kicker">{{ loc.t("health.demoSeedKicker") }}</p>
              <p class="status-summary">{{ loc.t("health.demoSeedTitle") }}</p>
            </div>
            <p class="status-message">{{ loc.t("health.demoSeedDescription") }}</p>
            <button
              class="run-button ui-button"
              type="button"
              (click)="reseedDemoHousehold()"
              [disabled]="isMaintenanceBusy()"
            >
              {{ demoSeedState() === "loading" ? loc.t("health.updating") : loc.t("health.demoSeedRun") }}
            </button>
            @if (demoSeedMessage(); as message) {
              <p class="maintenance-message">{{ message }}</p>
            }
          </article>

          <article class="status-panel utility-card" aria-live="polite">
            <div class="status-heading">
              <p class="status-kicker">{{ loc.t("health.databaseKicker") }}</p>
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
            </div>

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
          </article>

          <article class="status-panel utility-card placeholder-card">
            <div class="status-heading">
              <p class="status-kicker">{{ loc.t("health.featureFlagsKicker") }}</p>
              <p class="status-summary">{{ loc.t("health.featureFlagsTitle") }}</p>
            </div>
            <p class="status-message">{{ loc.t("health.featureFlagsDescription") }}</p>
            <div class="placeholder-list">
              <label class="placeholder-row" for="shopping-list-auto-tick-flag">
                <span>{{ loc.t("health.featureFlagAutoTickAllShoppingListEntries") }}</span>
                <input
                  id="shopping-list-auto-tick-flag"
                  type="checkbox"
                  [checked]="allowAutoTickingAllShoppingListEntriesEnabled()"
                  [disabled]="featureFlagsState() === 'loading' || !isAdminUser()"
                  (change)="setAllowAutoTickingAllShoppingListEntriesEnabled($any($event.target).checked)"
                >
              </label>
            </div>
            <div class="button-row">
              <button
                class="run-button ui-button"
                type="button"
                (click)="saveShoppingListFeatureFlags()"
                [disabled]="isMaintenanceBusy() || featureFlagsState() === 'loading'"
              >
                {{ featureFlagsState() === "loading" ? loc.t("health.updating") : loc.t("common.save") }}
              </button>
            </div>
            @if (featureFlagsMessage(); as message) {
              <p class="maintenance-message">{{ message }}</p>
            }
          </article>

          <article class="status-panel utility-card">
            <div class="status-heading">
              <p class="status-kicker">{{ loc.t("health.modifierKicker") }}</p>
              <p class="status-summary">{{ loc.t("health.modifierTitle") }}</p>
            </div>
            <p class="status-message">{{ loc.t("health.modifierDescription") }}</p>
            <div class="button-row">
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
          </article>
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

      .admin-dashboard-page {
        display: grid;
        gap: var(--space-6);
        grid-template-columns: minmax(0, 1fr);
      }

      .admin-dashboard-copy {
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

      .admin-dashboard-copy p:last-child {
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

      .admin-grid {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(0, 1fr);
      }

      .utility-card {
        align-content: start;
        min-height: 16rem;
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

      .placeholder-card {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--surface-panel-background) 92%, white 8%), var(--surface-panel-background)),
          radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent-sky) 16%, transparent), transparent 55%);
      }

      .placeholder-list {
        display: grid;
        gap: var(--space-2);
      }

      .placeholder-row {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        display: flex;
        justify-content: space-between;
        padding: 0.85rem 0.95rem;
      }

      .placeholder-row strong {
        color: var(--color-text-muted);
        font-size: 0.76rem;
        text-transform: uppercase;
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
        .admin-dashboard-page {
          grid-template-columns: minmax(0, 1fr);
        }

        .admin-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `
  ]
})
export class AdminDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly isAdminUser = computed(() => this.auth.user()?.role === "admin");
  readonly loc = inject(LocalizationService);
  readonly toast = inject(ToastService);
  readonly healthMessage = signal("");
  readonly healthReport = signal<HealthReport | null>(null);
  readonly healthState = signal<AsyncActionState>("idle");
  readonly demoSeedMessage = signal("");
  readonly demoSeedState = signal<AsyncActionState>("idle");
  readonly invalidationMessage = signal("");
  readonly invalidationState = signal<AsyncActionState>("idle");
  readonly featureFlags = signal<FeatureFlagListItem[]>([]);
  readonly featureFlagsMessage = signal("");
  readonly featureFlagsState = signal<AsyncActionState>("idle");
  readonly allowAutoTickingAllShoppingListEntriesEnabled = signal(true);
  readonly validatorUpgradeMessage = signal("");
  readonly validatorUpgradeState = signal<AsyncActionState>("idle");
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
      || this.demoSeedState() === "loading"
      || this.featureFlagsState() === "loading"
      || this.invalidationState() === "loading"
      || this.validatorUpgradeState() === "loading"
  );

  ngOnInit(): void {
    void this.initializeDashboard();
    this.healthMessage.set(this.loc.t("health.runFirst"));
  }

  async initializeDashboard(): Promise<void> {
    await this.auth.loadCurrentUser();

    if (this.isAdminUser()) {
      await this.loadFeatureFlags();
    }
  }

  async reseedDemoHousehold(): Promise<void> {
    if (!this.requireAdminAccess(this.demoSeedState, this.demoSeedMessage, "health.signInBeforeDemoSeed")) {
      return;
    }

    this.demoSeedState.set("loading");
    this.demoSeedMessage.set("");

    logBrowserEvent("info", "Demo household reseed requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.fetchAdminDashboardRoute("/api/admin/dashboard/reseed-demo-household", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.demoSeedState, this.demoSeedMessage);
        return;
      }

      const { message, payload } = await this.readRoutePayload<DemoHouseholdReseedResponse & { message?: string }>(
        response,
        this.loc.t("health.demoSeedFailure")
      );
      if (!payload) {
        this.demoSeedState.set("error");
        this.demoSeedMessage.set(message);
        this.toast.push(message, "error");
        return;
      }

      this.demoSeedState.set(response.ok ? "success" : "error");
      this.demoSeedMessage.set(response.ok
        ? this.loc.t("health.demoSeedSuccess", {
          products: payload.counts.localProducts,
          stocks: payload.counts.stockItems,
          users: payload.counts.users
        })
        : payload.message ?? message);

      if (!response.ok) {
        this.toast.push(payload.message ?? message, "error");
      }

      logBrowserEvent("info", "Demo household reseed response received", {
        httpStatus: response.status,
        localProducts: payload.counts?.localProducts,
        stockItems: payload.counts?.stockItems,
        users: payload.counts?.users
      });
    } catch (error: unknown) {
      this.demoSeedState.set("error");
      this.demoSeedMessage.set(this.loc.t("health.browserDemoSeedFailure"));
      this.toast.push(this.loc.t("health.browserDemoSeedFailure"), "error");

      logBrowserEvent("error", "Demo household reseed request failed", error);
    }
  }

  async runHealthCheck(): Promise<void> {
    if (!this.requireAdminAccess(this.healthState, this.healthMessage, "health.signInBeforeRun")) {
      this.healthReport.set(null);
      return;
    }

    this.healthState.set("loading");
    this.healthMessage.set("");

    logBrowserEvent("info", "Health check requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.fetchAdminDashboardRoute("/api/admin/dashboard/health", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "GET"
      });

      if (response.status === 401) {
        this.healthReport.set(null);
        this.handleUnauthorizedResponse(this.healthState, this.healthMessage);
        return;
      }

      const { message, payload: report } = await this.readRoutePayload<HealthReport>(
        response,
        this.loc.t("health.routeError")
      );
      if (!this.isHealthReport(report)) {
        this.healthReport.set(null);
        this.healthState.set("error");
        this.healthMessage.set(message);
        this.toast.push(message, "error");
        return;
      }

      this.healthReport.set(report);
      this.healthState.set(response.ok ? "success" : "error");
      this.healthMessage.set(response.ok
        ? this.loc.t("health.success")
        : this.loc.t("health.degraded"));
      if (!response.ok) {
        this.toast.push(message, "error");
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
    if (!this.requireAdminAccess(
      this.validatorUpgradeState,
      this.validatorUpgradeMessage,
      "health.signInBeforeValidator"
    )) {
      return;
    }

    this.validatorUpgradeState.set("loading");
    this.validatorUpgradeMessage.set("");

    logBrowserEvent("info", "Catalog validator upgrade requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.fetchAdminDashboardRoute("/api/admin/dashboard/upgrade-catalog-validators", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.validatorUpgradeState, this.validatorUpgradeMessage);
        return;
      }

      const { message, payload } = await this.readRoutePayload<{
        createdCollections?: string[];
        message?: string;
        upgradedCollections?: string[];
      }>(response, this.loc.t("health.upgradeFailure"));
      if (!payload) {
        this.validatorUpgradeState.set("error");
        this.validatorUpgradeMessage.set(message);
        this.toast.push(message, "error");
        return;
      }

      this.validatorUpgradeState.set(response.ok ? "success" : "error");
      this.validatorUpgradeMessage.set(response.ok
        ? this.loc.t("health.upgradeSuccess", {
          created: payload.createdCollections?.length ?? 0,
          upgraded: payload.upgradedCollections?.length ?? 0
        })
        : this.loc.t("health.upgradeFailure"));
      if (!response.ok) {
        this.toast.push(payload.message ?? message, "error");
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
    if (!this.requireAdminAccess(this.invalidationState, this.invalidationMessage, "health.signInBeforeMaintenance")) {
      return;
    }

    this.invalidationState.set("loading");
    this.invalidationMessage.set("");

    logBrowserEvent("info", "Legacy validation backfill requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.fetchAdminDashboardRoute("/api/admin/dashboard/backfill-unvalidated-products", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.invalidationState, this.invalidationMessage);
        return;
      }

      const { message, payload } = await this.readRoutePayload<{
        message?: string;
        skippedCount?: number;
        status?: "updated" | "validator_incompatible";
        updatedCount?: number;
      }>(response, this.loc.t("health.backfillFailure"));
      if (!payload) {
        this.invalidationState.set("error");
        this.invalidationMessage.set(message);
        this.toast.push(message, "error");
        return;
      }

      this.invalidationState.set(response.ok ? "success" : "error");
      this.invalidationMessage.set(response.ok
        ? this.formatLegacyBackfillMessage(payload)
        : this.loc.t("health.backfillFailure"));
      if (!response.ok) {
        this.toast.push(payload.message ?? message, "error");
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

  async loadFeatureFlags(): Promise<void> {
    if (!this.requireAdminAccess(this.featureFlagsState, this.featureFlagsMessage, "health.signInBeforeFeatureFlags")) {
      return;
    }

    this.featureFlagsState.set("loading");
    this.featureFlagsMessage.set("");

    try {
      const response = await this.fetchAdminDashboardRoute("/api/admin/dashboard/feature-flags", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "GET"
      });

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.featureFlagsState, this.featureFlagsMessage);
        return;
      }

      const { message, payload } = await this.readRoutePayload<{ featureFlags?: FeatureFlagListItem[] }>(
        response,
        this.loc.t("health.featureFlagsLoadFailure")
      );
      const featureFlags = payload?.featureFlags ?? [];

      this.featureFlags.set(featureFlags);
      this.allowAutoTickingAllShoppingListEntriesEnabled.set(
        featureFlags.find((flag) => flag.key === "allowAutoTickingAllShoppingListEntries")?.enabled ?? true
      );
      this.featureFlagsState.set(response.ok ? "success" : "error");
      this.featureFlagsMessage.set(response.ok ? "" : message);
    } catch (error: unknown) {
      this.featureFlagsState.set("error");
      this.featureFlagsMessage.set(this.loc.t("health.browserFeatureFlagsFailure"));
      this.toast.push(this.loc.t("health.browserFeatureFlagsFailure"), "error");

      logBrowserEvent("error", "Feature flag load request failed", error);
    }
  }

  setAllowAutoTickingAllShoppingListEntriesEnabled(enabled: boolean): void {
    this.allowAutoTickingAllShoppingListEntriesEnabled.set(enabled);
  }

  async saveShoppingListFeatureFlags(): Promise<void> {
    if (!this.requireAdminAccess(this.featureFlagsState, this.featureFlagsMessage, "health.signInBeforeFeatureFlags")) {
      return;
    }

    this.featureFlagsState.set("loading");
    this.featureFlagsMessage.set("");

    try {
      const response = await this.fetchAdminDashboardRoute("/api/admin/dashboard/feature-flags", {
        body: JSON.stringify({
          enabled: this.allowAutoTickingAllShoppingListEntriesEnabled(),
          key: "allowAutoTickingAllShoppingListEntries"
        }),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "PATCH"
      });

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.featureFlagsState, this.featureFlagsMessage);
        return;
      }

      const { message, payload } = await this.readRoutePayload<{ featureFlags?: FeatureFlagListItem[] }>(
        response,
        this.loc.t("health.featureFlagsSaveFailure")
      );
      const featureFlags = payload?.featureFlags ?? [];
      this.featureFlags.set(featureFlags);
      this.featureFlagsState.set(response.ok ? "success" : "error");
      this.featureFlagsMessage.set(response.ok
        ? this.loc.t("health.featureFlagsSaveSuccess")
        : message);

      if (!response.ok) {
        this.toast.push(message, "error");
      }
    } catch (error: unknown) {
      this.featureFlagsState.set("error");
      this.featureFlagsMessage.set(this.loc.t("health.browserFeatureFlagsFailure"));
      this.toast.push(this.loc.t("health.browserFeatureFlagsFailure"), "error");

      logBrowserEvent("error", "Feature flag save request failed", error);
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

  private isHealthReport(value: unknown): value is HealthReport {
    if (!value || typeof value !== "object") {
      return false;
    }

    const candidate = value as {
      checks?: {
        api?: unknown;
        database?: unknown;
      };
      status?: unknown;
    };

    return Boolean(
      candidate.checks
      && candidate.checks.api
      && candidate.checks.database
      && typeof candidate.status === "string"
    );
  }

  private async fetchAdminDashboardRoute(input: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(buildApiUrl(input), init);
    } catch {
      throw new Error(this.loc.t("health.browserHealthFailure"));
    }
  }

  private async readRoutePayload<T>(
    response: Response,
    fallbackMessage: string
  ): Promise<{ message: string; payload: T | null }> {
    const message = await readApiErrorMessage(response.clone(), fallbackMessage, (messageKey) =>
      this.loc.t(messageKey as TranslationKey)
    );

    try {
      return {
        message,
        payload: (await response.json()) as T
      };
    } catch {
      return {
        message,
        payload: null
      };
    }
  }

  private handleUnauthorizedResponse(
    state: WritableSignal<AsyncActionState>,
    message: WritableSignal<string>
  ): void {
    const unauthorizedMessage = this.loc.t("health.adminActionDenied");
    state.set("error");
    message.set(unauthorizedMessage);
    this.toast.push(unauthorizedMessage, "error");
  }

  private requireAdminAccess(
    state: WritableSignal<AsyncActionState>,
    message: WritableSignal<string>,
    signInMessageKey: TranslationKey
  ): boolean {
    if (!this.auth.token()) {
      state.set("error");
      message.set(this.loc.t(signInMessageKey));
      return false;
    }

    if (!this.auth.user()) {
      state.set("error");
      message.set(this.loc.t("health.checkingAccess"));
      return false;
    }

    if (!this.isAdminUser()) {
      this.handleUnauthorizedResponse(state, message);
      return false;
    }

    return true;
  }
}
