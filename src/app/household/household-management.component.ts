import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";

import { HouseholdStockService, type HouseholdListItem } from "./household-stock.service";
import {
  HouseholdInvitationService,
  type HouseholdInvitation
} from "./household-invitation.service";
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
          @if (household(); as currentHousehold) {
            <form class="invite-form" (ngSubmit)="invite(currentHousehold.id)">
              <label>
                <span>{{ loc.t("household.inviteEmail") }}</span>
                <input
                  class="ui-form-control"
                  name="inviteEmail"
                  type="email"
                  [(ngModel)]="inviteEmailDraft"
                />
              </label>
              <button class="ui-button ui-button-sm" type="submit" [disabled]="inviting()">
                {{ inviting() ? loc.t("household.inviting") : loc.t("household.invite") }}
              </button>
            </form>
            @if (invitations().length > 0) {
              <div class="invitation-list">
                <strong>{{ loc.t("household.pendingInvitations") }}</strong>
                @for (invitation of invitations(); track invitation.id) {
                  <div class="invitation-row">
                    <span>{{ invitation.email }}</span>
                    <time [attr.datetime]="invitation.createdAt">
                      {{ invitation.createdAt | date: "shortDate" }}
                    </time>
                  </div>
                }
              </div>
            }
          }
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

      <article class="ui-panel-card management-panel management-reset-panel">
        <p class="ui-kicker">{{ loc.t("household.resetHouseholdKicker") }}</p>
        <h2 class="ui-card-title">{{ loc.t("household.resetHouseholdTitle") }}</h2>
        <p class="ui-copy-muted">{{ loc.t("household.resetHouseholdDescription") }}</p>
        @if (household()) {
          <div class="reset-form">
            <label>
              <span>{{ loc.t("household.resetScopeLabel") }}</span>
              <select class="ui-form-control" [(ngModel)]="resetScope">
                <option value="shopping_list">
                  {{ loc.t("household.resetScopeShoppingList") }}
                </option>
                <option value="batches">{{ loc.t("household.resetScopeBatches") }}</option>
                <option value="products_and_batches">
                  {{ loc.t("household.resetScopeProductsAndBatches") }}
                </option>
                <option value="groups_products_and_batches">
                  {{ loc.t("household.resetScopeGroupsProductsAndBatches") }}
                </option>
                <option value="all_household_data">
                  {{ loc.t("household.resetScopeAllData") }}
                </option>
                <option value="delete_household">
                  {{ loc.t("household.resetScopeDeleteHousehold") }}
                </option>
              </select>
            </label>
            <p class="reset-scope-description">{{ resetScopeDescription() }}</p>
            <label class="checkbox-row">
              <input type="checkbox" [(ngModel)]="resetConfirmed" />
              {{ loc.t("household.resetConfirmLabel") }}
            </label>
            <button
              class="ui-button ui-button-danger ui-button-sm"
              type="button"
              [disabled]="resetting() || !resetConfirmed"
              (click)="resetHousehold()"
            >
              {{ loc.t("household.resetButton") }}
            </button>
          </div>
        }
      </article>
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

      .invite-form {
        display: grid;
        gap: var(--space-2);
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
        align-items: center;
        display: inline-flex;
        font-size: 0.84rem;
        min-height: 2.15rem;
        padding: 0.35rem 0.7rem;
      }

      .management-panel > .ui-button {
        justify-self: start;
      }

      .management-panel .ui-button {
        align-items: center;
        display: inline-flex;
        font-size: 0.84rem;
        min-height: 2.15rem;
        padding: 0.35rem 0.7rem;
      }

      .management-reset-panel {
        border-color: color-mix(in srgb, var(--color-status-danger) 42%, var(--line-panel));
      }

      .reset-form {
        display: grid;
        gap: var(--space-3);
        max-width: 52rem;
      }

      .reset-form label:not(.checkbox-row) {
        align-items: center;
        display: grid;
        gap: var(--space-2);
        grid-template-columns: minmax(11rem, 0.6fr) minmax(0, 1.4fr);
      }

      .reset-scope-description {
        border-left: 3px solid var(--color-status-danger);
        color: var(--color-text-muted);
        margin: 0;
        padding-left: var(--space-3);
      }

      .reset-form .ui-button-danger {
        justify-self: start;
      }

      .invitation-list {
        border-top: 1px solid var(--line-subtle);
        display: grid;
        gap: 0.25rem;
        padding-top: var(--space-2);
      }

      .invitation-list > strong {
        color: var(--color-text-muted);
        font-size: 0.7rem;
        text-transform: uppercase;
      }

      .invitation-row {
        align-items: center;
        color: var(--color-text);
        display: grid;
        font-size: 0.78rem;
        gap: var(--space-2);
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .invitation-row time {
        color: var(--color-text-muted);
        font-size: 0.7rem;
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
  private readonly invitationService = inject(HouseholdInvitationService);
  private readonly householdV2Service = inject(HouseholdV2Service);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly household = signal<HouseholdListItem | null>(null);
  readonly errorMessage = signal("");
  readonly invitations = signal<HouseholdInvitation[]>([]);
  readonly inviting = signal(false);
  readonly resetting = signal(false);
  allowExpiredItemsDraft = true;
  maxLimitMultiplierDraft = 2;
  groupTargetShoppingModeDraft:
    "add_products_and_group_item" | "add_products_only" | "ignore_group_targets" =
    "add_products_and_group_item";
  nameDraft = "";
  inviteEmailDraft = "";
  resetConfirmed = false;
  resetScope:
    | "shopping_list"
    | "batches"
    | "products_and_batches"
    | "groups_products_and_batches"
    | "all_household_data"
    | "delete_household" = "shopping_list";

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
    this.invitations.set(
      household ? await this.invitationService.listForHousehold(household.id) : []
    );
  }

  async invite(householdId: string): Promise<void> {
    const email = this.inviteEmailDraft.trim();
    if (!email) return;

    this.inviting.set(true);
    const result = await this.invitationService.invite(householdId, email);
    this.inviting.set(false);
    if (result.status === "error") {
      this.toast.push(result.message ?? this.loc.t("household.invitationFailure"), "error");
      return;
    }

    this.inviteEmailDraft = "";
    this.invitations.set(await this.invitationService.listForHousehold(householdId));
    this.toast.push(this.loc.t("household.invitationSent"), "success");
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

  resetScopeDescription(): string {
    return this.loc.t(`household.resetScope${this.resetScopeSuffix()}Description`);
  }

  async resetHousehold(): Promise<void> {
    const household = this.household();
    if (!household || !this.resetConfirmed || this.resetting()) return;
    const scopeLabel = this.loc.t(`household.resetScope${this.resetScopeSuffix()}`);
    if (!window.confirm(this.loc.t("household.resetConfirmDialog", { scope: scopeLabel }))) return;

    this.resetting.set(true);
    const result = await this.householdV2Service.resetHouseholdContent({
      householdId: household.id,
      scope: this.resetScope
    });
    this.resetting.set(false);
    this.resetConfirmed = false;
    if (result.status === "error") {
      const message = result.message ?? this.loc.t("household.resetFailure");
      this.errorMessage.set(message);
      this.toast.push(message, "error");
      return;
    }

    this.errorMessage.set("");
    this.toast.push(this.loc.t("household.resetSuccess"), "success");
    if (this.resetScope === "delete_household") {
      await this.router.navigateByUrl("/");
    }
  }

  private resetScopeSuffix():
    | "ShoppingList"
    | "Batches"
    | "ProductsAndBatches"
    | "GroupsProductsAndBatches"
    | "AllData"
    | "DeleteHousehold" {
    switch (this.resetScope) {
      case "shopping_list":
        return "ShoppingList";
      case "batches":
        return "Batches";
      case "products_and_batches":
        return "ProductsAndBatches";
      case "groups_products_and_batches":
        return "GroupsProductsAndBatches";
      case "all_household_data":
        return "AllData";
      case "delete_household":
        return "DeleteHousehold";
    }
  }
}
