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
              <strong>{{ item.displayNameSnapshot }}</strong>
              · {{ item.requiredQuantity }} {{ item.requiredUnit }}
              @if (item.expectedPackageCount) {
                ·
                {{
                  loc.t("household.shoppingTripPackageCount", {
                    count: item.expectedPackageCount
                  })
                }}
              }
              @if (item.expectedTotal !== null && item.expectedTotal !== undefined) {
                ·
                {{
                  loc.t("household.shoppingTripExpectedTotal", {
                    amount: item.expectedTotal,
                    currency: "HUF"
                  })
                }}
              }
              <small>
                {{ priceStateLabel(item.priceState) }} ·
                {{ matchExplanationLabel(item.matchExplanation) }}
              </small>
              @if (item.matchOptions?.length) {
                <label class="trip-match-picker">
                  <span>{{ loc.t("household.shoppingTripChooseMatch") }}</span>
                  <select
                    [ngModel]="item.selectedShopProductId"
                    (ngModelChange)="selectMatch(item.id, $event)"
                  >
                    @for (option of item.matchOptions; track option.shopProductId) {
                      <option [value]="option.shopProductId">{{ option.displayName }}</option>
                    }
                  </select>
                </label>
              }
            </span>
            @if (item.planStatus === "unresolved") {
              <button
                class="ui-button ui-button-quiet ui-button-sm"
                type="button"
                (click)="skip(item.id)"
              >
                {{ loc.t("household.shoppingTripSkip") }}
              </button>
            }
            @if (
              item.resultStatus === "pending" &&
              ["in_progress", "partially_processed"].includes(trip()!.status)
            ) {
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
        @if (trip()!.status === "matching") {
          <button
            class="ui-button ui-button-primary"
            type="button"
            (click)="advance(trip()!)"
            [disabled]="trip()!.items.some((item) => item.planStatus === 'unresolved')"
          >
            {{ loc.t("household.shoppingTripContinue") }}
          </button>
        } @else {
          <button
            class="ui-button ui-button-primary"
            type="button"
            (click)="complete()"
            [disabled]="trip()!.status === 'completed'"
          >
            {{ loc.t("household.shoppingTripFinalize") }}
          </button>
        }
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
      .trip-item > span {
        display: grid;
        gap: 0.2rem;
      }
      .trip-match-picker {
        align-items: center;
        display: flex;
        gap: var(--space-2);
      }
      .trip-match-picker span,
      .trip-item small {
        opacity: 0.72;
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
    for (const item of current.items.filter((candidate) => candidate.selectedShopProductId)) {
      const next = await this.api.updateShoppingTrip({
        householdId: this.householdId,
        tripId: current.id,
        expectedRevision: current.revision,
        itemId: item.id,
        planStatus: "selected",
        selectedShopProductId: item.selectedShopProductId ?? undefined
      });
      if (next.status !== "ok" || !next.trip) {
        this.message.set(next.message ?? "");
        return;
      }
      current = next.trip;
    }
    const matching = await this.api.updateShoppingTrip({
      householdId: this.householdId,
      tripId: current.id,
      expectedRevision: current.revision,
      transition: "matching"
    });
    if (matching.status !== "ok" || !matching.trip) {
      this.message.set(matching.message ?? "");
      return;
    }
    current = matching.trip;
    this.trip.set(current);
    if (!current.items.some((item) => item.planStatus === "unresolved"))
      await this.advance(current);
  }
  async advance(current: HouseholdShoppingTrip): Promise<void> {
    let nextTrip = current;
    for (const transition of ["ready", "in_progress"]) {
      const next = await this.api.updateShoppingTrip({
        householdId: this.householdId,
        tripId: nextTrip.id,
        expectedRevision: nextTrip.revision,
        transition
      });
      if (next.status !== "ok" || !next.trip) {
        this.message.set(next.message ?? "");
        return;
      }
      nextTrip = next.trip;
    }
    this.trip.set(nextTrip);
  }
  async selectMatch(itemId: string, shopProductId: string): Promise<void> {
    const current = this.trip();
    if (!current || !shopProductId) return;
    const result = await this.api.updateShoppingTrip({
      householdId: this.householdId,
      tripId: current.id,
      expectedRevision: current.revision,
      itemId,
      planStatus: "selected",
      selectedShopProductId: shopProductId
    });
    if (result.status !== "ok" || !result.trip) {
      this.message.set(result.message ?? "");
      return;
    }
    this.trip.set(result.trip);
  }
  async skip(itemId: string): Promise<void> {
    const current = this.trip();
    if (!current) return;
    const result = await this.api.updateShoppingTrip({
      householdId: this.householdId,
      tripId: current.id,
      expectedRevision: current.revision,
      itemId,
      planStatus: "skipped"
    });
    if (result.status !== "ok" || !result.trip) {
      this.message.set(result.message ?? "");
      return;
    }
    this.trip.set(result.trip);
    if (
      result.trip.status === "matching" &&
      !result.trip.items.some((item) => item.planStatus === "unresolved")
    )
      await this.advance(result.trip);
  }
  priceStateLabel(state: string | null | undefined): string {
    const key =
      state === "applicable"
        ? "household.shoppingTripPriceApplicable"
        : state === "conditional_only"
          ? "household.shoppingTripPriceConditional"
          : state === "expired"
            ? "household.shoppingTripPriceExpired"
            : state === "future"
              ? "household.shoppingTripPriceFuture"
              : state === "stale"
                ? "household.shoppingTripPriceStale"
                : "household.shoppingTripPriceUnavailable";
    return this.loc.t(key);
  }
  matchExplanationLabel(explanation: string | null | undefined): string {
    return explanation === "preferred household Product"
      ? this.loc.t("household.shoppingTripPreferredMatch")
      : explanation === "compatible package candidate"
        ? this.loc.t("household.shoppingTripCompatibleMatch")
        : this.loc.t("household.shoppingTripNoCompatibleMatch");
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
