import {
  Component,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  type OnDestroy
} from "@angular/core";
import { Router } from "@angular/router";

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
  type HouseholdStockDraft,
  type HouseholdStockEditorMode
} from "./household/household-stock-editor.component";
import { HouseholdStockPanelComponent } from "./household/household-stock-panel.component";
import {
  HouseholdShoppingListComponent,
  type HouseholdKnownProduct
} from "./household/household-shopping-list.component";
import { HouseholdShoppingTripPanelComponent } from "./household/household-shopping-trip-panel.component";
import { HouseholdProductEditorComponent } from "./household/household-product-editor.component";
import { HouseholdV2WorkspaceComponent } from "./household/household-v2-workspace.component";
import type {
  HouseholdV2Batch,
  HouseholdV2Product,
  HouseholdV2ProductGroup
} from "./household/household-v2.service";
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

const shoppingScaleDisplayOptions: readonly ShoppingScaleOption[] = [
  ...shoppingScaleOptions
].reverse();

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
    HouseholdPreviewWorkspaceComponent,
    HouseholdShoppingListComponent,
    HouseholdShoppingTripPanelComponent,
    HouseholdProductEditorComponent,
    HouseholdStockPanelComponent,
    HouseholdV2WorkspaceComponent
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.css"
})
export class HomeComponent implements OnDestroy {
  readonly auth = inject(AuthService);
  readonly household = inject(HouseholdStockService);
  readonly loc = inject(LocalizationService);
  readonly pageRail = inject(PageRailService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly editorMode = signal<HouseholdStockEditorMode>("create");
  readonly editorRevision = signal(0);
  readonly errorMessage = signal("");
  readonly householdPage = signal<HouseholdStockPage | null>(null);
  readonly households = signal<HouseholdListItem[]>([]);
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly mutationState = signal<"idle" | "saving">("idle");
  readonly selectedHouseholdId = signal<string>("");
  readonly selectedV2Product = signal<HouseholdV2Product | null>(null);
  readonly selectedV2Group = signal<HouseholdV2ProductGroup | null>(null);
  readonly selectedV2Batch = signal<HouseholdV2Batch | null>(null);
  readonly v2BatchEditorMode = signal(false);
  readonly v2ProductCreateMode = signal(false);
  readonly productEditorRevision = signal(0);
  readonly v2WorkspaceRevision = signal(0);
  readonly selectedItemId = signal<string | null>(null);
  readonly shoppingScale = signal<ShoppingScale>("chill");
  readonly shoppingSelectionMode = signal(false);
  readonly selectedShoppingItemIds = signal<ReadonlySet<string>>(new Set());
  readonly shoppingSelectionCandidates = signal<readonly string[]>([]);
  readonly shoppingSelectionDefaults = signal<readonly string[]>([]);
  readonly shoppingSelectionDirty = signal(false);
  readonly statusMessage = signal("");
  readonly shoppingScaleDisplayOptions = shoppingScaleDisplayOptions;
  readonly shoppingScaleOptions = shoppingScaleOptions;
  readonly shoppingListPanel = signal<HouseholdShoppingListComponent | null>(null);
  readonly v2WorkspaceExpanded = signal(true);
  editorDraftSeed: HouseholdStockDraft = createEmptyStockDraft();
  private loadSerial = 0;

  @ViewChild(HouseholdShoppingListComponent)
  set shoppingListPanelRef(panel: HouseholdShoppingListComponent | undefined) {
    this.shoppingListPanel.set(panel ?? null);
  }

  @ViewChild(HouseholdV2WorkspaceComponent)
  v2Workspace?: HouseholdV2WorkspaceComponent;

  @ViewChild(HouseholdShoppingTripPanelComponent)
  shoppingTripPanel?: HouseholdShoppingTripPanelComponent;

  readonly stockItems = computed(() => this.householdPage()?.stockItems ?? []);
  readonly stockItemsByPriority = computed(() =>
    [...this.stockItems()].sort(
      (left, right) =>
        stockStatusPriority[left.stockStatus] - stockStatusPriority[right.stockStatus] ||
        left.displayName.localeCompare(
          right.displayName,
          this.loc.language() === "hu" ? "hu-HU" : "en-US"
        )
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
    this.previewStockItems().filter((item) =>
      shouldBuyForScale(item.stockStatus, this.shoppingScale())
    )
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
  readonly previewEditorItem = computed<HouseholdPreviewStockItem>(
    () =>
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
    this.stockItemsByPriority().filter((item) =>
      shouldBuyForScale(item.stockStatus, this.shoppingScale())
    )
  );
  readonly knownHouseholdProducts = computed<readonly HouseholdKnownProduct[]>(() => {
    const products = new Map<string, HouseholdKnownProduct>();
    for (const item of this.stockItems()) {
      if (products.has(item.householdProductId)) continue;
      products.set(item.householdProductId, {
        currentAmount: item.currentAmount,
        displayName: item.displayName,
        householdProductId: item.householdProductId,
        idealMaxLimit: item.idealMaxLimit,
        minLimit: item.minLimit,
        stockGroupKey: item.stockGroupKey,
        unit: item.unit
      });
    }
    return [...products.values()];
  });
  readonly selectedShoppingItemIdsArray = computed(() => [...this.selectedShoppingItemIds()]);
  readonly existingShoppingLineItemIds = computed(() => {
    const shoppingList = this.shoppingListPanel()?.shoppingList();
    return new Set(
      shoppingList?.items
        .map((item) => item.householdStockItemId)
        .filter((id): id is string => !!id) ?? []
    );
  });
  readonly shoppingItemCount = computed(() => this.shoppingSelectionCandidates().length);
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
      itemCount: this.shoppingSelectionMode()
        ? this.selectedShoppingItemIds().size
        : this.railShoppingItemCount(),
      itemCountLabel: this.loc.t("household.shoppingBandCount", {
        count: this.shoppingSelectionMode()
          ? this.selectedShoppingItemIds().size
          : this.railShoppingItemCount()
      }),
      actionLabel: this.shoppingSelectionMode()
        ? this.loc.t("household.generateShoppingList")
        : this.loc.t("household.buildShoppingList"),
      actionDisabled:
        !this.auth.isAuthenticated() ||
        !this.selectedHouseholdId() ||
        (!this.shoppingSelectionMode() && Boolean(this.shoppingListPanel()?.shoppingList())),
      onAction: () => {
        if (!this.shoppingSelectionMode()) {
          this.beginShoppingSelection();
          return;
        }
        void this.generateSelectedShoppingList();
      },
      reloadActionLabel: this.loc.t("common.refresh"),
      reloadActionDisabled: !this.auth.isAuthenticated() || !this.selectedHouseholdId(),
      onReloadAction: () => {
        void this.shoppingListPanel()?.reloadShoppingList();
      },
      cancelActionLabel: this.loc.t("household.cancelShoppingList"),
      cancelActionDisabled:
        !this.auth.isAuthenticated() ||
        (!this.shoppingSelectionMode() && !this.shoppingListPanel()?.shoppingList()),
      onCancelAction: () => {
        if (this.shoppingSelectionMode()) {
          this.cancelShoppingSelection();
          return;
        }
        void this.shoppingListPanel()?.cancelShoppingList();
      }
    }
  ]);
  readonly shoppingScaleLabel = computed(() => {
    const key =
      this.shoppingScale() === "start_fresh"
        ? "household.shoppingScaleStartFresh"
        : this.shoppingScale() === "usual"
          ? "household.shoppingScaleUsual"
          : this.shoppingScale() === "chill"
            ? "household.shoppingScaleChill"
            : "household.shoppingScaleStockUp";

    return this.loc.t(key);
  });
  readonly apiShoppingScale = computed<
    "business_as_usual" | "keep_it_chill" | "start_fresh" | "stock_em_up"
  >(() =>
    this.shoppingScale() === "start_fresh"
      ? "start_fresh"
      : this.shoppingScale() === "usual"
        ? "business_as_usual"
        : this.shoppingScale() === "chill"
          ? "keep_it_chill"
          : "stock_em_up"
  );
  readonly selectedItem = computed(
    () => this.stockItems().find((item) => item.id === this.selectedItemId()) ?? null
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

    this.statusMessage.set(
      this.loc.t("household.createdHousehold", { name: result.household.name })
    );
    await this.loadHouseholdContext(result.household.id);
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
    this.editorDraftSeed = stockItemToDraft(item);
    this.editorRevision.update((revision) => revision + 1);
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

  async saveEditor(draft: HouseholdStockDraft): Promise<void> {
    const householdId = this.selectedHouseholdId();
    if (!householdId) {
      return;
    }

    if (!draft.displayName.trim() || !draft.unit.trim()) {
      this.toast.push(this.loc.t("household.createDraftInvalid"), "warning");
      return;
    }

    this.mutationState.set("saving");
    const result =
      this.editorMode() === "create"
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
    this.v2Workspace?.setSectionExpanded(true);
    this.refreshV2Workspace();
    this.statusMessage.set(this.loc.t("household.shoppingListAppliedAndStockRefreshed"));
  }

  async invitationAccepted(householdId: string): Promise<void> {
    await this.router.navigateByUrl(`/household/${encodeURIComponent(householdId)}`);
  }

  setShoppingScaleIndex(value: number | string): void {
    const index = Number(value);
    const option = shoppingScaleOptions[index];
    if (option) {
      this.shoppingScale.set(option.key);
      if (this.shoppingSelectionMode()) this.resetShoppingSelection();
    }
  }

  toggleShoppingItem(id: string): void {
    this.shoppingSelectionDirty.set(true);
    this.selectedShoppingItemIds.update((selected) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  setShoppingSelectionCandidates(ids: readonly string[]): void {
    this.shoppingSelectionCandidates.set(ids);
    const candidates = new Set(ids);
    this.selectedShoppingItemIds.update((selected) => {
      const next = new Set([...selected].filter((id) => candidates.has(id)));
      return next.size === selected.size ? selected : next;
    });
  }
  setShoppingSelectionDefaults(ids: readonly string[]): void {
    this.shoppingSelectionDefaults.set(ids);
    if (this.shoppingSelectionMode() && !this.shoppingSelectionDirty()) {
      this.selectedShoppingItemIds.set(new Set(ids));
    }
  }

  private beginShoppingSelection(): void {
    this.shoppingListPanel()?.collapsePanel();
    this.shoppingTripPanel?.collapsePanel();
    this.v2Workspace?.setSectionExpanded(true);
    this.shoppingSelectionMode.set(true);
    this.resetShoppingSelection();
  }
  private cancelShoppingSelection(reopenWorkspace = true): void {
    this.shoppingSelectionMode.set(false);
    this.shoppingSelectionDirty.set(false);
    this.selectedShoppingItemIds.set(new Set());
    if (reopenWorkspace) {
      this.v2Workspace?.setSectionExpanded(true);
    }
  }

  onShoppingListCancelled(): void {
    this.v2Workspace?.setSectionExpanded(true);
  }
  private resetShoppingSelection(): void {
    this.shoppingSelectionDirty.set(false);
    this.selectedShoppingItemIds.set(new Set(this.shoppingSelectionDefaults()));
  }
  private async generateSelectedShoppingList(): Promise<void> {
    const shoppingListPanel = this.shoppingListPanel();
    await shoppingListPanel?.generateShoppingList();
    if (!shoppingListPanel?.shoppingList()) {
      shoppingListPanel?.expandPanel();
      return;
    }
    this.v2Workspace?.setSectionExpanded(false);
    this.cancelShoppingSelection(false);
  }

  startCreateItem(): void {
    this.editorMode.set("create");
    this.selectedItemId.set(null);
    this.editorDraftSeed = createEmptyStockDraft();
    this.editorRevision.update((revision) => revision + 1);
  }

  selectV2Product(product: HouseholdV2Product): void {
    this.v2BatchEditorMode.set(false);
    this.v2ProductCreateMode.set(false);
    this.selectedV2Batch.set(null);
    this.selectedV2Group.set(null);
    this.selectedV2Product.set(product);
    this.productEditorRevision.update((revision) => revision + 1);
  }

  selectV2Group(group: HouseholdV2ProductGroup): void {
    this.v2BatchEditorMode.set(false);
    this.v2ProductCreateMode.set(false);
    this.selectedV2Batch.set(null);
    this.selectedV2Product.set(null);
    this.selectedV2Group.set(group);
    this.productEditorRevision.update((revision) => revision + 1);
  }

  startV2ProductCreate(group: HouseholdV2ProductGroup | null): void {
    this.v2BatchEditorMode.set(false);
    this.v2ProductCreateMode.set(true);
    this.selectedV2Group.set(group);
    this.selectedV2Product.set(null);
    this.selectedV2Batch.set(null);
    this.productEditorRevision.update((revision) => revision + 1);
  }

  startV2BatchCreate(product: HouseholdV2Product): void {
    this.v2BatchEditorMode.set(true);
    this.v2ProductCreateMode.set(false);
    this.selectedV2Product.set(product);
    this.selectedV2Batch.set(null);
    this.productEditorRevision.update((revision) => revision + 1);
  }

  selectV2Batch(selection: {
    batch: HouseholdV2Batch;
    group: HouseholdV2ProductGroup | null;
    product: HouseholdV2Product;
  }): void {
    this.v2BatchEditorMode.set(true);
    this.v2ProductCreateMode.set(false);
    this.selectedV2Product.set(selection.product);
    this.selectedV2Batch.set(selection.batch);
    this.selectedV2Group.set(selection.group);
    this.productEditorRevision.update((revision) => revision + 1);
  }

  refreshV2Workspace(): void {
    this.v2BatchEditorMode.set(false);
    this.v2ProductCreateMode.set(false);
    this.selectedV2Product.set(null);
    this.selectedV2Group.set(null);
    this.selectedV2Batch.set(null);
    this.v2WorkspaceRevision.update((revision) => revision + 1);
  }

  private applyLoadedPage(page: HouseholdStockPage): void {
    this.householdPage.set(page);
    this.selectedHouseholdId.set(page.household.id);
    if (
      this.selectedItemId() &&
      !page.stockItems.some((item) => item.id === this.selectedItemId())
    ) {
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

    const nextHouseholdId =
      preferredHouseholdId &&
      listResult.households.some((household) => household.id === preferredHouseholdId)
        ? preferredHouseholdId
        : this.selectedHouseholdId() &&
            listResult.households.some((household) => household.id === this.selectedHouseholdId())
          ? this.selectedHouseholdId()
          : listResult.households[0]!.id;

    this.selectedHouseholdId.set(nextHouseholdId);
    await this.loadHouseholdPage(nextHouseholdId, currentLoad);
  }

  private async loadHouseholdPage(householdId: string, loadSerial: number): Promise<void> {
    this.loadState.set("loading");
    this.errorMessage.set("");
    this.statusMessage.set("");

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
  }

  private resetState(): void {
    this.editorMode.set("create");
    this.editorDraftSeed = createEmptyStockDraft();
    this.editorRevision.set(0);
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

function createEmptyStockDraft(): HouseholdStockDraft {
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

function initialAmountForCreate(draft: HouseholdStockDraft): number {
  return draft.initialAmount > 0 ? draft.initialAmount : draft.currentAmount;
}

function nullableTrim(value: string): string | null {
  return value.trim() || null;
}

function nullableNumber(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
    reasonCode:
      item.stockStatus === "below_limit"
        ? "below_minimum"
        : item.stockStatus === "at_limit"
          ? "at_minimum"
          : item.stockStatus === "low_soon"
            ? "low_soon"
            : "broad_restock",
    targetAmount
  };
}

function previewStockItemToHouseholdStockItem(
  item: HouseholdPreviewStockItem
): HouseholdStockItemListItem {
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

function stockItemToDraft(item: HouseholdStockItemListItem): HouseholdStockDraft {
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
  return trimmed ? new Date(`${trimmed}T12:00:00.000Z`).toISOString() : new Date().toISOString();
}
