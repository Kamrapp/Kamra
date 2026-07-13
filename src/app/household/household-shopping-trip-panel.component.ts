import { Component, Input, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  HouseholdV2Service,
  type HouseholdShoppingTrip,
  type HouseholdShoppingTripItem,
  type HouseholdV2ShopMarket,
  type HouseholdV2Product,
  type HouseholdV2ProductGroup
} from "./household-v2.service";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";

interface TripResultDraft {
  acquiredOn: string;
  currencyCode: string;
  expiryOn: string;
  paidPrice: number | null;
  quantity: number;
  unit: string;
}

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
            <select [(ngModel)]="marketId">
              <option value="">{{ loc.t("household.shoppingTripChooseMarket") }}</option>
              @for (market of markets(); track market.id) {
                <option [value]="market.id">
                  {{ market.displayName }} · {{ market.countryCode }}
                </option>
              }
            </select>
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
              @if (item.matchOptionsTruncated) {
                <small>{{ loc.t("household.shoppingTripMatchOptionsTruncated") }}</small>
              }
              @if (
                ["in_progress", "partially_processed"].includes(trip()!.status) &&
                item.resultStatus !== "not_bought"
              ) {
                <label class="trip-match-picker">
                  <span>{{ loc.t("household.shoppingTripPurchaseProduct") }}</span>
                  <select
                    [ngModel]="purchaseProductId(item)"
                    (ngModelChange)="choosePurchaseProduct(item.id, $event)"
                  >
                    <option value="">{{ loc.t("household.shoppingTripCreateProduct") }}</option>
                    @for (product of productOptions(); track product.id) {
                      <option [value]="product.id">{{ product.displayName }}</option>
                    }
                  </select>
                </label>
                @if (item.resultStatus === "bought") {
                  @if (resultDraft(item); as draft) {
                    <div class="trip-result-editor">
                      <p>{{ loc.t("household.shoppingTripActualResult") }}</p>
                      <label>
                        <span>{{ loc.t("household.shoppingTripActualQuantity") }}</span>
                        <input
                          type="number"
                          min="0.001"
                          [ngModel]="draft.quantity"
                          (ngModelChange)="draft.quantity = $event"
                        />
                      </label>
                      <label>
                        <span>{{ loc.t("household.shoppingTripActualUnit") }}</span>
                        <input [ngModel]="draft.unit" (ngModelChange)="draft.unit = $event" />
                      </label>
                      <label>
                        <span>{{ loc.t("household.shoppingTripPaidPrice") }}</span>
                        <input
                          type="number"
                          min="0"
                          [ngModel]="draft.paidPrice"
                          (ngModelChange)="draft.paidPrice = $event === '' ? null : $event"
                        />
                      </label>
                      <label>
                        <span>{{ loc.t("household.shoppingTripCurrency") }}</span>
                        <input
                          [ngModel]="draft.currencyCode"
                          (ngModelChange)="draft.currencyCode = $event"
                        />
                      </label>
                      <label>
                        <span>{{ loc.t("household.shoppingTripAcquiredOn") }}</span>
                        <input
                          type="date"
                          [ngModel]="draft.acquiredOn"
                          (ngModelChange)="draft.acquiredOn = $event"
                        />
                      </label>
                      <label>
                        <span>{{ loc.t("household.shoppingTripExpiryOn") }}</span>
                        <input
                          type="date"
                          [ngModel]="draft.expiryOn"
                          (ngModelChange)="draft.expiryOn = $event"
                        />
                      </label>
                      <button
                        class="ui-button ui-button-quiet ui-button-sm"
                        type="button"
                        (click)="saveResult(item.id)"
                      >
                        {{ loc.t("household.shoppingTripSaveResult") }}
                      </button>
                    </div>
                  }
                }
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
        @if (["in_progress", "partially_processed"].includes(trip()!.status)) {
          <div class="trip-unplanned">
            <p>{{ loc.t("household.shoppingTripUnplannedTitle") }}</p>
            <label>
              <span>{{ loc.t("household.shoppingTripUnplannedName") }}</span>
              <input [(ngModel)]="unplannedName" />
            </label>
            <label>
              <span>{{ loc.t("household.shoppingTripActualQuantity") }}</span>
              <input type="number" min="0.001" [(ngModel)]="unplannedQuantity" />
            </label>
            <label>
              <span>{{ loc.t("household.shoppingTripActualUnit") }}</span>
              <input [(ngModel)]="unplannedUnit" />
            </label>
            <button
              class="ui-button ui-button-quiet ui-button-sm"
              type="button"
              (click)="addUnplannedPurchase()"
            >
              {{ loc.t("household.shoppingTripAddUnplanned") }}
            </button>
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
      .trip-start-form label,
      .trip-unplanned label,
      .trip-result-editor label {
        display: grid;
        gap: 0.2rem;
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
      .trip-result-editor,
      .trip-unplanned {
        background: var(--ui-surface-muted);
        border: 1px solid var(--ui-border);
        display: grid;
        gap: var(--space-2);
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: var(--space-2);
        padding: var(--space-2);
      }
      .trip-result-editor p,
      .trip-unplanned p {
        grid-column: 1 / -1;
        margin: 0;
      }
      .trip-result-editor button,
      .trip-unplanned button {
        align-self: end;
      }
      .trip-message {
        margin: 0;
      }
      @media (max-width: 50rem) {
        .trip-start-form,
        .trip-result-editor,
        .trip-unplanned {
          grid-template-columns: 1fr;
        }
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
  readonly productOptions = signal<HouseholdV2Product[]>([]);
  readonly markets = signal<HouseholdV2ShopMarket[]>([]);
  readonly message = signal("");
  readonly drafts: Record<string, TripResultDraft> = {};
  marketId = "";
  plannedDate = new Date().toISOString().slice(0, 10);
  unplannedName = "";
  unplannedQuantity = 1;
  unplannedUnit = "count";

  ngOnInit(): void {
    void this.load();
    void this.loadProductOptions();
    void this.loadMarkets();
  }
  private setTrip(next: HouseholdShoppingTrip | null): void {
    this.trip.set(next);
    if (!next) return;
    if (next.shopMarketId) this.marketId = next.shopMarketId;
    const market = this.markets().find((candidate) => candidate.id === next.shopMarketId);
    for (const item of next.items) {
      if (this.drafts[item.id]) continue;
      this.drafts[item.id] = {
        acquiredOn: item.actualAcquiredOn ?? next.plannedDate,
        currencyCode: item.actualCurrencyCode ?? market?.currencyCode ?? "HUF",
        expiryOn: item.actualExpiryOn ?? "",
        paidPrice: item.actualPaidPrice ?? null,
        quantity: item.actualQuantity ?? item.requiredQuantity,
        unit: item.actualUnit ?? item.requiredUnit
      };
    }
  }
  async load(): Promise<void> {
    const result = await this.api.listShoppingTrips(this.householdId);
    if (result.status === "ok")
      this.setTrip(
        result.trips.find((candidate) => !["completed", "cancelled"].includes(candidate.status)) ??
          null
      );
    else this.message.set(result.message ?? "");
  }
  async loadMarkets(): Promise<void> {
    const result = await this.api.listShopMarkets(this.householdId);
    if (result.status === "ok") this.markets.set(result.markets);
    else this.message.set(result.message ?? "");
  }
  async loadProductOptions(): Promise<void> {
    const result = await this.api.loadWorkspace(this.householdId);
    if (result.status !== "ok" || !result.workspace) return;
    const products: HouseholdV2Product[] = [
      ...result.workspace.unassignedProducts.map((row) => row.product)
    ];
    const collect = (group: HouseholdV2ProductGroup): void => {
      products.push(...group.products.map((row) => row.product));
      group.childGroups.forEach(collect);
    };
    result.workspace.productGroups.forEach(collect);
    this.productOptions.set(
      [...new Map(products.map((product) => [product.id, product])).values()].sort((left, right) =>
        left.displayName.localeCompare(right.displayName)
      )
    );
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
    this.setTrip(current);
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
    this.setTrip(nextTrip);
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
    this.setTrip(result.trip);
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
    this.setTrip(result.trip);
    if (
      result.trip.status === "matching" &&
      !result.trip.items.some((item) => item.planStatus === "unresolved")
    )
      await this.advance(result.trip);
  }
  purchaseProductId(item: HouseholdShoppingTripItem): string {
    if (item.purchaseHouseholdProductId !== undefined) return item.purchaseHouseholdProductId ?? "";
    return (
      this.productOptions().find((product) => product.catalogProductId === item.selectedProductId)
        ?.id ?? ""
    );
  }
  purchaseProductSelection(item: HouseholdShoppingTripItem): string | null | undefined {
    if (item.purchaseHouseholdProductId !== undefined) return item.purchaseHouseholdProductId;
    return this.purchaseProductId(item) || undefined;
  }
  async choosePurchaseProduct(itemId: string, householdProductId: string): Promise<void> {
    const current = this.trip();
    if (!current) return;
    const result = await this.api.updateShoppingTrip({
      householdId: this.householdId,
      tripId: current.id,
      expectedRevision: current.revision,
      householdProductId: householdProductId || null,
      itemId
    });
    if (result.status === "ok" && result.trip) this.setTrip(result.trip);
    else this.message.set(result.message ?? "");
  }
  resultDraft(item: HouseholdShoppingTripItem): TripResultDraft | undefined {
    return this.drafts[item.id];
  }
  async saveResult(itemId: string): Promise<void> {
    const current = this.trip();
    const draft = this.drafts[itemId];
    if (!current || !draft) return;
    const result = await this.api.updateShoppingTrip({
      actualAcquiredOn: draft.acquiredOn || null,
      actualCurrencyCode: draft.currencyCode.trim() || null,
      actualExpiryOn: draft.expiryOn || null,
      actualPaidPrice: draft.paidPrice,
      actualQuantity: draft.quantity,
      actualUnit: draft.unit.trim(),
      householdId: this.householdId,
      itemId,
      expectedRevision: current.revision,
      resultStatus: "bought",
      tripId: current.id
    });
    if (result.status === "ok" && result.trip) {
      this.setTrip(result.trip);
      this.toast.push(this.loc.t("household.shoppingTripResultSaved"), "success");
    } else this.message.set(result.message ?? "");
  }
  async addUnplannedPurchase(): Promise<void> {
    const current = this.trip();
    const name = this.unplannedName.trim();
    if (!current || !name) return;
    const result = await this.api.updateShoppingTrip({
      expectedRevision: current.revision,
      householdId: this.householdId,
      tripId: current.id,
      unplannedPurchase: {
        displayName: name,
        id: crypto.randomUUID(),
        quantity: this.unplannedQuantity,
        unit: this.unplannedUnit.trim()
      }
    });
    if (result.status === "ok" && result.trip) {
      this.setTrip(result.trip);
      this.unplannedName = "";
      this.unplannedQuantity = 1;
      this.unplannedUnit = "count";
      this.toast.push(this.loc.t("household.shoppingTripUnplannedAdded"), "success");
    } else this.message.set(result.message ?? "");
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
    if (result.status === "ok" && result.trip) {
      this.setTrip(result.trip);
      if (resultStatus === "bought" && !this.drafts[itemId]) {
        const item = result.trip.items.find((candidate) => candidate.id === itemId);
        if (item) this.setTrip(result.trip);
      }
    } else this.message.set(result.message ?? "");
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
        .map((item) => {
          const draft = this.drafts[item.id];
          return {
            acquiredOn: draft?.acquiredOn || item.actualAcquiredOn || null,
            actualCurrencyCode: draft?.currencyCode || item.actualCurrencyCode || null,
            actualPaidPrice: draft?.paidPrice ?? item.actualPaidPrice ?? null,
            actualQuantity: draft?.quantity ?? item.actualQuantity ?? item.requiredQuantity,
            actualUnit: draft?.unit || item.actualUnit || item.requiredUnit,
            expiryOn: draft?.expiryOn || item.actualExpiryOn || null,
            householdProductId: this.purchaseProductSelection(item),
            itemId: item.id,
            resultStatus: item.resultStatus as "bought" | "not_bought",
            shopProductId: item.selectedShopProductId ?? null
          };
        })
    });
    if (result.status === "ok" && result.trip) {
      this.setTrip(result.trip);
      this.toast.push(this.loc.t("household.shoppingTripSaved"), "success");
    } else this.message.set(result.message ?? "");
  }
}
