import { Component, Input, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HouseholdV2Service, type HouseholdShoppingTrip } from "./household-v2.service";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

@Component({
  selector: "app-household-shopping-trip-panel",
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="ui-panel-card trip-panel" aria-labelledby="shopping-trip-title">
      <div class="trip-heading">
        <div>
          <p class="ui-kicker">{{ loc.t("household.shoppingTripKicker") }}</p>
          <h2 class="ui-card-title" id="shopping-trip-title">
            {{ loc.t("household.shoppingTripTitle") }}
          </h2>
        </div>
        <button class="ui-button ui-button-quiet ui-button-sm" type="button" (click)="load()">
          {{ loc.t("common.refresh") }}
        </button>
      </div>
      @if (!trip()) {
        <div class="trip-start-form">
          <label>
            <span>{{ loc.t("household.shoppingTripMarket") }}</span>
            <input [(ngModel)]="marketId" placeholder="shop-market:lidl-hu" />
          </label>
          <label>
            <span>{{ loc.t("household.shoppingTripDate") }}</span>
            <input type="date" [(ngModel)]="plannedDate" />
          </label>
          <button class="ui-button ui-button-primary" type="button" (click)="start()">
            {{ loc.t("household.shoppingTripStart") }}
          </button>
        </div>
      } @else {
        <p class="trip-status">{{ trip()!.status }} · {{ trip()!.plannedDate }}</p>
        @for (item of trip()!.items; track item.id) {
          <div class="trip-item">
            <span>
              {{ item.displayNameSnapshot }} · {{ item.requiredQuantity }} {{ item.requiredUnit }}
            </span>
            @if (item.resultStatus === "pending") {
              <button
                class="ui-button ui-button-quiet ui-button-sm"
                type="button"
                (click)="mark(item.id, 'bought')"
              >
                {{ loc.t("household.shoppingTripBought") }}
              </button>
              <button
                class="ui-button ui-button-quiet ui-button-sm"
                type="button"
                (click)="mark(item.id, 'not_bought')"
              >
                {{ loc.t("household.shoppingTripNotBought") }}
              </button>
            } @else {
              <span class="trip-result">{{ item.resultStatus }}</span>
            }
          </div>
        }
        <button
          class="ui-button ui-button-primary"
          type="button"
          (click)="complete()"
          [disabled]="trip()!.status === 'completed'"
        >
          {{ loc.t("household.shoppingTripFinalize") }}
        </button>
      }
      @if (message()) {
        <p class="trip-message">{{ message() }}</p>
      }
    </section>
  `,
  styles: [
    `
      .trip-panel {
        display: grid;
        gap: var(--space-3);
      }
      .trip-heading,
      .trip-item {
        align-items: center;
        display: flex;
        gap: var(--space-2);
        justify-content: space-between;
      }
      .trip-start-form {
        display: grid;
        gap: var(--space-2);
        grid-template-columns: 1fr 1fr auto;
      }
      .trip-item {
        border-top: 1px solid var(--ui-border);
        padding: 0.45rem 0;
      }
      .trip-result {
        opacity: 0.72;
      }
      .trip-message {
        margin: 0;
      }
    `
  ]
})
export class HouseholdShoppingTripPanelComponent {
  @Input({ required: true }) householdId = "";
  readonly loc = inject(LocalizationService);
  private readonly api = inject(HouseholdV2Service);
  private readonly toast = inject(ToastService);
  readonly trip = signal<HouseholdShoppingTrip | null>(null);
  readonly message = signal("");
  marketId = "";
  plannedDate = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    void this.load();
  }
  async load(): Promise<void> {
    const result = await this.api.listShoppingTrips(this.householdId);
    if (result.status === "ok")
      this.trip.set(
        result.trips.find((candidate) => !["completed", "cancelled"].includes(candidate.status)) ??
          null
      );
    else this.message.set(result.message ?? "");
  }
  async start(): Promise<void> {
    const result = await this.api.createShoppingTrip({
      householdId: this.householdId,
      plannedDate: this.plannedDate,
      shopMarketId: this.marketId.trim()
    });
    if (result.status !== "ok" || !result.trip) {
      this.message.set(result.message ?? "");
      return;
    }
    let current = result.trip;
    for (const item of current.items) {
      const next = await this.api.updateShoppingTrip({
        householdId: this.householdId,
        tripId: current.id,
        expectedRevision: current.revision,
        itemId: item.id,
        planStatus: "selected"
      });
      if (next.status !== "ok" || !next.trip) {
        this.message.set(next.message ?? "");
        return;
      }
      current = next.trip;
    }
    for (const transition of ["matching", "ready", "in_progress"]) {
      const next = await this.api.updateShoppingTrip({
        householdId: this.householdId,
        tripId: current.id,
        expectedRevision: current.revision,
        transition
      });
      if (next.status !== "ok" || !next.trip) {
        this.message.set(next.message ?? "");
        return;
      }
      current = next.trip;
    }
    this.trip.set(current);
  }
  async mark(itemId: string, resultStatus: "bought" | "not_bought"): Promise<void> {
    const current = this.trip();
    if (!current) return;
    const result = await this.api.updateShoppingTrip({
      householdId: this.householdId,
      tripId: current.id,
      expectedRevision: current.revision,
      itemId,
      resultStatus
    });
    if (result.status === "ok" && result.trip) this.trip.set(result.trip);
    else this.message.set(result.message ?? "");
  }
  async complete(): Promise<void> {
    const current = this.trip();
    if (!current) return;
    const result = await this.api.completeShoppingTrip({
      householdId: this.householdId,
      tripId: current.id,
      operationId: crypto.randomUUID(),
      items: current.items
        .filter((item) => item.resultStatus !== "pending")
        .map((item) => ({
          itemId: item.id,
          resultStatus: item.resultStatus as "bought" | "not_bought",
          actualQuantity: item.actualQuantity ?? item.requiredQuantity
        }))
    });
    if (result.status === "ok" && result.trip) {
      this.trip.set(result.trip);
      this.toast.push(this.loc.t("household.shoppingTripSaved"), "success");
    } else this.message.set(result.message ?? "");
  }
}
