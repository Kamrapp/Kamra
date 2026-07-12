import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";

import { HouseholdStockService, type HouseholdListItem } from "./household-stock.service";
import { HouseholdV2Service } from "./household-v2.service";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

@Component({
  selector: "app-household-management",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-shell management-shell">
      <div class="ui-panel-card management-card">
        <p class="ui-kicker">{{ loc.t("household.managementKicker") }}</p>
        <h1 class="page-title">{{ loc.t("household.managementTitle") }}</h1>

        @if (household(); as currentHousehold) {
          <p class="ui-copy-muted management-summary">
            {{ loc.t("household.managementSummary", { name: currentHousehold.name }) }}
          </p>
        } @else {
          <p class="ui-copy-muted management-summary">{{ loc.t("household.managementMissing") }}</p>
        }

        <div class="management-actions">
          <a class="ui-button ui-button-quiet ui-button-sm" routerLink="/">
            {{ loc.t("household.backToPulse") }}
          </a>
        </div>
      </div>

      <div class="ui-card-grid management-grid">
        <article class="ui-panel-card management-panel">
          <p class="ui-kicker">{{ loc.t("household.managementIdentityKicker") }}</p>
          <h2 class="ui-card-title">{{ loc.t("household.managementIdentityTitle") }}</h2>
          <p class="ui-copy-muted">{{ loc.t("household.managementIdentityDescription") }}</p>
          @if (household()) {
            <label>
              <span>{{ loc.t("household.householdName") }}</span>
              <input class="ui-form-control" [(ngModel)]="nameDraft" />
            </label>
            <button class="ui-button ui-button-sm" type="button" (click)="saveSettings()">
              {{ loc.t("household.saveHousehold") }}
            </button>
          }
        </article>

        <article class="ui-panel-card management-panel">
          <p class="ui-kicker">{{ loc.t("household.managementInviteKicker") }}</p>
          <h2 class="ui-card-title">{{ loc.t("household.managementInviteTitle") }}</h2>
          <p class="ui-copy-muted">{{ loc.t("household.managementInviteDescription") }}</p>
          <p class="ui-copy-muted">{{ loc.t("household.managementInvitePlaceholder") }}</p>
        </article>

        <article class="ui-panel-card management-panel">
          <p class="ui-kicker">{{ loc.t("household.managementLimitsKicker") }}</p>
          <h2 class="ui-card-title">{{ loc.t("household.managementLimitsTitle") }}</h2>
          <p class="ui-copy-muted">{{ loc.t("household.managementLimitsDescription") }}</p>
          @if (household()) {
            <label>
              <span>{{ loc.t("household.defaultCalculatedMaxLimitMultiplier") }}</span>
              <input
                class="ui-form-control"
                type="number"
                min="0"
                step="0.1"
                [(ngModel)]="maxLimitMultiplierDraft"
              />
            </label>
            <label class="checkbox-row">
              <input type="checkbox" [(ngModel)]="allowExpiredItemsDraft" />
              {{ loc.t("household.allowExpiredItems") }}
            </label>
            <button class="ui-button ui-button-sm" type="button" (click)="saveSettings()">
              {{ loc.t("household.saveSettings") }}
            </button>
          }
          @if (errorMessage()) {
            <p class="ui-copy-error">{{ errorMessage() }}</p>
          }
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .management-shell,
      .management-grid {
        display: grid;
        gap: var(--space-4);
      }

      .management-card,
      .management-panel {
        gap: var(--space-3);
      }

      .management-panel p {
        margin: 0;
      }

      .management-panel label {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.78rem;
        font-weight: 700;
        gap: var(--space-2);
      }

      .checkbox-row {
        align-items: center;
        display: flex !important;
        font-size: 0.9rem !important;
      }

      .management-actions {
        display: flex;
        gap: var(--space-3);
      }

      @media (min-width: 900px) {
        .management-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
    `
  ]
})
export class HouseholdManagementComponent {
  readonly loc = inject(LocalizationService);
  private readonly householdService = inject(HouseholdStockService);
  private readonly householdV2Service = inject(HouseholdV2Service);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly household = signal<HouseholdListItem | null>(null);
  readonly errorMessage = signal("");
  allowExpiredItemsDraft = true;
  maxLimitMultiplierDraft = 2;
  nameDraft = "";

  constructor() {
    void this.loadHousehold();
  }

  private async loadHousehold(): Promise<void> {
    const householdId = this.route.snapshot.paramMap.get("householdId");
    if (!householdId) {
      this.household.set(null);
      return;
    }

    const result = await this.householdService.listHouseholds();
    if (result.status !== "ok") {
      this.household.set(null);
      return;
    }

    this.household.set(result.households.find((entry) => entry.id === householdId) ?? null);
    const household = this.household();
    this.allowExpiredItemsDraft = household?.allowExpiredItems ?? true;
    this.maxLimitMultiplierDraft = household?.defaultCalculatedMaxLimitMultiplier ?? 2;
    this.nameDraft = household?.name ?? "";
  }

  async saveSettings(): Promise<void> {
    const household = this.household();
    if (
      !household ||
      !this.nameDraft.trim() ||
      !Number.isFinite(this.maxLimitMultiplierDraft) ||
      this.maxLimitMultiplierDraft < 0
    )
      return;
    this.errorMessage.set("");
    const result = await this.householdV2Service.updateHouseholdSettings({
      allowExpiredItems: this.allowExpiredItemsDraft,
      defaultCalculatedMaxLimitMultiplier: this.maxLimitMultiplierDraft,
      householdId: household.id,
      name: this.nameDraft.trim()
    });
    if (result.status === "error") {
      const message = result.message ?? this.loc.t("household.settingsSaveFailure");
      this.errorMessage.set(message);
      this.toast.push(message, "error");
      return;
    }
    await this.loadHousehold();
    this.toast.push(this.loc.t("household.settingsSaved"), "success");
  }
}
