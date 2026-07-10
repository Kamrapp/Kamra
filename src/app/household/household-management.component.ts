import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";

import { HouseholdStockService, type HouseholdListItem } from "./household-stock.service";
import { LocalizationService } from "../shared/localization.service";

@Component({
  selector: "app-household-management",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="management-shell">
      <div class="management-card">
        <p class="card-kicker">{{ loc.t("household.managementKicker") }}</p>
        <h1>{{ loc.t("household.managementTitle") }}</h1>

        @if (household(); as currentHousehold) {
          <p class="management-summary">
            {{ loc.t("household.managementSummary", { name: currentHousehold.name }) }}
          </p>
        } @else {
          <p class="management-summary">{{ loc.t("household.managementMissing") }}</p>
        }

        <div class="management-actions">
          <a class="ui-button ui-button-quiet ui-button-sm" routerLink="/">
            {{ loc.t("household.backToPulse") }}
          </a>
        </div>
      </div>

      <div class="management-grid">
        <article class="management-panel">
          <p class="card-kicker">{{ loc.t("household.managementIdentityKicker") }}</p>
          <h2>{{ loc.t("household.managementIdentityTitle") }}</h2>
          <p>{{ loc.t("household.managementIdentityDescription") }}</p>
        </article>

        <article class="management-panel">
          <p class="card-kicker">{{ loc.t("household.managementInviteKicker") }}</p>
          <h2>{{ loc.t("household.managementInviteTitle") }}</h2>
          <p>{{ loc.t("household.managementInviteDescription") }}</p>
        </article>

        <article class="management-panel">
          <p class="card-kicker">{{ loc.t("household.managementLimitsKicker") }}</p>
          <h2>{{ loc.t("household.managementLimitsTitle") }}</h2>
          <p>{{ loc.t("household.managementLimitsDescription") }}</p>
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
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
        display: grid;
        gap: var(--space-3);
        padding: clamp(1rem, 3vw, 1.4rem);
      }

      .management-summary {
        margin: 0;
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
  private readonly route = inject(ActivatedRoute);

  readonly household = signal<HouseholdListItem | null>(null);

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
  }
}
