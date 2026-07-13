import {
  Component,
  computed,
  inject,
  signal,
  type OnInit,
  type WritableSignal
} from "@angular/core";

import { BrowserLoggerService } from "../browser-logger.service";
import { AuthService } from "../auth.service";
import { DatabaseMaintenanceComponent } from "./database-maintenance.component";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminHealthCardComponent, type HealthCheckItem } from "./admin-health-card.component";
import {
  AdminAlphaAccessCardComponent,
  AdminFeatureFlagsCardComponent,
  type AdminFeatureFlagChange,
  type AdminFeatureFlagViewModel
} from "./feature-flags/index";
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

interface AlphaUserCreationResponse {
  household?: {
    name: string;
  };
  user?: {
    email: string;
  };
}

type AsyncActionState = "idle" | "loading" | "error" | "success";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [
    AdminAlphaAccessCardComponent,
    AdminFeatureFlagsCardComponent,
    AdminHealthCardComponent,
    DatabaseMaintenanceComponent
  ],
  templateUrl: "./admin-dashboard.component.html",
  styleUrl: "./admin-dashboard.component.css"
})
export class AdminDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly adminDashboard = inject(AdminDashboardService);
  readonly logger = inject(BrowserLoggerService);
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
  readonly featureFlags = signal<AdminFeatureFlagViewModel[]>([]);
  readonly featureFlagsMessage = signal("");
  readonly featureFlagsState = signal<AsyncActionState>("idle");
  readonly allowControlledAlphaAccessEnabled = signal(false);
  readonly alphaUserEmail = signal("");
  readonly alphaUserPassword = signal("");
  readonly alphaUserMessage = signal("");
  readonly alphaUserState = signal<AsyncActionState>("idle");
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
  readonly ordinaryFeatureFlags = computed(() =>
    this.featureFlags().filter((flag) => flag.control === "boolean")
  );
  readonly controlledAlphaAccessFlag = computed(
    () => this.featureFlags().find((flag) => flag.control === "alpha-access") ?? null
  );
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
  readonly isMaintenanceBusy = computed(
    () =>
      this.healthState() === "loading" ||
      this.demoSeedState() === "loading" ||
      this.featureFlagsState() === "loading" ||
      this.alphaUserState() === "loading" ||
      this.invalidationState() === "loading" ||
      this.validatorUpgradeState() === "loading"
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
    if (
      !this.requireAdminAccess(
        this.demoSeedState,
        this.demoSeedMessage,
        "health.signInBeforeDemoSeed"
      )
    ) {
      return;
    }

    this.demoSeedState.set("loading");
    this.demoSeedMessage.set("");

    this.logger.log("info", "Demo household reseed requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.adminDashboard.request(
        "/api/admin/dashboard/reseed-demo-household",
        {
          headers: {
            accept: "application/json",
            ...this.auth.getAuthorizationHeaders()
          },
          method: "POST"
        }
      );

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.demoSeedState, this.demoSeedMessage);
        return;
      }

      const { message, payload } = await this.adminDashboard.readPayload<
        DemoHouseholdReseedResponse & { message?: string }
      >(response, this.loc.t("health.demoSeedFailure"));
      if (!payload) {
        this.demoSeedState.set("error");
        this.demoSeedMessage.set(message);
        this.toast.push(message, "error");
        return;
      }

      this.demoSeedState.set(response.ok ? "success" : "error");
      this.demoSeedMessage.set(
        response.ok
          ? this.loc.t("health.demoSeedSuccess", {
              products: payload.counts.localProducts,
              stocks: payload.counts.stockItems,
              users: payload.counts.users
            })
          : (payload.message ?? message)
      );

      if (!response.ok) {
        this.toast.push(payload.message ?? message, "error");
      }

      this.logger.log("info", "Demo household reseed response received", {
        httpStatus: response.status,
        localProducts: payload.counts?.localProducts,
        stockItems: payload.counts?.stockItems,
        users: payload.counts?.users
      });
    } catch (error: unknown) {
      this.demoSeedState.set("error");
      this.demoSeedMessage.set(this.loc.t("health.browserDemoSeedFailure"));
      this.toast.push(this.loc.t("health.browserDemoSeedFailure"), "error");

      this.logger.log("error", "Demo household reseed request failed", { error });
    }
  }

  async runHealthCheck(): Promise<void> {
    if (!this.requireAdminAccess(this.healthState, this.healthMessage, "health.signInBeforeRun")) {
      this.healthReport.set(null);
      return;
    }

    this.healthState.set("loading");
    this.healthMessage.set("");

    this.logger.log("info", "Health check requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.adminDashboard.request("/api/admin/dashboard/health", {
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

      const { message, payload: report } = await this.adminDashboard.readPayload<HealthReport>(
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
      this.healthMessage.set(
        response.ok ? this.loc.t("health.success") : this.loc.t("health.degraded")
      );
      if (!response.ok) {
        this.toast.push(message, "error");
      }

      this.logger.log("info", "Health check response received", {
        httpStatus: response.status,
        databaseStatus: report.checks.database.status,
        status: report.status
      });
    } catch (error: unknown) {
      this.healthReport.set(null);
      this.healthState.set("error");
      this.healthMessage.set(this.loc.t("health.browserHealthFailure"));
      this.toast.push(this.loc.t("health.browserHealthFailure"), "error");

      this.logger.log("error", "Health check request failed", { error });
    }
  }

  async upgradeCatalogValidators(): Promise<void> {
    if (
      !this.requireAdminAccess(
        this.validatorUpgradeState,
        this.validatorUpgradeMessage,
        "health.signInBeforeValidator"
      )
    ) {
      return;
    }

    this.validatorUpgradeState.set("loading");
    this.validatorUpgradeMessage.set("");

    this.logger.log("info", "Catalog validator upgrade requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.adminDashboard.request(
        "/api/admin/dashboard/upgrade-catalog-validators",
        {
          headers: {
            accept: "application/json",
            ...this.auth.getAuthorizationHeaders()
          },
          method: "POST"
        }
      );

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.validatorUpgradeState, this.validatorUpgradeMessage);
        return;
      }

      const { message, payload } = await this.adminDashboard.readPayload<{
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
      this.validatorUpgradeMessage.set(
        response.ok
          ? this.loc.t("health.upgradeSuccess", {
              created: payload.createdCollections?.length ?? 0,
              upgraded: payload.upgradedCollections?.length ?? 0
            })
          : this.loc.t("health.upgradeFailure")
      );
      if (!response.ok) {
        this.toast.push(payload.message ?? message, "error");
      }

      this.logger.log("info", "Catalog validator upgrade response received", {
        createdCollectionCount: payload.createdCollections?.length,
        httpStatus: response.status,
        upgradedCollectionCount: payload.upgradedCollections?.length
      });
    } catch (error: unknown) {
      this.validatorUpgradeState.set("error");
      this.validatorUpgradeMessage.set(this.loc.t("health.browserValidatorFailure"));
      this.toast.push(this.loc.t("health.browserValidatorFailure"), "error");

      this.logger.log("error", "Catalog validator upgrade request failed", { error });
    }
  }

  async backfillLegacyProductsAsUnvalidated(): Promise<void> {
    if (
      !this.requireAdminAccess(
        this.invalidationState,
        this.invalidationMessage,
        "health.signInBeforeMaintenance"
      )
    ) {
      return;
    }

    this.invalidationState.set("loading");
    this.invalidationMessage.set("");

    this.logger.log("info", "Legacy validation backfill requested from admin dashboard", {
      pathname: window.location.pathname
    });

    try {
      const response = await this.adminDashboard.request(
        "/api/admin/dashboard/backfill-unvalidated-products",
        {
          headers: {
            accept: "application/json",
            ...this.auth.getAuthorizationHeaders()
          },
          method: "POST"
        }
      );

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.invalidationState, this.invalidationMessage);
        return;
      }

      const { message, payload } = await this.adminDashboard.readPayload<{
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
      this.invalidationMessage.set(
        response.ok
          ? this.formatLegacyBackfillMessage(payload)
          : this.loc.t("health.backfillFailure")
      );
      if (!response.ok) {
        this.toast.push(payload.message ?? message, "error");
      }

      this.logger.log("info", "Legacy validation backfill response received", {
        httpStatus: response.status,
        skippedCount: payload.skippedCount,
        status: payload.status,
        updatedCount: payload.updatedCount
      });
    } catch (error: unknown) {
      this.invalidationState.set("error");
      this.invalidationMessage.set(this.loc.t("health.browserBackfillFailure"));
      this.toast.push(this.loc.t("health.browserBackfillFailure"), "error");

      this.logger.log("error", "Legacy validation backfill request failed", { error });
    }
  }

  async loadFeatureFlags(): Promise<void> {
    if (
      !this.requireAdminAccess(
        this.featureFlagsState,
        this.featureFlagsMessage,
        "health.signInBeforeFeatureFlags"
      )
    ) {
      return;
    }

    this.featureFlagsState.set("loading");
    this.featureFlagsMessage.set("");

    try {
      const response = await this.adminDashboard.request("/api/admin/dashboard/feature-flags", {
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

      const { message, payload } = await this.adminDashboard.readPayload<{
        featureFlags?: AdminFeatureFlagViewModel[];
      }>(response, this.loc.t("health.featureFlagsLoadFailure"));
      const featureFlags = payload?.featureFlags ?? [];

      this.featureFlags.set(featureFlags);
      this.allowControlledAlphaAccessEnabled.set(
        featureFlags.find((flag) => flag.control === "alpha-access")?.enabled ?? false
      );
      this.featureFlagsState.set(response.ok ? "success" : "error");
      this.featureFlagsMessage.set(response.ok ? "" : message);
    } catch (error: unknown) {
      this.featureFlagsState.set("error");
      this.featureFlagsMessage.set(this.loc.t("health.browserFeatureFlagsFailure"));
      this.toast.push(this.loc.t("health.browserFeatureFlagsFailure"), "error");

      this.logger.log("error", "Feature flag load request failed", { error });
    }
  }

  setAllowControlledAlphaAccessEnabled(enabled: boolean): void {
    this.allowControlledAlphaAccessEnabled.set(enabled);
    const flag = this.controlledAlphaAccessFlag();
    if (flag) {
      this.updateFeatureFlag({ enabled, key: flag.key });
    }
  }

  setFeatureFlagEnabled(change: AdminFeatureFlagChange): void {
    this.updateFeatureFlag(change);
    if (this.controlledAlphaAccessFlag()?.key === change.key) {
      this.allowControlledAlphaAccessEnabled.set(change.enabled);
    }
  }

  async saveAlphaAccessFlag(): Promise<void> {
    if (
      !this.requireAdminAccess(
        this.featureFlagsState,
        this.featureFlagsMessage,
        "health.signInBeforeFeatureFlags"
      )
    ) {
      return;
    }

    const flag = this.controlledAlphaAccessFlag();
    if (flag) {
      await this.saveFeatureFlag(flag.key, this.allowControlledAlphaAccessEnabled());
    }
  }

  async createAlphaUser(): Promise<void> {
    if (
      !this.requireAdminAccess(
        this.alphaUserState,
        this.alphaUserMessage,
        "health.signInBeforeFeatureFlags"
      )
    ) {
      return;
    }

    this.alphaUserState.set("loading");
    this.alphaUserMessage.set("");

    try {
      const response = await this.adminDashboard.request("/api/admin/alpha-users", {
        body: JSON.stringify({
          email: this.alphaUserEmail(),
          password: this.alphaUserPassword()
        }),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });
      const { message, payload } = await this.adminDashboard.readPayload<AlphaUserCreationResponse>(
        response,
        this.loc.t("health.alphaUserCreateFailure")
      );

      if (!response.ok || !payload?.user?.email) {
        this.alphaUserState.set("error");
        this.alphaUserMessage.set(message);
        this.toast.push(message, "error");
        return;
      }

      this.alphaUserPassword.set("");
      this.alphaUserState.set("success");
      this.alphaUserMessage.set(
        this.loc.t("health.alphaUserCreateSuccess", {
          email: payload.user.email,
          household: payload.household?.name ?? ""
        })
      );
    } catch {
      this.alphaUserState.set("error");
      this.alphaUserMessage.set(this.loc.t("health.alphaUserCreateFailure"));
      this.toast.push(this.loc.t("health.alphaUserCreateFailure"), "error");
    }
  }

  async saveFeatureFlags(): Promise<void> {
    if (
      !this.requireAdminAccess(
        this.featureFlagsState,
        this.featureFlagsMessage,
        "health.signInBeforeFeatureFlags"
      )
    ) {
      return;
    }

    this.featureFlagsState.set("loading");
    this.featureFlagsMessage.set("");

    for (const flag of this.ordinaryFeatureFlags()) {
      const saved = await this.saveFeatureFlag(flag.key, flag.enabled);
      if (!saved) {
        return;
      }
    }
  }

  private async saveFeatureFlag(key: string, enabled: boolean): Promise<boolean> {
    this.featureFlagsState.set("loading");
    this.featureFlagsMessage.set("");

    try {
      const response = await this.adminDashboard.request("/api/admin/dashboard/feature-flags", {
        body: JSON.stringify({ enabled, key }),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "PATCH"
      });

      if (response.status === 401) {
        this.handleUnauthorizedResponse(this.featureFlagsState, this.featureFlagsMessage);
        return false;
      }

      const { message, payload } = await this.adminDashboard.readPayload<{
        featureFlags?: AdminFeatureFlagViewModel[];
      }>(response, this.loc.t("health.featureFlagsSaveFailure"));
      const updatedFlag = payload?.featureFlags?.[0];
      if (updatedFlag) {
        this.updateFeatureFlag(updatedFlag);
        if (updatedFlag.control === "alpha-access") {
          this.allowControlledAlphaAccessEnabled.set(updatedFlag.enabled);
        }
      }
      this.featureFlagsState.set(response.ok ? "success" : "error");
      this.featureFlagsMessage.set(
        response.ok ? this.loc.t("health.featureFlagsSaveSuccess") : message
      );

      if (!response.ok) {
        this.toast.push(message, "error");
      }
      return response.ok;
    } catch (error: unknown) {
      this.featureFlagsState.set("error");
      this.featureFlagsMessage.set(this.loc.t("health.browserFeatureFlagsFailure"));
      this.toast.push(this.loc.t("health.browserFeatureFlagsFailure"), "error");

      this.logger.log("error", "Feature flag save request failed", { error });
      return false;
    }
  }

  private updateFeatureFlag(change: AdminFeatureFlagChange | AdminFeatureFlagViewModel): void {
    this.featureFlags.update((flags) =>
      flags.map((flag) => (flag.key === change.key ? { ...flag, ...change } : flag))
    );
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
      candidate.checks &&
      candidate.checks.api &&
      candidate.checks.database &&
      typeof candidate.status === "string"
    );
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
