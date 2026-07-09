import { FormsModule } from "@angular/forms";
import { Component, computed, effect, inject, signal } from "@angular/core";

import { AuthService } from "./auth.service";
import {
  HouseholdStockService,
  type HouseholdListItem,
  type HouseholdStockItemListItem,
  type HouseholdStockPage
} from "./household/household-stock.service";
import { LocalizationService, type TranslationKey } from "./shared/localization.service";
import { ToastService } from "./shared/toast.service";

type EditorMode = "create" | "edit";
type ShoppingScale = "usual" | "chill" | "stock_up";

interface StockDraft {
  currentAmount: number;
  displayName: string;
  gtin: string;
  id: string;
  initialAmount: number;
  minLimit: number;
  note: string;
  sourceName: string;
  sourceProductUrl: string;
  stockedAt: string;
  stockGroupKey: string;
  unit: string;
}

interface ShoppingScaleOption {
  key: ShoppingScale;
  labelKey: TranslationKey;
}

const shoppingScaleOptions: readonly ShoppingScaleOption[] = [
  {
    key: "usual",
    labelKey: "household.shoppingScaleUsual"
  },
  {
    key: "chill",
    labelKey: "household.shoppingScaleChill"
  },
  {
    key: "stock_up",
    labelKey: "household.shoppingScaleStockUp"
  }
] as const;

const stockStatusPriority: Record<HouseholdStockItemListItem["stockStatus"], number> = {
  below_limit: 0,
  at_limit: 1,
  low_soon: 2,
  steady: 3
};

@Component({
  selector: "app-home",
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (!auth.isAuthenticated()) {
      <section class="home-board" aria-labelledby="home-title">
        <div class="pulse-card" [attr.aria-label]="loc.t('home.activityPreview')">
          <div class="pulse-orbit">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="pulse-list">
            <div class="pulse-row strong">
              <span>{{ loc.t("home.milk") }}</span>
              <span>{{ loc.t("home.lowSoon") }}</span>
            </div>
            <div class="pulse-row">
              <span>{{ loc.t("home.rice") }}</span>
              <span>{{ loc.t("home.steady") }}</span>
            </div>
            <div class="pulse-row">
              <span>{{ loc.t("home.coffee") }}</span>
              <span>{{ loc.t("home.watch") }}</span>
            </div>
          </div>
        </div>

        <div class="home-copy">
          <p class="eyebrow">{{ loc.t("home.today") }}</p>
          <h1 id="home-title">{{ loc.t("home.pantryPulse") }}</h1>
          <p>{{ loc.t("home.description") }}</p>

          <dl class="mini-stats">
            <div>
              <dt>{{ loc.t("home.notes") }}</dt>
              <dd>3</dd>
            </div>
            <div>
              <dt>{{ loc.t("home.lists") }}</dt>
              <dd>1</dd>
            </div>
            <div>
              <dt>{{ loc.t("home.sources") }}</dt>
              <dd>0</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="placeholder-grid" [attr.aria-label]="loc.t('home.kamraPreview')">
        <article>
          <p class="card-kicker">{{ loc.t("home.cardQueue") }}</p>
          <h2>{{ loc.t("home.stockingNotes") }}</h2>
          <p>{{ loc.t("home.queueDescription") }}</p>
        </article>

        <article>
          <p class="card-kicker">{{ loc.t("home.cardShape") }}</p>
          <h2>{{ loc.t("home.shoppingPlan") }}</h2>
          <p>{{ loc.t("home.shoppingPlanDescription") }}</p>
        </article>

        <article>
          <p class="card-kicker">{{ loc.t("home.cardOps") }}</p>
          <h2>{{ loc.t("home.sourceReview") }}</h2>
          <p>{{ loc.t("home.opsDescription") }}</p>
        </article>
      </section>
    } @else {
      <section class="stock-workspace" aria-labelledby="home-title">
        <section class="pulse-card stock-pulse" [attr.aria-label]="loc.t('home.activityPreview')">
          <div class="pulse-topline">
            <div>
              <p class="eyebrow">{{ loc.t("home.today") }}</p>
              <h1 id="home-title">{{ loc.t("home.liveTitle") }}</h1>
            </div>

            <button
              class="cart-button"
              type="button"
              [attr.aria-label]="loc.t('household.generateShoppingList')"
              [attr.title]="loc.t('household.generateShoppingList')"
              (click)="showShoppingListPlaceholder()"
            >
              <span aria-hidden="true">🛒+</span>
            </button>
          </div>

          <div class="pulse-control-row">
            <div class="shopping-scale" [attr.aria-label]="loc.t('household.shoppingScale')">
              <input
                class="scale-slider"
                type="range"
                min="0"
                max="2"
                step="1"
                [ngModel]="shoppingScaleIndex()"
                (ngModelChange)="setShoppingScaleIndex($event)"
                [attr.aria-label]="loc.t('household.shoppingScale')"
              />
              <div class="scale-labels" aria-hidden="true">
                @for (option of shoppingScaleOptions; track option.key) {
                  <span [class.active-scale-label]="shoppingScale() === option.key">{{ loc.t(option.labelKey) }}</span>
                }
              </div>
            </div>

            <div class="pulse-orbit pulse-orbit-live">
              <span></span>
              <span></span>
              <span></span>
              <strong>{{ shoppingItemCount() }}</strong>
            </div>
          </div>

          <div class="household-bar">
            <label class="household-select">
              <span>{{ loc.t("household.activeHousehold") }}</span>
              <select
                [ngModel]="selectedHouseholdId()"
                (ngModelChange)="selectHousehold($event)"
                [disabled]="loadState() === 'loading' || households().length === 0"
              >
                @for (household of households(); track household.id) {
                  <option [value]="household.id">{{ household.name }}</option>
                }
              </select>
            </label>

            <button class="ui-button ui-button-quiet ui-button-sm" type="button" (click)="refreshHome()" [disabled]="loadState() === 'loading'">
              {{ loadState() === "loading" ? loc.t("common.loading") : loc.t("common.refresh") }}
            </button>
          </div>

          @if (loadState() === "loading" && !householdPage()) {
            <section class="state-panel">
              <p>{{ loc.t("household.loading") }}</p>
            </section>
          } @else if (errorMessage()) {
            <section class="state-panel state-panel-error">
              <h2>{{ loc.t("household.loadFailure") }}</h2>
              <p>{{ errorMessage() }}</p>
            </section>
          } @else if (!households().length) {
            <section class="state-panel">
              <h2>{{ loc.t("household.noHouseholdTitle") }}</h2>
              <p>{{ loc.t("household.noHouseholdDescription") }}</p>
              <form class="stack-form" (ngSubmit)="createHousehold()">
                <label>
                  <span>{{ loc.t("household.householdName") }}</span>
                  <input
                    type="text"
                    name="householdName"
                    [(ngModel)]="createHouseholdName"
                    [placeholder]="loc.t('household.householdNamePlaceholder')"
                  />
                </label>
                <button class="ui-button ui-button-primary" type="submit" [disabled]="loadState() === 'loading'">
                  {{ loc.t("household.createHousehold") }}
                </button>
              </form>
            </section>
          } @else {
            <div class="stock-table-shell">
              <div class="stock-table-header stock-table-grid" aria-hidden="true">
                <span>{{ loc.t("common.product") }}</span>
                <span>{{ loc.t("household.currentShort") }}</span>
                <span>{{ loc.t("household.compare") }}</span>
                <span>{{ loc.t("household.minShort") }}</span>
                <span>{{ loc.t("common.state") }}</span>
              </div>

              <div class="stock-table-body">
                @for (item of stockItemsByPriority(); track item.id) {
                  <button
                    class="stock-table-row stock-table-grid"
                    type="button"
                    [class.selected-row]="selectedItem()?.id === item.id"
                    (click)="openEditor(item)"
                  >
                    <span class="stock-name">{{ item.displayName }}</span>
                    <span>{{ formatAmount(item.currentAmount, item.unit) }}</span>
                    <span
                      class="relation-symbol"
                      [class.relation-below]="item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'"
                      [class.relation-watch]="item.stockStatus === 'low_soon'"
                      [class.relation-steady]="item.stockStatus === 'steady'"
                    >
                      {{ relationSymbol(item.stockStatus) }}
                    </span>
                    <span>{{ formatAmount(item.minLimit, item.unit) }}</span>
                    <span
                      class="status-badge"
                      [class.status-danger]="item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'"
                      [class.status-watch]="item.stockStatus === 'low_soon'"
                    >
                      {{ loc.t(stockStatusTranslationKey(item.stockStatus)) }}
                    </span>
                  </button>
                } @empty {
                  <p class="empty-copy">{{ loc.t("household.noStockItems") }}</p>
                }
              </div>
            </div>

            <button class="ui-button ui-button-primary add-new-button" type="button" (click)="startCreateItem()">
              {{ loc.t("household.addNewItem") }}
            </button>
          }

          @if (statusMessage()) {
            <p class="status-note">{{ statusMessage() }}</p>
          }
        </section>

        <section class="editor-panel" [attr.aria-label]="loc.t('household.selectedItem')">
          <p class="card-kicker">{{ editorMode() === "create" ? loc.t("household.addNewItem") : loc.t("household.selectedItem") }}</p>
          <h2>{{ editorTitle() }}</h2>

          <form class="stock-form" (ngSubmit)="saveEditor()">
            <label>
              <span>{{ loc.t("common.name") }}</span>
              <input
                type="text"
                name="editorDisplayName"
                [ngModel]="editorDraft.displayName"
                (ngModelChange)="setEditorDisplayName($event)"
                [placeholder]="loc.t('household.stockNamePlaceholder')"
              />
            </label>

            <div class="split-fields">
              <label>
                <span>{{ loc.t("household.currentAmount") }}</span>
                <input type="number" step="0.01" name="editorCurrentAmount" [(ngModel)]="editorDraft.currentAmount" />
              </label>
              <label>
                <span>{{ loc.t("household.minLimit") }}</span>
                <input type="number" step="0.01" name="editorMinLimit" [(ngModel)]="editorDraft.minLimit" />
              </label>
            </div>

            <div class="split-fields">
              <label>
                <span>{{ loc.t("household.unit") }}</span>
                <input type="text" name="editorUnit" [(ngModel)]="editorDraft.unit" />
              </label>
              <label>
                <span>{{ loc.t("household.stockedAt") }}</span>
                <input type="date" name="editorStockedAt" [(ngModel)]="editorDraft.stockedAt" />
              </label>
            </div>

            <button class="details-toggle" type="button" (click)="toggleDetails()">
              <span>{{ detailsOpen() ? loc.t("household.hideAdditionalDetails") : loc.t("household.showAdditionalDetails") }}</span>
              <strong aria-hidden="true">{{ detailsOpen() ? "−" : "+" }}</strong>
            </button>

            @if (detailsOpen()) {
              <div class="additional-details">
                <div class="split-fields">
                  <label>
                    <span>{{ loc.t("household.initialAmountOptional") }}</span>
                    <input type="number" step="0.01" name="editorInitialAmount" [(ngModel)]="editorDraft.initialAmount" />
                  </label>
                  <label>
                    <span>{{ loc.t("household.stockGroupKeyOptional") }}</span>
                    <input type="text" name="editorStockGroupKey" [(ngModel)]="editorDraft.stockGroupKey" />
                  </label>
                </div>

                <label>
                  <span>{{ loc.t("household.gtinOptional") }}</span>
                  <input type="text" name="editorGtin" [(ngModel)]="editorDraft.gtin" inputmode="numeric" />
                </label>

                <div class="split-fields">
                  <label>
                    <span>{{ loc.t("household.sourceNameOptional") }}</span>
                    <input type="text" name="editorSourceName" [(ngModel)]="editorDraft.sourceName" />
                  </label>
                  <label>
                    <span>{{ loc.t("household.sourceProductUrlOptional") }}</span>
                    <input type="url" name="editorSourceProductUrl" [(ngModel)]="editorDraft.sourceProductUrl" />
                  </label>
                </div>

                <label>
                  <span>{{ loc.t("editor.note") }}</span>
                  <textarea name="editorNote" rows="3" [(ngModel)]="editorDraft.note"></textarea>
                </label>
              </div>
            }

            <div class="editor-actions">
              <button class="ui-button ui-button-primary" type="submit" [disabled]="mutationState() === 'saving'">
                {{ mutationState() === "saving" ? loc.t("common.loading") : loc.t("common.save") }}
              </button>
              @if (editorMode() === "edit") {
                <button class="ui-button ui-button-quiet" type="button" (click)="archiveSelectedItem()" [disabled]="mutationState() === 'saving'">
                  {{ loc.t("common.delete") }}
                </button>
              }
            </div>
          </form>
        </section>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: var(--space-7);
        min-height: 100%;
        --scale-usual: #8e979b;
        --scale-chill: #6d91b3;
        --scale-stock-up: #e7b85a;
      }

      :host-context(:root[data-theme="dark"]) {
        --scale-usual: #a8afb1;
        --scale-chill: #86add0;
        --scale-stock-up: #f2c96c;
      }

      .home-board,
      .stock-workspace {
        align-items: stretch;
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(0, 1fr);
      }

      .pulse-card,
      .home-copy,
      article,
      .state-panel,
      .editor-panel {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
      }

      .pulse-card,
      .editor-panel {
        align-content: start;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      .pulse-card {
        background: var(--pulse-card-background);
        min-height: 20rem;
        overflow: hidden;
        position: relative;
      }

      .pulse-card::before {
        animation: scan 2400ms ease-in-out infinite;
        background: linear-gradient(90deg, transparent, var(--pulse-sheen-background), transparent);
        content: "";
        height: 100%;
        left: -60%;
        position: absolute;
        top: 0;
        transform: skewX(-12deg);
        width: 42%;
      }

      .stock-pulse > * {
        position: relative;
        z-index: 1;
      }

      .pulse-topline,
      .household-bar,
      .split-fields,
      .editor-actions {
        align-items: center;
        display: flex;
        gap: var(--space-3);
      }

      .pulse-topline,
      .household-bar {
        justify-content: space-between;
      }

      .pulse-control-row {
        align-items: center;
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(9rem, 0.75fr) minmax(8rem, 1fr);
        min-height: 10rem;
      }

      .pulse-orbit {
        align-items: center;
        display: grid;
        justify-self: center;
        min-height: 10rem;
        place-items: center;
        position: relative;
        width: min(100%, 18rem);
      }

      .pulse-orbit span {
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf) 36%, transparent);
        border-radius: var(--radius-pill);
        box-shadow: 0 1rem 2rem rgb(111 159 33 / 12%);
        position: absolute;
      }

      .pulse-orbit span:nth-child(1) {
        animation: breathe 2200ms ease-in-out infinite;
        background: var(--pulse-core-background);
        height: 4.8rem;
        width: 4.8rem;
      }

      .pulse-orbit span:nth-child(2) {
        animation: breathe 2200ms ease-in-out 240ms infinite;
        height: 7.4rem;
        width: 7.4rem;
      }

      .pulse-orbit span:nth-child(3) {
        animation: breathe 2200ms ease-in-out 480ms infinite;
        height: 10rem;
        width: 10rem;
      }

      .pulse-orbit-live strong {
        color: var(--color-text);
        font-size: 2.65rem;
        line-height: 1;
        position: relative;
        z-index: 1;
      }

      .shopping-scale {
        align-items: center;
        display: grid;
        gap: var(--space-3);
        grid-template-columns: 2.4rem minmax(0, 1fr);
        min-height: 9rem;
      }

      .scale-slider {
        accent-color: var(--scale-chill);
        appearance: slider-vertical;
        height: 8.8rem;
        width: 2.1rem;
      }

      .scale-labels {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.76rem;
        font-weight: 800;
        gap: var(--space-3);
      }

      .active-scale-label {
        color: var(--color-text);
      }

      .cart-button {
        align-items: center;
        background: color-mix(in srgb, var(--color-accent-leaf) 22%, var(--surface-soft-background) 78%);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        cursor: pointer;
        display: inline-flex;
        font-size: 1.35rem;
        font-weight: 900;
        justify-content: center;
        min-height: 2.75rem;
        min-width: 3.4rem;
      }

      .home-copy,
      .state-panel {
        align-content: center;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1.1rem, 3vw, 1.75rem);
      }

      .eyebrow,
      .card-kicker {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      h1,
      h2,
      p,
      dl,
      dd {
        margin: 0;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: 2.55rem;
        line-height: 1.04;
      }

      h2,
      .stock-name,
      .row-title {
        color: var(--color-text);
      }

      .home-copy > p,
      .empty-copy,
      .status-note,
      .state-panel p {
        color: var(--color-text-muted);
        line-height: 1.6;
      }

      .household-select,
      .stock-form label,
      .stack-form label {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.75rem;
        font-weight: 800;
        gap: 0.3rem;
      }

      .household-select {
        min-width: min(22rem, 100%);
      }

      .stock-table-shell {
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        overflow: hidden;
      }

      .stock-table-grid {
        display: grid;
        gap: var(--space-2);
        grid-template-columns: minmax(9rem, 1.5fr) minmax(4.5rem, 0.72fr) 2.4rem minmax(4.5rem, 0.72fr) minmax(6.5rem, 0.9fr);
      }

      .stock-table-header {
        background: color-mix(in srgb, var(--pulse-row-background) 72%, transparent);
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 900;
        padding: 0.55rem 0.75rem;
        text-transform: uppercase;
      }

      .stock-table-body {
        max-height: 18rem;
        overflow: auto;
      }

      .stock-table-row {
        align-items: center;
        background: var(--pulse-row-background);
        border: 0;
        border-bottom: 1px solid var(--pulse-row-border);
        color: var(--pulse-row-text);
        cursor: pointer;
        font: inherit;
        min-height: 3.2rem;
        padding: 0.65rem 0.75rem;
        text-align: left;
        width: 100%;
      }

      .stock-table-row:hover,
      .selected-row {
        background: var(--row-hover-background);
      }

      .stock-name {
        font-weight: 900;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .relation-symbol {
        align-items: center;
        border-radius: var(--radius-ui);
        display: inline-flex;
        font-family: var(--font-mono);
        font-size: 1.1rem;
        font-weight: 900;
        justify-content: center;
        min-height: 2rem;
      }

      .relation-below {
        color: var(--color-status-danger-text);
      }

      .relation-watch {
        color: var(--color-status-warning);
      }

      .relation-steady {
        color: var(--color-accent-leaf-strong);
      }

      .status-badge {
        background: color-mix(in srgb, var(--color-accent-leaf) 12%, var(--surface-soft-background));
        border-radius: var(--radius-ui);
        color: var(--color-text);
        display: inline-flex;
        font-size: 0.72rem;
        font-weight: 900;
        justify-content: center;
        min-height: 1.9rem;
        padding: 0.3rem 0.5rem;
        text-transform: uppercase;
      }

      .status-danger {
        background: color-mix(in srgb, var(--color-status-danger) 14%, var(--surface-soft-background));
      }

      .status-watch {
        background: color-mix(in srgb, var(--color-status-warning) 22%, var(--surface-soft-background));
      }

      .add-new-button {
        justify-self: start;
      }

      .stock-form,
      .stack-form,
      .additional-details {
        display: grid;
        gap: var(--space-3);
      }

      .stock-form input,
      .stock-form textarea,
      .stack-form input,
      .household-select select {
        background: var(--form-field-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.2rem;
        padding: 0.45rem 0.55rem;
      }

      .stock-form textarea {
        min-height: 6rem;
        resize: vertical;
      }

      .split-fields {
        align-items: stretch;
      }

      .split-fields label {
        flex: 1 1 0;
      }

      .details-toggle {
        align-items: center;
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        display: flex;
        font: inherit;
        font-weight: 800;
        justify-content: space-between;
        min-height: 2.4rem;
        padding: 0.45rem 0.65rem;
      }

      .additional-details {
        border-top: 1px solid var(--line-subtle);
        padding-top: var(--space-3);
      }

      .mini-stats {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .mini-stats div {
        background: var(--surface-soft-background);
        border-radius: var(--radius-ui);
        display: grid;
        gap: 0.2rem;
        min-height: 4.6rem;
        padding: 0.8rem;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.74rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      dd {
        color: var(--color-text);
        font-size: 1.4rem;
        font-weight: 700;
      }

      .placeholder-grid {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      article {
        display: grid;
        gap: var(--space-2);
        min-height: 10rem;
        padding: clamp(1rem, 2vw, 1.25rem);
      }

      .state-panel-error {
        border-color: color-mix(in srgb, var(--color-status-danger) 45%, var(--line-panel));
      }

      @keyframes breathe {
        0%,
        100% {
          opacity: 0.55;
          transform: scale(0.94);
        }

        50% {
          opacity: 1;
          transform: scale(1.03);
        }
      }

      @keyframes scan {
        0% {
          left: -60%;
        }

        55%,
        100% {
          left: 118%;
        }
      }

      @media (min-width: 900px) {
        .home-board {
          grid-template-columns: minmax(20rem, 0.85fr) minmax(0, 1.15fr);
        }

        .stock-workspace {
          grid-template-columns: minmax(26rem, 1.2fr) minmax(20rem, 0.8fr);
        }
      }

      @media (max-width: 900px) {
        .placeholder-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 740px) {
        .mini-stats {
          grid-template-columns: 1fr;
        }

        .pulse-topline,
        .household-bar,
        .split-fields,
        .editor-actions {
          align-items: stretch;
          flex-direction: column;
        }

        .pulse-control-row {
          grid-template-columns: 1fr;
        }

        .stock-table-shell {
          overflow-x: auto;
        }

        .stock-table-grid {
          min-width: 38rem;
        }
      }
    `
  ]
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  readonly household = inject(HouseholdStockService);
  readonly loc = inject(LocalizationService);
  private readonly toast = inject(ToastService);

  readonly detailsOpen = signal(false);
  readonly editorMode = signal<EditorMode>("create");
  readonly errorMessage = signal("");
  readonly householdPage = signal<HouseholdStockPage | null>(null);
  readonly households = signal<HouseholdListItem[]>([]);
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly mutationState = signal<"idle" | "saving">("idle");
  readonly selectedHouseholdId = signal<string>("");
  readonly selectedItemId = signal<string | null>(null);
  readonly shoppingScale = signal<ShoppingScale>("chill");
  readonly statusMessage = signal("");
  readonly shoppingScaleOptions = shoppingScaleOptions;
  createHouseholdName = "";
  editorDraft: StockDraft = createEmptyStockDraft();
  private loadSerial = 0;

  readonly stockItems = computed(() => this.householdPage()?.stockItems ?? []);
  readonly stockItemsByPriority = computed(() =>
    [...this.stockItems()].sort((left, right) =>
      stockStatusPriority[left.stockStatus] - stockStatusPriority[right.stockStatus]
      || left.displayName.localeCompare(right.displayName, this.loc.language() === "hu" ? "hu-HU" : "en-US")
    )
  );
  readonly shoppingItems = computed(() =>
    this.stockItemsByPriority().filter((item) => shouldBuyForScale(item.stockStatus, this.shoppingScale()))
  );
  readonly shoppingItemCount = computed(() => this.shoppingItems().length);
  readonly selectedItem = computed(() =>
    this.stockItems().find((item) => item.id === this.selectedItemId()) ?? null
  );
  readonly shoppingScaleIndex = computed(() =>
    shoppingScaleOptions.findIndex((option) => option.key === this.shoppingScale())
  );

  private readonly authWatcher = effect(() => {
    if (!this.auth.token()) {
      this.resetState();
      return;
    }

    void this.loadHouseholdContext();
  });

  async createHousehold(): Promise<void> {
    const name = this.createHouseholdName.trim();
    if (!name) {
      this.toast.push(this.loc.t("household.householdNameRequired"), "warning");
      return;
    }

    this.mutationState.set("saving");
    const result = await this.household.createHousehold(name);
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.createHouseholdName = "";
    this.statusMessage.set(this.loc.t("household.createdHousehold", { name: result.household.name }));
    await this.loadHouseholdContext(result.household.id);
  }

  editorTitle(): string {
    if (this.editorMode() === "create") {
      return this.loc.t("household.addStockTitle");
    }

    return this.selectedItem()?.displayName || this.loc.t("household.editorTitle");
  }

  formatAmount(amount: number, unit: string): string {
    return `${amount.toLocaleString(this.loc.language() === "hu" ? "hu-HU" : "en-US")} ${unit}`;
  }

  openEditor(item: HouseholdStockItemListItem): void {
    this.editorMode.set("edit");
    this.selectedItemId.set(item.id);
    this.detailsOpen.set(false);
    this.editorDraft = stockItemToDraft(item);
  }

  relationSymbol(status: HouseholdStockItemListItem["stockStatus"]): string {
    const symbols: Record<HouseholdStockItemListItem["stockStatus"], string> = {
      at_limit: "=",
      below_limit: "<",
      low_soon: "~",
      steady: ">"
    };

    return symbols[status];
  }

  async archiveSelectedItem(): Promise<void> {
    const item = this.selectedItem();
    if (!item || this.editorMode() !== "edit") {
      return;
    }

    this.mutationState.set("saving");
    const result = await this.household.archiveStockItem({
      householdId: item.householdId,
      id: item.id
    });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.applyLoadedPage(result.page);
    this.startCreateItem();
    this.statusMessage.set(this.loc.t("household.stockArchived"));
  }

  async refreshHome(): Promise<void> {
    await this.loadHouseholdContext(this.selectedHouseholdId() || undefined);
  }

  async saveEditor(): Promise<void> {
    const householdId = this.selectedHouseholdId();
    if (!householdId) {
      return;
    }

    const draft = this.editorDraft;
    if (!draft.displayName.trim() || !draft.unit.trim()) {
      this.toast.push(this.loc.t("household.createDraftInvalid"), "warning");
      return;
    }

    this.mutationState.set("saving");
    const result = this.editorMode() === "create"
      ? await this.household.createStockItem({
          currentAmount: draft.currentAmount,
          displayName: draft.displayName.trim(),
          gtin: nullableTrim(draft.gtin),
          householdId,
          initialAmount: initialAmountForCreate(draft),
          minLimit: draft.minLimit,
          note: nullableTrim(draft.note),
          sourceName: nullableTrim(draft.sourceName),
          sourceProductUrl: nullableTrim(draft.sourceProductUrl),
          stockedAt: toIsoDateTime(draft.stockedAt),
          stockGroupKey: normalizeStockGroupKey(draft.stockGroupKey || draft.displayName),
          unit: draft.unit.trim()
        })
      : await this.household.updateStockItem({
          currentAmount: draft.currentAmount,
          displayName: draft.displayName.trim(),
          gtin: nullableTrim(draft.gtin),
          householdId,
          id: draft.id,
          initialAmount: draft.initialAmount,
          minLimit: draft.minLimit,
          note: nullableTrim(draft.note),
          sourceName: nullableTrim(draft.sourceName),
          sourceProductUrl: nullableTrim(draft.sourceProductUrl),
          stockedAt: toIsoDateTime(draft.stockedAt),
          stockGroupKey: normalizeStockGroupKey(draft.stockGroupKey || draft.displayName),
          unit: draft.unit.trim()
        });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.applyLoadedPage(result.page);
    if (this.editorMode() === "create") {
      this.startCreateItem();
    } else {
      const refreshedItem = result.page.stockItems.find((stockItem) => stockItem.id === draft.id);
      if (refreshedItem) {
        this.openEditor(refreshedItem);
      }
    }
    this.statusMessage.set(this.loc.t("household.stockSaved"));
  }

  async selectHousehold(householdId: string): Promise<void> {
    if (!householdId || householdId === this.selectedHouseholdId()) {
      return;
    }

    this.selectedHouseholdId.set(householdId);
    await this.loadHouseholdPage(householdId, this.loadSerial);
  }

  setEditorDisplayName(value: string): void {
    const previousSlug = normalizeStockGroupKey(this.editorDraft.displayName);
    const nextSlug = normalizeStockGroupKey(value);

    this.editorDraft = {
      ...this.editorDraft,
      displayName: value,
      stockGroupKey: !this.editorDraft.stockGroupKey || this.editorDraft.stockGroupKey === previousSlug
        ? nextSlug
        : this.editorDraft.stockGroupKey
    };
  }

  setShoppingScaleIndex(value: number | string): void {
    const index = Number(value);
    const option = shoppingScaleOptions[index];
    if (option) {
      this.shoppingScale.set(option.key);
    }
  }

  showShoppingListPlaceholder(): void {
    this.toast.push(this.loc.t("household.shoppingListComingSoon"), "info");
  }

  startCreateItem(): void {
    this.editorMode.set("create");
    this.selectedItemId.set(null);
    this.detailsOpen.set(false);
    this.editorDraft = createEmptyStockDraft();
  }

  stockStatusTranslationKey(status: HouseholdStockItemListItem["stockStatus"]): TranslationKey {
    const keys = {
      at_limit: "home.atLimit",
      below_limit: "home.belowLimit",
      low_soon: "home.lowSoon",
      steady: "home.steady"
    } as const;

    return keys[status];
  }

  toggleDetails(): void {
    this.detailsOpen.update((open) => !open);
  }

  private applyLoadedPage(page: HouseholdStockPage): void {
    this.householdPage.set(page);
    this.selectedHouseholdId.set(page.household.id);
    if (this.selectedItemId() && !page.stockItems.some((item) => item.id === this.selectedItemId())) {
      this.startCreateItem();
    }
  }

  private async loadHouseholdContext(preferredHouseholdId?: string): Promise<void> {
    const currentLoad = ++this.loadSerial;
    this.loadState.set("loading");
    this.errorMessage.set("");

    const listResult = await this.household.listHouseholds();
    if (currentLoad !== this.loadSerial) {
      return;
    }

    if (listResult.status !== "ok") {
      this.loadState.set("error");
      this.errorMessage.set(listResult.message);
      return;
    }

    this.households.set(listResult.households);
    if (listResult.households.length === 0) {
      this.householdPage.set(null);
      this.selectedHouseholdId.set("");
      this.loadState.set("ready");
      this.statusMessage.set(this.loc.t("household.noHouseholdDescription"));
      return;
    }

    const nextHouseholdId = preferredHouseholdId
      && listResult.households.some((household) => household.id === preferredHouseholdId)
      ? preferredHouseholdId
      : this.selectedHouseholdId()
          && listResult.households.some((household) => household.id === this.selectedHouseholdId())
        ? this.selectedHouseholdId()
        : listResult.households[0]!.id;

    this.selectedHouseholdId.set(nextHouseholdId);
    await this.loadHouseholdPage(nextHouseholdId, currentLoad);
  }

  private async loadHouseholdPage(householdId: string, loadSerial: number): Promise<void> {
    this.loadState.set("loading");
    this.errorMessage.set("");

    const pageResult = await this.household.loadHouseholdStock(householdId);
    if (loadSerial !== this.loadSerial) {
      return;
    }

    if (pageResult.status !== "ok") {
      this.loadState.set("error");
      this.errorMessage.set(pageResult.message);
      return;
    }

    this.applyLoadedPage(pageResult.page);
    this.loadState.set("ready");
    this.statusMessage.set(this.loc.t("household.loadedHousehold", {
      count: pageResult.page.stockItems.length,
      name: pageResult.page.household.name
    }));
  }

  private resetState(): void {
    this.createHouseholdName = "";
    this.detailsOpen.set(false);
    this.editorMode.set("create");
    this.editorDraft = createEmptyStockDraft();
    this.errorMessage.set("");
    this.householdPage.set(null);
    this.households.set([]);
    this.loadState.set("idle");
    this.mutationState.set("idle");
    this.selectedHouseholdId.set("");
    this.selectedItemId.set(null);
    this.statusMessage.set("");
  }
}

function createEmptyStockDraft(): StockDraft {
  return {
    currentAmount: 0,
    displayName: "",
    gtin: "",
    id: "",
    initialAmount: 0,
    minLimit: 1,
    note: "",
    sourceName: "",
    sourceProductUrl: "",
    stockedAt: todayDateInputValue(),
    stockGroupKey: "",
    unit: "db"
  };
}

function initialAmountForCreate(draft: StockDraft): number {
  return draft.initialAmount > 0 ? draft.initialAmount : draft.currentAmount;
}

function nullableTrim(value: string): string | null {
  return value.trim() || null;
}

function normalizeStockGroupKey(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return slug || "item";
}

function shouldBuyForScale(
  status: HouseholdStockItemListItem["stockStatus"],
  scale: ShoppingScale
): boolean {
  if (scale === "usual") {
    return status === "below_limit" || status === "at_limit";
  }

  if (scale === "chill") {
    return status === "below_limit" || status === "at_limit" || status === "low_soon";
  }

  return true;
}

function stockItemToDraft(item: HouseholdStockItemListItem): StockDraft {
  return {
    currentAmount: item.currentAmount,
    displayName: item.displayName,
    gtin: item.gtin ?? "",
    id: item.id,
    initialAmount: item.initialAmount,
    minLimit: item.minLimit,
    note: item.note ?? "",
    sourceName: item.sourceName ?? "",
    sourceProductUrl: item.sourceProductUrl ?? "",
    stockedAt: item.stockedAt.slice(0, 10),
    stockGroupKey: item.stockGroupKey,
    unit: item.unit
  };
}

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDateTime(dateInput: string): string {
  const trimmed = dateInput.trim();
  return trimmed
    ? new Date(`${trimmed}T12:00:00.000Z`).toISOString()
    : new Date().toISOString();
}
