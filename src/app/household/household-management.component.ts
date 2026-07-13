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
            <label>
              <span>{{ loc.t("household.groupTargetShoppingMode") }}</span>
              <select class="ui-form-control" [(ngModel)]="groupTargetShoppingModeDraft">
                <option value="add_products_and_group_item">
                  {{ loc.t("household.groupTargetShoppingModeProductsAndGroupItem") }}
                </option>
                <option value="add_products_only">
                  {{ loc.t("household.groupTargetShoppingModeProductsOnly") }}
                </option>
                <option value="ignore_group_targets">
                  {{ loc.t("household.groupTargetShoppingModeIgnore") }}
                </option>
              </select>
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
        align-items: center;
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.78rem;
        font-weight: 700;
        gap: var(--space-2);
        grid-template-columns: minmax(9rem, 0.72fr) minmax(0, 1.28fr);
      }

      .checkbox-row {
        align-items: center;
        display: flex !important;
        font-size: 0.9rem !important;
        grid-template-columns: auto minmax(0, 1fr) !important;
      }

      .management-actions {
        display: flex;
        gap: var(--space-3);
      }

      .management-actions .ui-button {
        font-size: 0.76rem;
        min-height: 1.8rem;
        padding: 0.28rem 0.55rem;
      }

      .management-panel > .ui-button {
        justify-self: start;
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
  groupTargetShoppingModeDraft:
    "add_products_and_group_item" | "add_products_only" | "ignore_group_targets" =
    "add_products_and_group_item";
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
    this.groupTargetShoppingModeDraft =
      household?.groupTargetShoppingMode ?? "add_products_and_group_item";
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
      groupTargetShoppingMode: this.groupTargetShoppingModeDraft,
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
