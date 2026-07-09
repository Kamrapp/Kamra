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

interface CreateStockDraft {
  currentAmount: number;
  displayName: string;
  initialAmount: number;
  minLimit: number;
  note: string;
  stockGroupKey: string;
  stockedAt: string;
  unit: string;
}

interface EditStockDraft {
  currentAmount: number;
  displayName: string;
  id: string;
  initialAmount: number;
  minLimit: number;
  note: string;
  stockedAt: string;
  stockGroupKey: string;
  unit: string;
}

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
      <section class="home-board live-board" aria-labelledby="home-title">
        <div class="pulse-card" [attr.aria-label]="loc.t('home.activityPreview')">
          <div class="pulse-orbit pulse-orbit-live">
            <span></span>
            <span></span>
            <span></span>
            <strong>{{ lowSoonItems().length }}</strong>
            <small>{{ loc.t("home.lowSoon") }}</small>
          </div>

          <div class="pulse-list">
            @for (item of pulsePreviewItems(); track item.id) {
              <div class="pulse-row" [class.strong]="item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'">
                <span>{{ item.displayName }}</span>
                <span>{{ loc.t(stockStatusTranslationKey(item.stockStatus)) }}</span>
              </div>
            } @empty {
              <div class="pulse-row">
                <span>{{ loc.t("home.allSteady") }}</span>
                <span>{{ loc.t("home.steady") }}</span>
              </div>
            }
          </div>
        </div>

        <div class="home-copy">
          <p class="eyebrow">{{ loc.t("home.today") }}</p>
          <h1 id="home-title">{{ loc.t("home.liveTitle") }}</h1>
          <p>{{ loc.t("home.liveDescription") }}</p>

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

          <dl class="mini-stats">
            <div>
              <dt>{{ loc.t("home.lowSoon") }}</dt>
              <dd>{{ lowSoonItems().length }}</dd>
            </div>
            <div>
              <dt>{{ loc.t("household.allStock") }}</dt>
              <dd>{{ stockItems().length }}</dd>
            </div>
            <div>
              <dt>{{ loc.t("household.customProducts") }}</dt>
              <dd>{{ localProductCount() }}</dd>
            </div>
          </dl>

          @if (statusMessage()) {
            <p class="status-note">{{ statusMessage() }}</p>
          }
        </div>
      </section>

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
      } @else if (householdPage(); as page) {
        <section class="manager-grid" [attr.aria-label]="loc.t('household.stockManager')">
          <article class="manager-card">
            <p class="card-kicker">{{ loc.t("household.lowSoon") }}</p>
            <h2>{{ loc.t("household.pulseTitle") }}</h2>
            <div class="chip-list">
              @for (item of lowSoonItems(); track item.id) {
                <button class="stock-chip" type="button" (click)="openEditor(item)">
                  <span>{{ item.displayName }}</span>
                  <strong>{{ formatAmount(item.currentAmount, item.unit) }}</strong>
                </button>
              } @empty {
                <p class="empty-copy">{{ loc.t("household.allSteadyDescription") }}</p>
              }
            </div>
          </article>

          <article class="manager-card">
            <p class="card-kicker">{{ loc.t("household.customStocks") }}</p>
            <h2>{{ loc.t("household.addStockTitle") }}</h2>
            <form class="stock-form" (ngSubmit)="createStockItem()">
              <label>
                <span>{{ loc.t("common.name") }}</span>
                <input
                  type="text"
                  name="createDisplayName"
                  [ngModel]="createStockDraft.displayName"
                  (ngModelChange)="setCreateDisplayName($event)"
                  [placeholder]="loc.t('household.stockNamePlaceholder')"
                />
              </label>

              <div class="split-fields">
                <label>
                  <span>{{ loc.t("household.unit") }}</span>
                  <input type="text" name="createUnit" [(ngModel)]="createStockDraft.unit" />
                </label>
                <label>
                  <span>{{ loc.t("household.stockedAt") }}</span>
                  <input type="date" name="createStockedAt" [(ngModel)]="createStockDraft.stockedAt" />
                </label>
              </div>

              <div class="split-fields">
                <label>
                  <span>{{ loc.t("household.currentAmount") }}</span>
                  <input type="number" step="0.01" name="createCurrentAmount" [(ngModel)]="createStockDraft.currentAmount" />
                </label>
                <label>
                  <span>{{ loc.t("household.minLimit") }}</span>
                  <input type="number" step="0.01" name="createMinLimit" [(ngModel)]="createStockDraft.minLimit" />
                </label>
              </div>

              <label>
                <span>{{ loc.t("household.stockGroupKey") }}</span>
                <input type="text" name="createStockGroupKey" [(ngModel)]="createStockDraft.stockGroupKey" />
              </label>

              <label>
                <span>{{ loc.t("editor.note") }}</span>
                <textarea name="createNote" rows="3" [(ngModel)]="createStockDraft.note"></textarea>
              </label>

              <button class="ui-button ui-button-primary" type="submit" [disabled]="mutationState() === 'saving'">
                {{ mutationState() === "saving" ? loc.t("common.loading") : loc.t("household.addCustomStock") }}
              </button>
            </form>
          </article>
        </section>

        <section class="inventory-grid">
          <article class="manager-card inventory-card">
            <div class="inventory-header">
              <div>
                <p class="card-kicker">{{ loc.t("household.stockManager") }}</p>
                <h2>{{ loc.t("household.allStock") }}</h2>
              </div>
            </div>

            <div class="inventory-list">
              @for (item of stockItems(); track item.id) {
                <button class="inventory-row" type="button" (click)="openEditor(item)">
                  <div>
                    <p class="row-title">{{ item.displayName }}</p>
                    <p class="row-subtitle">{{ formatAmount(item.currentAmount, item.unit) }} / {{ formatAmount(item.minLimit, item.unit) }}</p>
                  </div>
                  <span class="status-badge" [class.status-danger]="item.stockStatus === 'below_limit' || item.stockStatus === 'at_limit'" [class.status-watch]="item.stockStatus === 'low_soon'">
                    {{ loc.t(stockStatusTranslationKey(item.stockStatus)) }}
                  </span>
                </button>
              } @empty {
                <p class="empty-copy">{{ loc.t("household.noStockItems") }}</p>
              }
            </div>
          </article>

          <article class="manager-card">
            <p class="card-kicker">{{ loc.t("household.selectedItem") }}</p>
            <h2>{{ selectedItem()?.displayName || loc.t("household.editorTitle") }}</h2>

            @if (selectedItem()) {
              <form class="stock-form" (ngSubmit)="saveSelectedItem()">
                <label>
                  <span>{{ loc.t("common.name") }}</span>
                  <input type="text" name="editDisplayName" [(ngModel)]="editDraft.displayName" />
                </label>

                <div class="split-fields">
                  <label>
                    <span>{{ loc.t("household.currentAmount") }}</span>
                    <input type="number" step="0.01" name="editCurrentAmount" [(ngModel)]="editDraft.currentAmount" />
                  </label>
                  <label>
                    <span>{{ loc.t("household.minLimit") }}</span>
                    <input type="number" step="0.01" name="editMinLimit" [(ngModel)]="editDraft.minLimit" />
                  </label>
                </div>

                <div class="split-fields">
                  <label>
                    <span>{{ loc.t("household.initialAmount") }}</span>
                    <input type="number" step="0.01" name="editInitialAmount" [(ngModel)]="editDraft.initialAmount" />
                  </label>
                  <label>
                    <span>{{ loc.t("household.unit") }}</span>
                    <input type="text" name="editUnit" [(ngModel)]="editDraft.unit" />
                  </label>
                </div>

                <div class="split-fields">
                  <label>
                    <span>{{ loc.t("household.stockedAt") }}</span>
                    <input type="date" name="editStockedAt" [(ngModel)]="editDraft.stockedAt" />
                  </label>
                  <label>
                    <span>{{ loc.t("household.stockGroupKey") }}</span>
                    <input type="text" name="editStockGroupKey" [(ngModel)]="editDraft.stockGroupKey" />
                  </label>
                </div>

                <label>
                  <span>{{ loc.t("editor.note") }}</span>
                  <textarea name="editNote" rows="3" [(ngModel)]="editDraft.note"></textarea>
                </label>

                <div class="editor-actions">
                  <button class="ui-button ui-button-primary" type="submit" [disabled]="mutationState() === 'saving'">
                    {{ mutationState() === "saving" ? loc.t("common.loading") : loc.t("common.save") }}
                  </button>
                  <button class="ui-button ui-button-quiet" type="button" (click)="archiveSelectedItem()" [disabled]="mutationState() === 'saving'">
                    {{ loc.t("common.delete") }}
                  </button>
                </div>
              </form>
            } @else {
              <p class="empty-copy">{{ loc.t("household.selectItemDescription") }}</p>
            }
          </article>
        </section>
      }
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: var(--space-7);
        min-height: 100%;
      }

      .home-board {
        align-items: stretch;
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(0, 1fr);
      }

      .pulse-card,
      .home-copy,
      article,
      .state-panel {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
      }

      .pulse-card {
        background: var(--pulse-card-background);
        display: grid;
        gap: var(--space-5);
        min-height: 20rem;
        overflow: hidden;
        padding: clamp(1rem, 3vw, 1.5rem);
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

      .pulse-orbit {
        align-items: center;
        align-self: center;
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

      .pulse-orbit-live strong,
      .pulse-orbit-live small {
        position: relative;
        z-index: 1;
      }

      .pulse-orbit-live strong {
        color: var(--color-text);
        font-size: clamp(1.8rem, 6vw, 2.8rem);
        line-height: 1;
      }

      .pulse-orbit-live small {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .pulse-list,
      .chip-list,
      .inventory-list,
      .stock-form,
      .stack-form {
        display: grid;
        gap: var(--space-2);
      }

      .pulse-row,
      .stock-chip,
      .inventory-row {
        align-items: center;
        background: var(--pulse-row-background);
        border: 1px solid var(--pulse-row-border);
        border-radius: var(--radius-ui);
        color: var(--pulse-row-text);
        display: flex;
        justify-content: space-between;
        min-height: 3rem;
        padding: 0.7rem 0.9rem;
      }

      .pulse-row.strong {
        font-weight: 700;
      }

      .home-copy,
      .manager-card,
      .state-panel {
        align-content: start;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1.1rem, 3vw, 1.75rem);
      }

      .eyebrow,
      .card-kicker {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
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
        font-size: clamp(2rem, 5vw, 3.2rem);
        line-height: 1.04;
      }

      h2,
      .row-title {
        color: var(--color-text);
      }

      .home-copy > p,
      .empty-copy,
      .row-subtitle,
      .status-note,
      .state-panel p {
        color: var(--color-text-muted);
        line-height: 1.6;
      }

      .household-bar,
      .split-fields,
      .editor-actions,
      .inventory-header {
        align-items: center;
        display: flex;
        gap: var(--space-3);
      }

      .household-bar,
      .inventory-header {
        justify-content: space-between;
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

      .placeholder-grid,
      .manager-grid,
      .inventory-grid {
        display: grid;
        gap: var(--space-4);
      }

      .placeholder-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .manager-grid,
      .inventory-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      article {
        display: grid;
        gap: var(--space-2);
        min-height: 10rem;
      }

      .stock-form input,
      .stock-form textarea,
      .stack-form input,
      .household-select select {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.2rem;
        padding: 0.45rem 0.55rem;
      }

      .stock-form textarea {
        min-height: 6.5rem;
        resize: vertical;
      }

      .split-fields {
        align-items: stretch;
      }

      .split-fields label {
        flex: 1 1 0;
      }

      .stock-chip,
      .inventory-row {
        cursor: pointer;
        text-align: left;
      }

      .inventory-row {
        background: var(--surface-soft-background);
      }

      .status-badge {
        background: color-mix(in srgb, var(--color-accent-leaf) 12%, white);
        border-radius: var(--radius-pill);
        color: var(--color-text);
        font-size: 0.76rem;
        font-weight: 800;
        padding: 0.3rem 0.6rem;
        text-transform: uppercase;
      }

      .status-danger {
        background: color-mix(in srgb, #d86248 16%, white);
      }

      .status-watch {
        background: color-mix(in srgb, #e2b84c 24%, white);
      }

      .state-panel-error {
        border-color: color-mix(in srgb, #d86248 45%, var(--line-panel));
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
      }

      @media (max-width: 900px) {
        .manager-grid,
        .inventory-grid,
        .placeholder-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 740px) {
        .mini-stats {
          grid-template-columns: 1fr;
        }

        .household-bar,
        .split-fields,
        .editor-actions,
        .inventory-header {
          align-items: stretch;
          flex-direction: column;
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

  readonly editorItemId = signal<string | null>(null);
  readonly errorMessage = signal("");
  readonly householdPage = signal<HouseholdStockPage | null>(null);
  readonly households = signal<HouseholdListItem[]>([]);
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly mutationState = signal<"idle" | "saving">("idle");
  readonly selectedHouseholdId = signal<string>("");
  readonly statusMessage = signal("");
  createHouseholdName = "";
  createStockDraft: CreateStockDraft = createEmptyCreateStockDraft();
  editDraft: EditStockDraft = createEmptyEditStockDraft();
  private loadSerial = 0;

  readonly stockItems = computed(() => this.householdPage()?.stockItems ?? []);
  readonly lowSoonItems = computed(() =>
    this.stockItems().filter((item) => item.stockStatus !== "steady")
  );
  readonly pulsePreviewItems = computed(() => this.lowSoonItems().slice(0, 5));
  readonly localProductCount = computed(() => this.householdPage()?.localProducts.length ?? 0);
  readonly selectedItem = computed(() =>
    this.stockItems().find((item) => item.id === this.editorItemId()) ?? null
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

  async createStockItem(): Promise<void> {
    const householdId = this.selectedHouseholdId();
    if (!householdId) {
      return;
    }

    const draft = this.createStockDraft;
    if (!draft.displayName.trim() || !draft.unit.trim()) {
      this.toast.push(this.loc.t("household.createDraftInvalid"), "warning");
      return;
    }

    this.mutationState.set("saving");
    const result = await this.household.createStockItem({
      currentAmount: draft.currentAmount,
      displayName: draft.displayName.trim(),
      householdId,
      initialAmount: draft.currentAmount,
      minLimit: draft.minLimit,
      note: draft.note.trim() || null,
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
    this.createStockDraft = createEmptyCreateStockDraft();
    this.statusMessage.set(this.loc.t("household.stockSaved"));
  }

  formatAmount(amount: number, unit: string): string {
    return `${amount.toLocaleString(this.loc.language() === "hu" ? "hu-HU" : "en-US")} ${unit}`;
  }

  openEditor(item: HouseholdStockItemListItem): void {
    this.editorItemId.set(item.id);
    this.editDraft = {
      currentAmount: item.currentAmount,
      displayName: item.displayName,
      id: item.id,
      initialAmount: item.initialAmount,
      minLimit: item.minLimit,
      note: item.note ?? "",
      stockedAt: item.stockedAt.slice(0, 10),
      stockGroupKey: item.stockGroupKey,
      unit: item.unit
    };
  }

  async archiveSelectedItem(): Promise<void> {
    const item = this.selectedItem();
    if (!item) {
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

    this.editorItemId.set(null);
    this.editDraft = createEmptyEditStockDraft();
    this.applyLoadedPage(result.page);
    this.statusMessage.set(this.loc.t("household.stockArchived"));
  }

  async refreshHome(): Promise<void> {
    await this.loadHouseholdContext(this.selectedHouseholdId() || undefined);
  }

  async saveSelectedItem(): Promise<void> {
    const item = this.selectedItem();
    if (!item) {
      return;
    }

    const draft = this.editDraft;
    if (!draft.displayName.trim() || !draft.unit.trim()) {
      this.toast.push(this.loc.t("household.editDraftInvalid"), "warning");
      return;
    }

    this.mutationState.set("saving");
    const result = await this.household.updateStockItem({
      currentAmount: draft.currentAmount,
      displayName: draft.displayName.trim(),
      householdId: item.householdId,
      id: draft.id,
      initialAmount: draft.initialAmount,
      minLimit: draft.minLimit,
      note: draft.note.trim() || null,
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
    const refreshedItem = result.page.stockItems.find((stockItem) => stockItem.id === draft.id);
    if (refreshedItem) {
      this.openEditor(refreshedItem);
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

  setCreateDisplayName(value: string): void {
    const previousSlug = normalizeStockGroupKey(this.createStockDraft.displayName);
    const nextSlug = normalizeStockGroupKey(value);

    this.createStockDraft = {
      ...this.createStockDraft,
      displayName: value,
      stockGroupKey: !this.createStockDraft.stockGroupKey || this.createStockDraft.stockGroupKey === previousSlug
        ? nextSlug
        : this.createStockDraft.stockGroupKey
    };
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

  private applyLoadedPage(page: HouseholdStockPage): void {
    this.householdPage.set(page);
    this.selectedHouseholdId.set(page.household.id);
    if (this.editorItemId() && !page.stockItems.some((item) => item.id === this.editorItemId())) {
      this.editorItemId.set(null);
      this.editDraft = createEmptyEditStockDraft();
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
    this.createStockDraft = createEmptyCreateStockDraft();
    this.editDraft = createEmptyEditStockDraft();
    this.editorItemId.set(null);
    this.errorMessage.set("");
    this.householdPage.set(null);
    this.households.set([]);
    this.loadState.set("idle");
    this.mutationState.set("idle");
    this.selectedHouseholdId.set("");
    this.statusMessage.set("");
  }
}

function createEmptyCreateStockDraft(): CreateStockDraft {
  return {
    currentAmount: 0,
    displayName: "",
    initialAmount: 0,
    minLimit: 1,
    note: "",
    stockGroupKey: "",
    stockedAt: todayDateInputValue(),
    unit: "db"
  };
}

function createEmptyEditStockDraft(): EditStockDraft {
  return {
    currentAmount: 0,
    displayName: "",
    id: "",
    initialAmount: 0,
    minLimit: 0,
    note: "",
    stockedAt: todayDateInputValue(),
    stockGroupKey: "",
    unit: ""
  };
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

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDateTime(dateInput: string): string {
  const trimmed = dateInput.trim();
  return trimmed
    ? new Date(`${trimmed}T12:00:00.000Z`).toISOString()
    : new Date().toISOString();
}
