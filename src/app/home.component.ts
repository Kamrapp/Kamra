import { FormsModule } from "@angular/forms";
import { Component, ViewChild, computed, effect, inject, signal, type OnDestroy } from "@angular/core";

import { AuthService } from "./auth.service";
import {
  HouseholdStockService,
  type HouseholdListItem,
  type HouseholdShoppingList,
  type HouseholdStockItemListItem,
  type HouseholdStockPage
} from "./household/household-stock.service";
import {
  HouseholdPreviewWorkspaceComponent,
  type HouseholdPreviewStockItem
} from "./household/household-preview-workspace.component";
import {
  HouseholdStockEditorComponent,
  type HouseholdStockDraft,
  type HouseholdStockEditorMode
} from "./household/household-stock-editor.component";
import { HouseholdStockPanelComponent } from "./household/household-stock-panel.component";
import { HouseholdShoppingListComponent } from "./household/household-shopping-list.component";
import { LocalizationService, type TranslationKey } from "./shared/localization.service";
import { PageRailService, type PageRailSection } from "./shared/page-rail.service";
import { ToastService } from "./shared/toast.service";

type ShoppingScale = "start_fresh" | "usual" | "chill" | "stock_up";

interface ShoppingScaleOption {
  hintKey: TranslationKey;
  key: ShoppingScale;
  labelKey: TranslationKey;
}

const shoppingScaleOptions: readonly ShoppingScaleOption[] = [
  {
    hintKey: "household.shoppingScaleStartFreshHint",
    key: "start_fresh",
    labelKey: "household.shoppingScaleStartFresh"
  },
  {
    hintKey: "household.shoppingScaleUsualHint",
    key: "usual",
    labelKey: "household.shoppingScaleUsual"
  },
  {
    hintKey: "household.shoppingScaleChillHint",
    key: "chill",
    labelKey: "household.shoppingScaleChill"
  },
  {
    hintKey: "household.shoppingScaleStockUpHint",
    key: "stock_up",
    labelKey: "household.shoppingScaleStockUp"
  }
] as const;

const shoppingScaleDisplayOptions: readonly ShoppingScaleOption[] = [...shoppingScaleOptions].reverse();

const stockStatusPriority: Record<HouseholdStockItemListItem["stockStatus"], number> = {
  below_limit: 0,
  at_limit: 1,
  low_soon: 2,
  steady: 3
};

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    FormsModule,
    HouseholdPreviewWorkspaceComponent,
    HouseholdShoppingListComponent,
    HouseholdStockEditorComponent,
    HouseholdStockPanelComponent
  ],
  template: `
    @if (!auth.isAuthenticated()) {
      <app-household-preview-workspace
        [previewStockItems]="previewStockItems()"
        [previewEditorItem]="previewEditorItem()"
        [demoShoppingList]="demoShoppingList()"
        [shoppingScale]="apiShoppingScale()"
      />
    } @else {
      <section class="stock-workspace" aria-labelledby="home-title">
        <app-household-stock-panel
          [errorMessage]="errorMessage()"
          [existingShoppingLineItemIds]="existingShoppingLineItemIds()"
          [hasExistingShoppingList]="!!shoppingListPanel?.shoppingList()"
          [hasHouseholdPage]="!!householdPage()"
          [highlightedItemIds]="highlightedStockItemIds()"
          [households]="households()"
          [loadState]="loadState()"
          [selectedHouseholdId]="selectedHouseholdId()"
          [selectedItemId]="selectedItem()?.id ?? null"
          [statusMessage]="statusMessage()"
          [stockItems]="stockItemsByPriority()"
          (createHouseholdRequested)="createHousehold($event)"
          (householdSelected)="selectHousehold($event)"
          (itemSelected)="openEditor($event)"
          (refreshRequested)="refreshHome()"
          (shoppingListAddRequested)="addStockItemToShoppingList($event, shoppingListPanel)"
        />

        <app-household-stock-editor
          [draftInput]="editorDraftSeed"
          [mode]="editorMode()"
          [revision]="editorRevision()"
          [saving]="mutationState() === 'saving'"
          (archiveRequested)="archiveSelectedItem()"
          (saveRequested)="saveEditor($event)"
          (startCreateRequested)="startCreateItem()"
        />

        <app-household-shopping-list
          #shoppingListPanel
          class="shopping-bottom-row"
          [householdId]="selectedHouseholdId()"
          [shoppingScale]="apiShoppingScale()"
          (stockPageUpdated)="applyShoppingListStockPage($event)"
        />
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: var(--space-7);
        min-height: 100%;
        --scale-start-fresh: #6f8f3a;
        --scale-usual: #e5bd55;
        --scale-chill: #e98f39;
        --scale-stock-up: #d94c3c;
      }

      :host-context(:root[data-theme="dark"]) {
        --scale-start-fresh: #96b760;
        --scale-usual: #f2d47a;
        --scale-chill: #f2a855;
        --scale-stock-up: #ec6758;
      }

      .stock-workspace {
        align-items: stretch;
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(0, 1fr);
      }

      .stock-panel,
      .state-panel,
      .editor-panel {
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-panel-shadow);
      }

      .stock-panel,
      .editor-panel {
        align-content: start;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      .panel-topline,
      .household-bar,
      .household-picker-group,
      .split-fields,
      .editor-actions {
        align-items: end;
        display: flex;
        gap: var(--space-3);
      }

      .panel-topline,
      .household-bar {
        justify-content: space-between;
      }

      .shopping-bottom-row {
        grid-column: 1 / -1;
      }

      .icon-button {
        min-width: 2.35rem;
        padding-inline: 0;
      }

      .icon-button span {
        display: inline-flex;
        font-size: 1rem;
        font-weight: 900;
        justify-content: center;
        width: 100%;
      }

      .state-panel {
        align-content: center;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1.1rem, 3vw, 1.75rem);
      }

      h2,
      p {
        margin: 0;
      }

      .panel-title {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      h2,
      .stock-name,
      .row-title {
        color: var(--color-text);
      }

      .status-note {
        color: var(--color-text-muted);
        line-height: 0;
      }

      .empty-copy,
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

      .manage-household-button,
      .add-new-stock-button {
        flex: 0 1 auto;
        min-width: max-content;
        white-space: nowrap;
      }

      .stock-table-shell {
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        overflow: hidden;
      }

      .stock-table-grid {
        align-items: center;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: minmax(0, 1fr) 2.35rem;
      }

      .stock-table-header {
        align-items: center;
        background: color-mix(in srgb, var(--pulse-row-background) 72%, transparent);
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.66rem;
        font-weight: 900;
        gap: 0.55rem;
        grid-template-columns: minmax(0, 1fr) 2.35rem;
        line-height: 1;
        min-height: 2.25rem;
        padding: 0.45rem 0.65rem;
        text-transform: uppercase;
      }

      .stock-header-main,
      .stock-row-main {
        align-items: center;
        display: grid;
        gap: 0.55rem;
        grid-template-columns: minmax(8rem, 1.5fr) minmax(4.25rem, 0.72fr) 1.8rem minmax(4.25rem, 0.72fr) minmax(5.5rem, 0.9fr);
        min-width: 0;
      }

      .stock-header-main span,
      .stock-header-add {
        line-height: 1.1;
        white-space: nowrap;
      }

      .stock-header-add {
        justify-self: center;
      }

      .stock-table-body {
        max-height: 18rem;
        overflow: auto;
      }

      .stock-table-row {
        align-items: center;
        background: var(--pulse-row-background);
        border-bottom: 1px solid var(--pulse-row-border);
        color: var(--pulse-row-text);
        min-height: 2.65rem;
        padding: 0.42rem 0.65rem;
      }

      .stock-table-row:hover,
      .selected-row {
        background: var(--row-hover-background);
      }

      .shopping-candidate-row {
        background: color-mix(in srgb, var(--color-accent-leaf) 16%, var(--pulse-row-background));
      }

      .stock-row-main {
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 0;
        min-width: 0;
        padding: 0;
        text-align: left;
        width: 100%;
      }

      .stock-list-add {
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        font: inherit;
        font-size: 0.92rem;
        font-weight: 900;
        line-height: 1;
        min-height: 2rem;
        min-width: 2.15rem;
        padding: 0;
      }

      .stock-list-add:disabled {
        cursor: not-allowed;
        opacity: 0.68;
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
        font-size: 0.98rem;
        font-weight: 900;
        justify-content: center;
        line-height: 1;
        min-height: 1.55rem;
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
        align-self: center;
        background: color-mix(in srgb, var(--color-accent-leaf) 12%, var(--surface-soft-background));
        border-radius: var(--radius-ui);
        color: var(--color-text);
        display: inline-flex;
        font-size: 0.88rem;
        font-weight: 900;
        justify-content: center;
        justify-self: start;
        line-height: 1;
        min-height: 1.45rem;
        padding: 0.24rem 0.45rem;
        text-transform: uppercase;
        white-space: nowrap;
        width: max-content;
      }

      .status-danger {
        background: color-mix(in srgb, var(--color-status-danger) 14%, var(--surface-soft-background));
      }

      .status-watch {
        background: color-mix(in srgb, var(--color-status-warning) 22%, var(--surface-soft-background));
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

      .amount-stepper {
        display: grid;
        gap: 0.35rem;
        grid-template-columns: 2.35rem minmax(0, 1fr) 2.35rem;
      }

      .amount-stepper button {
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        font: inherit;
        font-size: 1rem;
        font-weight: 900;
        min-height: 2.2rem;
        padding: 0;
      }

      .amount-stepper button:hover,
      .amount-stepper button:focus-visible {
        border-color: var(--line-strong);
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
        justify-content: center;
        min-height: 2.4rem;
        padding: 0.45rem;
      }

      .additional-details {
        border-top: 1px solid var(--line-subtle);
        padding-top: var(--space-3);
      }

      .state-panel-error {
        border-color: color-mix(in srgb, var(--color-status-danger) 45%, var(--line-panel));
      }

      @media (min-width: 900px) {
        .stock-workspace {
          grid-template-columns: minmax(26rem, 1.2fr) minmax(20rem, 0.8fr);
          grid-template-rows: auto auto auto;
        }
      }

      @media (max-width: 740px) {
        .panel-topline,
        .household-bar,
        .household-picker-group,
        .split-fields,
        .editor-actions {
          align-items: stretch;
          flex-direction: column;
        }

        .stock-table-shell {
          overflow-x: auto;
        }

        .stock-table-grid,
        .stock-row-main {
          min-width: 40rem;
        }

        .stock-header-main {
          min-width: 40rem;
        }
      }
    `
  ]
})
export class HomeComponent implements OnDestroy {
  readonly auth = inject(AuthService);
  readonly household = inject(HouseholdStockService);
  readonly loc = inject(LocalizationService);
  readonly pageRail = inject(PageRailService);
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
  readonly shoppingScaleDisplayOptions = shoppingScaleDisplayOptions;
  readonly shoppingScaleOptions = shoppingScaleOptions;
  readonly shoppingListPanel = signal<HouseholdShoppingListComponent | null>(null);
  editorDraft: StockDraft = createEmptyStockDraft();
  private loadSerial = 0;

  @ViewChild(HouseholdShoppingListComponent)
  set shoppingListPanelRef(panel: HouseholdShoppingListComponent | undefined) {
    this.shoppingListPanel.set(panel ?? null);
  }

  readonly stockItems = computed(() => this.householdPage()?.stockItems ?? []);
  readonly stockItemsByPriority = computed(() =>
    [...this.stockItems()].sort((left, right) =>
      stockStatusPriority[left.stockStatus] - stockStatusPriority[right.stockStatus]
      || left.displayName.localeCompare(right.displayName, this.loc.language() === "hu" ? "hu-HU" : "en-US")
    )
  );
  readonly previewStockItems = computed<HouseholdPreviewStockItem[]>(() => [
    {
      currentAmount: 0.6,
      displayName: this.loc.t("home.milk"),
      id: "preview_milk",
      minLimit: 1,
      stockStatus: "low_soon",
      unit: "l"
    },
    {
      currentAmount: 2,
      displayName: this.loc.t("home.rice"),
      id: "preview_rice",
      minLimit: 1,
      stockStatus: "steady",
      unit: "kg"
    },
    {
      currentAmount: 0,
      displayName: this.loc.t("home.coffee"),
      id: "preview_coffee",
      minLimit: 1,
      stockStatus: "below_limit",
      unit: "bag"
    }
  ]);
  readonly previewShoppingItems = computed(() =>
    this.previewStockItems().filter((item) => shouldBuyForScale(item.stockStatus, this.shoppingScale()))
  );
  readonly demoShoppingList = computed<HouseholdShoppingList>(() => ({
    createdAt: "2026-07-10T12:00:00.000Z",
    createdByUserId: "preview_user",
    householdId: "preview_household",
    id: "preview_shopping_list",
    items: this.previewShoppingItems().map((item) => {
      const planning = createShoppingLinePlanning(previewStockItemToHouseholdStockItem(item));
      return {
        currentAmount: item.currentAmount,
        displayName: item.displayName,
        householdProductId: `preview_product_${item.id}`,
        householdStockItemId: item.id,
        id: `preview_line_${item.id}`,
        idealMaxLimit: null,
        minLimit: item.minLimit,
        observedPrice: null,
        plannedAmount: planning.plannedAmount,
        purchasedAmount: 0,
        reasonCode: planning.reasonCode,
        sourceKind: "generated",
        status: "not_applied",
        stockGroupKey: item.id,
        stockStatus: item.stockStatus,
        suggestedBuyAmount: planning.plannedAmount,
        targetAmount: planning.targetAmount,
        ticked: false,
        uncertaintyFlags: ["missing_catalog_product", "missing_product_source"],
        unit: item.unit
      };
    }),
    scale: this.apiShoppingScale(),
    schemaVersion: "demo",
    shopId: null,
    status: "active",
    stockAppliedAt: todayDateInputValue(),
    updatedAt: "2026-07-10T12:00:00.000Z",
    updatedByUserId: "preview_user"
  }));
  readonly previewEditorItem = computed<HouseholdPreviewStockItem>(() =>
    this.previewStockItems()[0] ?? {
      currentAmount: 0,
      displayName: this.loc.t("home.milk"),
      id: "preview_fallback",
      minLimit: 1,
      stockStatus: "low_soon",
      unit: "l"
    }
  );
  readonly shoppingItems = computed(() =>
    this.stockItemsByPriority().filter((item) => shouldBuyForScale(item.stockStatus, this.shoppingScale()))
  );
  readonly highlightedStockItemIds = computed(() =>
    new Set(this.shoppingItems().map((item) => item.id))
  );
  readonly existingShoppingLineItemIds = computed(() => {
    const shoppingList = this.shoppingListPanel()?.shoppingList();
    return new Set(shoppingList?.items.map((item) => item.householdStockItemId).filter((id): id is string => !!id) ?? []);
  });
  readonly shoppingItemCount = computed(() => this.shoppingItems().length);
  readonly railShoppingItemCount = computed(() =>
    this.auth.isAuthenticated() ? this.shoppingItemCount() : this.previewShoppingItems().length
  );
  readonly pageRailSections = computed<PageRailSection[]>(() => [
    {
      key: "home-shopping-controls",
      kind: "shopping",
      kicker: this.loc.t("household.shoppingListKicker"),
      title: this.loc.t("household.shoppingScale"),
      scaleIndex: this.shoppingScaleIndex(),
      scaleOptions: shoppingScaleDisplayOptions.map((option) => ({
        key: option.key,
        label: this.loc.t(option.labelKey),
        hint: this.loc.t(option.hintKey),
        active: this.shoppingScale() === option.key
      })),
      onScaleIndexChange: (value) => this.setShoppingScaleIndex(value),
      itemCount: this.railShoppingItemCount(),
      itemCountLabel: this.loc.t("household.shoppingBandCount", { count: this.railShoppingItemCount() }),
      actionLabel: this.shoppingListPanel()?.shoppingList()
        ? this.loc.t("household.regenerateShoppingList")
        : this.loc.t("household.generateShoppingList"),
      actionDisabled: !this.auth.isAuthenticated() || !this.selectedHouseholdId(),
      onAction: () => {
        void this.shoppingListPanel()?.generateShoppingList();
      },
      reloadActionLabel: this.loc.t("common.refresh"),
      reloadActionDisabled: !this.auth.isAuthenticated() || !this.selectedHouseholdId(),
      onReloadAction: () => {
        void this.shoppingListPanel()?.reloadShoppingList();
      },
      cancelActionLabel: this.loc.t("household.cancelShoppingList"),
      cancelActionDisabled: !this.auth.isAuthenticated() || !this.shoppingListPanel()?.shoppingList(),
      onCancelAction: () => {
        void this.shoppingListPanel()?.cancelShoppingList();
      }
    }
  ]);
  readonly shoppingScaleLabel = computed(() => {
    const key = this.shoppingScale() === "start_fresh"
      ? "household.shoppingScaleStartFresh"
      : this.shoppingScale() === "usual"
        ? "household.shoppingScaleUsual"
        : this.shoppingScale() === "chill"
          ? "household.shoppingScaleChill"
          : "household.shoppingScaleStockUp";

    return this.loc.t(key);
  });
  readonly apiShoppingScale = computed<"business_as_usual" | "keep_it_chill" | "start_fresh" | "stock_em_up">(() =>
    this.shoppingScale() === "start_fresh"
      ? "start_fresh"
      : this.shoppingScale() === "usual"
        ? "business_as_usual"
        : this.shoppingScale() === "chill"
          ? "keep_it_chill"
          : "stock_em_up"
  );
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
  private readonly syncPageRail = effect(() => {
    this.pageRail.setSections(this.pageRailSections());
  });

  ngOnDestroy(): void {
    this.pageRail.clearSections();
  }

  async createHousehold(requestedName: string): Promise<void> {
    const name = requestedName.trim();
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

    this.statusMessage.set(this.loc.t("household.createdHousehold", { name: result.household.name }));
    await this.loadHouseholdContext(result.household.id);
  }

  editorTitle(): string {
    if (this.editorMode() === "create") {
      return this.loc.t("household.addStockTitle");
    }

    return this.selectedItem()?.displayName || this.loc.t("household.editorTitle");
  }

  async addStockItemToShoppingList(
    item: HouseholdStockItemListItem,
    shoppingListPanel: HouseholdShoppingListComponent
  ): Promise<void> {
    await shoppingListPanel.addStockItemFromHouseholdStock(item, createShoppingLinePlanning(item));
  }

  openEditor(item: HouseholdStockItemListItem): void {
    this.editorMode.set("edit");
    this.selectedItemId.set(item.id);
    this.detailsOpen.set(false);
    this.editorDraft = stockItemToDraft(item);
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
        idealMaxLimit: nullableNumber(draft.idealMaxLimit),
        initialAmount: initialAmountForCreate(draft),
        minLimit: draft.minLimit,
        note: nullableTrim(draft.note),
        productSourceId: nullableTrim(draft.productSourceId),
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
        idealMaxLimit: nullableNumber(draft.idealMaxLimit),
        initialAmount: draft.initialAmount,
        minLimit: draft.minLimit,
        note: nullableTrim(draft.note),
        productSourceId: nullableTrim(draft.productSourceId),
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

  applyShoppingListStockPage(page: HouseholdStockPage): void {
    this.applyLoadedPage(page);
    this.statusMessage.set(this.loc.t("household.shoppingListAppliedAndStockRefreshed"));
  }

  adjustEditorMinLimit(delta: number): void {
    this.editorDraft = {
      ...this.editorDraft,
      minLimit: clampAmount(this.editorDraft.minLimit + delta)
    };
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

  startCreateItem(): void {
    this.editorMode.set("create");
    this.selectedItemId.set(null);
    this.detailsOpen.set(false);
    this.editorDraft = createEmptyStockDraft();
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
      count: pageResult.page.stockItems.length
    }));
  }

  private resetState(): void {
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
    idealMaxLimit: null,
    initialAmount: 0,
    minLimit: 1,
    note: "",
    productSourceId: "",
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

function clampAmount(value: number): number {
  const finiteValue = Number.isFinite(value) ? value : 0;

  return Math.max(0, Number(finiteValue.toFixed(2)));
}

function nullableTrim(value: string): string | null {
  return value.trim() || null;
}

function nullableNumber(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
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
  if (scale === "start_fresh") {
    return false;
  }

  if (scale === "usual") {
    return status === "below_limit" || status === "at_limit";
  }

  if (scale === "chill") {
    return status === "below_limit" || status === "at_limit" || status === "low_soon";
  }

  return true;
}

function createShoppingLinePlanning(item: HouseholdStockItemListItem): {
  plannedAmount: number;
  reasonCode: "at_minimum" | "below_minimum" | "broad_restock" | "low_soon";
  targetAmount: number;
} {
  const targetAmount = item.idealMaxLimit ?? item.minLimit * 2;
  const suggestedBuyAmount = Math.max(0, targetAmount - item.currentAmount);

  return {
    plannedAmount: suggestedBuyAmount,
    reasonCode: item.stockStatus === "below_limit"
      ? "below_minimum"
      : item.stockStatus === "at_limit"
        ? "at_minimum"
        : item.stockStatus === "low_soon"
          ? "low_soon"
          : "broad_restock",
    targetAmount
  };
}

function previewStockItemToHouseholdStockItem(item: HouseholdPreviewStockItem): HouseholdStockItemListItem {
  return {
    createdAt: "2026-07-10T12:00:00.000Z",
    currentAmount: item.currentAmount,
    displayName: item.displayName,
    householdId: "preview_household",
    householdProductId: `preview_product_${item.id}`,
    id: item.id,
    initialAmount: item.currentAmount,
    minLimit: item.minLimit,
    status: "active",
    stockedAt: "2026-07-10T12:00:00.000Z",
    stockGroupKey: item.id,
    stockStatus: item.stockStatus,
    unit: item.unit,
    updatedAt: "2026-07-10T12:00:00.000Z"
  };
}

function stockItemToDraft(item: HouseholdStockItemListItem): StockDraft {
  return {
    currentAmount: item.currentAmount,
    displayName: item.displayName,
    gtin: item.gtin ?? "",
    id: item.id,
    idealMaxLimit: item.idealMaxLimit ?? null,
    initialAmount: item.initialAmount,
    minLimit: item.minLimit,
    note: item.note ?? "",
    productSourceId: item.productSourceId ?? "",
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
