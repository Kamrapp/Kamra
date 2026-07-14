import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  type OnChanges,
  type SimpleChanges
} from "@angular/core";
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
import { TableIconButtonComponent } from "../shared/table-icon-button.component";

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
  imports: [FormsModule, TableIconButtonComponent],
  template: `
    <section
      class="ui-panel-card trip-panel"
      [class.trip-collapsed]="sectionCollapsed()"
      aria-labelledby="shopping-trip-title"
    >
      <div class="trip-heading">
        <button
          class="section-toggle"
          type="button"
          (click)="sectionCollapsed.set(!sectionCollapsed())"
          [attr.aria-expanded]="!sectionCollapsed()"
        >
          <span aria-hidden="true">{{ sectionCollapsed() ? "▸" : "▾" }}</span>
          <h2 class="ui-card-title" id="shopping-trip-title">
            {{ loc.t("household.shoppingTripTitle") }}
          </h2>
        </button>
        <app-table-icon-button
          [ariaLabel]="loc.t('common.refresh')"
          [titleText]="loc.t('common.refresh')"
          (press)="load()"
        >
          ⟳
        </app-table-icon-button>
      </div>
      @if (!sectionCollapsed()) {
        <div class="trip-content">
          @if (!trip()) {
            <div class="trip-layout trip-before-layout">
              <div class="trip-items trip-before-empty">
                <p class="ui-copy-muted">{{ loc.t("household.shoppingTripBeforeHint") }}</p>
              </div>
              <aside class="trip-after trip-before">
                <div>
                  <p class="ui-kicker">{{ loc.t("household.shoppingTripBeforeKicker") }}</p>
                  <h3 class="trip-after-title">
                    {{ loc.t("household.shoppingTripBeforeTitle") }}
                  </h3>
                </div>
                <div class="trip-start-form">
                  <label>
                    <span>{{ loc.t("household.shoppingTripMarket") }}</span>
                    <select
                      class="ui-form-control"
                      [ngModel]="marketId"
                      (ngModelChange)="selectMarket($event)"
                    >
                      <option value="">{{ loc.t("household.shoppingTripChooseMarket") }}</option>
                      <option value="__custom__">
                        {{ loc.t("household.shoppingTripCustomMarket") }}
                      </option>
                      @for (market of markets(); track market.id) {
                        <option [value]="market.id">
                          {{ market.displayName }} · {{ market.countryCode }}
                        </option>
                      }
                    </select>
                  </label>
                  @if (marketId === "__custom__") {
                    <label>
                      <span>{{ loc.t("household.shoppingTripCustomMarketName") }}</span>
                      <input class="ui-form-control" [(ngModel)]="customShopName" />
                    </label>
                  }
                  <label>
                    <span>{{ loc.t("household.shoppingTripDate") }}</span>
                    <input class="ui-form-control" type="date" [(ngModel)]="plannedDate" />
                  </label>
                </div>
                <button class="ui-button ui-button-primary" type="button" (click)="start()">
                  {{ loc.t("household.shoppingTripStart") }}
                </button>
                @if (message()) {
                  <p class="trip-message">{{ message() }}</p>
                }
              </aside>
            </div>
          } @else {
            <div class="trip-layout">
              <div class="trip-items">
                <div class="trip-table">
                  <div class="trip-table-header" aria-hidden="true">
                    <span>{{ loc.t("common.name") }}</span>
                    <span>{{ loc.t("household.quantity") }}</span>
                    <span>{{ loc.t("common.state") }}</span>
                    <span>{{ loc.t("household.actions") }}</span>
                  </div>
                  <div class="trip-table-body">
                    @for (item of trip()!.items; track item.id) {
                      <article class="trip-item">
                        <div class="trip-item-row">
                          <span class="trip-item-name">
                            <strong>{{ item.displayNameSnapshot }}</strong>
                          </span>
                          <span>{{ item.requiredQuantity }} {{ item.requiredUnit }}</span>
                          <span class="trip-item-state">
                            <strong>
                              {{
                                item.resultStatus === "pending"
                                  ? item.planStatus
                                  : item.resultStatus
                              }}
                            </strong>
                            <small>{{ priceStateLabel(item.priceState) }}</small>
                          </span>
                          <span class="trip-item-actions">
                            <app-table-icon-button
                              [ariaLabel]="loc.t('household.shoppingTripItemDetails')"
                              [titleText]="loc.t('household.shoppingTripItemDetails')"
                              (press)="toggleItemDetails(item.id)"
                            >
                              <svg class="trip-details-icon" aria-hidden="true" viewBox="0 0 24 24">
                                <path
                                  d="M10.5 4a6.5 6.5 0 0 1 5.18 10.43l3.45 3.44-1.42 1.42-3.44-3.45A6.5 6.5 0 1 1 10.5 4Zm0 2A4.5 4.5 0 1 0 10.5 15 4.5 4.5 0 0 0 10.5 6Z"
                                ></path>
                                @if (isItemDetailsOpen(item.id)) {
                                  <path d="M7.5 10h6v1.6h-6V10Z"></path>
                                } @else {
                                  <path
                                    d="M9.7 7.8h1.6V10h2.2v1.6h-2.2v2.2H9.7v-2.2H7.5V10h2.2V7.8Z"
                                  ></path>
                                }
                              </svg>
                            </app-table-icon-button>
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
                              (trip()!.status === "in_progress" ||
                                trip()!.status === "partially_processed")
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
                          </span>
                        </div>
                        @if (isItemDetailsOpen(item.id)) {
                          <div class="trip-item-details">
                            <div class="trip-item-meta">
                              <span>
                                <small>{{ priceStateLabel(item.priceState) }}</small>
                                <small>{{ matchExplanationLabel(item.matchExplanation) }}</small>
                              </span>
                              <span>
                                @if (item.expectedPackageCount) {
                                  {{
                                    loc.t("household.shoppingTripPackageCount", {
                                      count: item.expectedPackageCount
                                    })
                                  }}
                                }
                                @if (
                                  item.expectedTotal !== null && item.expectedTotal !== undefined
                                ) {
                                  {{
                                    loc.t("household.shoppingTripExpectedTotal", {
                                      amount: item.expectedTotal,
                                      currency: "HUF"
                                    })
                                  }}
                                }
                              </span>
                            </div>
                            @if (item.matchOptions?.length) {
                              <label class="trip-match-picker">
                                <span>{{ loc.t("household.shoppingTripChooseMatch") }}</span>
                                <select
                                  [ngModel]="item.selectedShopProductId"
                                  (ngModelChange)="selectMatch(item.id, $event)"
                                >
                                  @for (option of item.matchOptions; track option.shopProductId) {
                                    <option [value]="option.shopProductId">
                                      {{ option.displayName }}
                                    </option>
                                  }
                                </select>
                              </label>
                            }
                            @if (item.matchOptionsTruncated) {
                              <small>
                                {{ loc.t("household.shoppingTripMatchOptionsTruncated") }}
                              </small>
                            }
                            @if (
                              (trip()!.status === "in_progress" ||
                                trip()!.status === "partially_processed") &&
                              item.resultStatus !== "not_bought"
                            ) {
                              <label class="trip-match-picker">
                                <span>{{ loc.t("household.shoppingTripPurchaseProduct") }}</span>
                                <select
                                  [ngModel]="purchaseProductId(item)"
                                  (ngModelChange)="choosePurchaseProduct(item.id, $event)"
                                >
                                  <option value="">
                                    {{ loc.t("household.shoppingTripCreateProduct") }}
                                  </option>
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
                                      <span>
                                        {{ loc.t("household.shoppingTripActualQuantity") }}
                                      </span>
                                      <input
                                        type="number"
                                        min="0.001"
                                        [ngModel]="draft.quantity"
                                        (ngModelChange)="draft.quantity = $event"
                                      />
                                    </label>
                                    <label>
                                      <span>{{ loc.t("household.shoppingTripActualUnit") }}</span>
                                      <input
                                        [ngModel]="draft.unit"
                                        (ngModelChange)="draft.unit = $event"
                                      />
                                    </label>
                                    <label>
                                      <span>{{ loc.t("household.shoppingTripPaidPrice") }}</span>
                                      <input
                                        type="number"
                                        min="0"
                                        [ngModel]="draft.paidPrice"
                                        (ngModelChange)="
                                          draft.paidPrice = $event === '' ? null : $event
                                        "
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
                          </div>
                        }
                      </article>
                    }
                  </div>
                </div>
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
              </div>
              <aside class="trip-after">
                <div>
                  <p class="ui-kicker">{{ loc.t("household.shoppingTripAfterKicker") }}</p>
                  <h3 class="trip-after-title">{{ loc.t("household.shoppingTripAfterTitle") }}</h3>
                </div>
                <dl class="trip-summary">
                  <div>
                    <dt>{{ loc.t("household.shoppingTripShop") }}</dt>
                    <dd>{{ tripShopName(trip()!) }}</dd>
                  </div>
                  <div>
                    <dt>{{ loc.t("household.shoppingTripDate") }}</dt>
                    <dd>{{ trip()!.plannedDate }}</dd>
                  </div>
                  <div>
                    <dt>{{ loc.t("common.state") }}</dt>
                    <dd>{{ trip()!.status }}</dd>
                  </div>
                </dl>
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
                <button class="ui-button ui-button-danger" type="button" (click)="cancelTrip()">
                  {{ loc.t("household.shoppingTripCancel") }}
                </button>
                @if (message()) {
                  <p class="trip-message">{{ message() }}</p>
                }
              </aside>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .trip-panel {
        display: grid;
        gap: var(--space-3);
        grid-template-rows: auto minmax(0, 1fr);
        height: 100%;
        min-height: 0;
      }
      .trip-panel.trip-collapsed {
        height: auto;
        min-height: 0;
        padding-block: var(--space-3);
        grid-template-rows: auto;
      }
      .trip-content {
        align-content: start;
        display: grid;
        gap: var(--space-3);
        min-height: 0;
        overflow: hidden;
      }
      .trip-heading {
        align-items: center;
        display: flex;
        gap: var(--space-2);
        justify-content: space-between;
      }
      .trip-layout {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(0, 1fr) minmax(17rem, 0.35fr);
        height: 100%;
        min-height: 0;
      }
      .trip-items {
        display: grid;
        gap: var(--space-3);
        grid-template-rows: minmax(0, 1fr) auto;
        min-height: 0;
        overflow: auto;
      }
      .trip-start-form {
        display: grid;
        gap: var(--space-2);
      }
      .trip-before-empty {
        align-content: start;
        padding: var(--space-2);
      }
      .trip-start-form label,
      .trip-unplanned label,
      .trip-result-editor label {
        display: grid;
        gap: 0.2rem;
      }
      .trip-start-form label > span,
      .trip-unplanned label > span,
      .trip-result-editor label > span {
        color: var(--color-text-muted);
        font-size: 0.68rem;
        font-weight: 900;
        text-transform: uppercase;
      }
      .trip-table {
        background: var(--household-batch-row-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
      .trip-table-header,
      .trip-item-row {
        align-items: center;
        display: grid;
        gap: var(--space-2);
        grid-template-columns: minmax(9rem, 1fr) minmax(5rem, 0.45fr) minmax(7rem, 0.55fr) auto;
      }
      .trip-table-header {
        background: var(--pulse-row-background);
        border-bottom: 1px solid var(--line-strong);
        color: var(--color-text-muted);
        font-size: 0.68rem;
        font-weight: 900;
        padding: 0.45rem 0.65rem 0.35rem;
        text-transform: uppercase;
      }
      .trip-table-header span:last-child {
        text-align: right;
      }
      .trip-table-body {
        align-content: start;
        display: grid;
        grid-auto-rows: max-content;
        min-height: 8rem;
        overflow: auto;
      }
      .trip-item {
        background: var(--household-product-row-background);
        border-bottom: 1px solid var(--line-subtle);
      }
      .trip-item-row {
        min-height: 2.5rem;
        padding: 0.35rem 0.65rem;
      }
      .trip-item-name,
      .trip-item-state {
        display: grid;
        gap: 0.15rem;
        min-width: 0;
      }
      .trip-item-name strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .trip-item-state small {
        color: var(--color-text-muted);
      }
      .trip-item-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        justify-content: flex-end;
      }
      .trip-item-actions .ui-button {
        white-space: nowrap;
      }
      .trip-item-details {
        background: var(--surface-soft-background);
        border-top: 1px solid var(--line-subtle);
        display: grid;
        gap: var(--space-2);
        padding: 0.65rem 0.75rem;
      }
      .trip-details-icon {
        display: block;
        fill: currentColor;
        height: 1rem;
        width: 1rem;
      }
      .trip-item-meta {
        align-items: start;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
      }
      .trip-item-meta > span {
        display: grid;
        gap: 0.2rem;
      }
      .trip-item-meta small {
        color: var(--color-text-muted);
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
      .trip-after {
        align-content: start;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: var(--space-4);
        min-height: 0;
        overflow: auto;
        padding: 1rem;
      }
      .trip-after-title {
        margin: 0;
      }
      .trip-summary {
        display: grid;
        gap: var(--space-3);
        margin: 0;
      }
      .trip-summary > div {
        display: grid;
        gap: 0.2rem;
      }
      .trip-summary dt {
        color: var(--color-text-muted);
        font-size: 0.68rem;
        font-weight: 900;
        text-transform: uppercase;
      }
      .trip-summary dd {
        margin: 0;
      }
      .trip-after > .ui-button {
        width: 100%;
      }
      .trip-result-editor,
      .trip-unplanned {
        background: var(--surface-soft-background);
        border: 1px solid var(--line-panel);
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
        .trip-panel {
          height: auto;
        }
        .trip-content {
          overflow: visible;
        }
        .trip-layout {
          grid-template-columns: 1fr;
          height: auto;
        }
        .trip-items,
        .trip-table-body {
          overflow: visible;
        }
        .trip-table-body {
          min-height: 0;
        }
        .trip-items {
          grid-template-rows: auto auto;
        }
        .trip-table {
          grid-template-rows: auto auto;
          height: auto;
        }
        .trip-start-form,
        .trip-result-editor,
        .trip-unplanned {
          grid-template-columns: 1fr;
        }
        .trip-table-header {
          display: none;
        }
        .trip-item-row {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .trip-item-row > :nth-child(2),
        .trip-item-row > :nth-child(3) {
          display: none;
        }
        .trip-item-actions {
          grid-column: 2;
          grid-row: 1;
        }
      }
    `
  ]
})
export class HouseholdShoppingTripPanelComponent implements OnChanges {
  @Input({ required: true }) householdId = "";
  @Output() shoppingTripCancelled = new EventEmitter<void>();
  readonly loc = inject(LocalizationService);
  private readonly api = inject(HouseholdV2Service);
  private readonly toast = inject(ToastService);
  readonly sectionCollapsed = signal(true);
  readonly trip = signal<HouseholdShoppingTrip | null>(null);
  readonly productOptions = signal<HouseholdV2Product[]>([]);
  readonly markets = signal<HouseholdV2ShopMarket[]>([]);
  readonly message = signal("");
  readonly expandedItemIds = signal<ReadonlySet<string>>(new Set());
  readonly drafts: Record<string, TripResultDraft> = {};
  marketId = "";
  customShopName = "";
  plannedDate = new Date().toISOString().slice(0, 10);
  unplannedName = "";
  unplannedQuantity = 1;
  unplannedUnit = "count";

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["householdId"]?.currentValue) {
      void this.load();
      void this.loadProductOptions();
      void this.loadMarkets();
    }
  }
  private setTrip(next: HouseholdShoppingTrip | null): void {
    this.trip.set(next);
    if (!next) {
      this.expandedItemIds.set(new Set());
      this.resetStartForm();
      return;
    }
    if (next.shopMarketId) this.marketId = next.shopMarketId;
    else if (next.shopNameSnapshot) {
      this.marketId = "__custom__";
      this.customShopName = next.shopNameSnapshot;
    }
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
  isItemDetailsOpen(itemId: string): boolean {
    return this.expandedItemIds().has(itemId);
  }
  toggleItemDetails(itemId: string): void {
    this.expandedItemIds.update((expanded) => {
      const next = new Set(expanded);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }
  private openItemDetails(itemId: string): void {
    this.expandedItemIds.update((expanded) => new Set(expanded).add(itemId));
  }
  tripShopName(trip: HouseholdShoppingTrip): string {
    if (trip.shopNameSnapshot) return trip.shopNameSnapshot;
    return (
      this.markets().find((market) => market.id === trip.shopMarketId)?.displayName ??
      this.loc.t("household.shoppingTripUnknownShop")
    );
  }
  async load(): Promise<void> {
    if (!this.householdId) return;
    const result = await this.api.listShoppingTrips(this.householdId);
    if (result.status === "ok")
      this.setTrip(
        result.trips.find((candidate) => !["completed", "cancelled"].includes(candidate.status)) ??
          null
      );
    else this.message.set(result.message ?? "");
  }
  collapsePanel(): void {
    this.sectionCollapsed.set(true);
  }
  private resetStartForm(): void {
    this.marketId = "";
    this.customShopName = "";
    this.plannedDate = new Date().toISOString().slice(0, 10);
    this.unplannedName = "";
    this.unplannedQuantity = 1;
    this.unplannedUnit = "count";
    for (const key of Object.keys(this.drafts)) delete this.drafts[key];
  }
  async loadMarkets(): Promise<void> {
    if (!this.householdId) return;
    const result = await this.api.listShopMarkets(this.householdId);
    if (result.status === "ok") this.markets.set(result.markets);
    else this.message.set(result.message ?? "");
  }
  async loadProductOptions(): Promise<void> {
    if (!this.householdId) return;
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
    const customShop = this.marketId === "__custom__";
    const result = await this.api.createShoppingTrip({
      householdId: this.householdId,
      plannedDate: this.plannedDate,
      shopMarketId: customShop ? null : this.marketId.trim() || null,
      shopNameSnapshot: customShop ? this.customShopName.trim() : null
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
  selectMarket(value: string): void {
    this.marketId = value;
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
  async cancelTrip(): Promise<void> {
    const current = this.trip();
    if (!current) return;
    const result = await this.api.updateShoppingTrip({
      householdId: this.householdId,
      tripId: current.id,
      expectedRevision: current.revision,
      transition: "cancelled"
    });
    if (result.status === "ok" && result.trip) {
      this.setTrip(null);
      this.sectionCollapsed.set(true);
      this.shoppingTripCancelled.emit();
      this.toast.push(this.loc.t("household.shoppingTripCancelled"), "success");
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
      if (resultStatus === "bought") {
        this.openItemDetails(itemId);
      }
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
