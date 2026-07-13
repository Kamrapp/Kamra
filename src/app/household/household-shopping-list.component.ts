import { FormsModule } from "@angular/forms";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
  type OnChanges,
  type SimpleChanges
} from "@angular/core";

import {
  HouseholdStockService,
  type HouseholdShop,
  type HouseholdShoppingList,
  type HouseholdShoppingListLine,
  type HouseholdStockItemListItem,
  type HouseholdStockPage
} from "./household-stock.service";
import {
  ShoppingListCompletionPanelComponent,
  type ShoppingListCompletionMode
} from "./shopping-list-completion-panel.component";
import {
  ShoppingListLineComponent,
  type ShoppingListLineChange
} from "./shopping-list-line.component";
import { LocalizationService } from "../shared/localization.service";
import { ToastService } from "../shared/toast.service";
import { BrowserLoggerService } from "../browser-logger.service";

interface QuickAddDraft {
  displayName: string;
  purchasedAmount: number;
  unit: string;
}

interface PendingConfirmation {
  allowedModes: ShoppingListCompletionMode[];
}

@Component({
  selector: "app-household-shopping-list",
  standalone: true,
  imports: [FormsModule, ShoppingListCompletionPanelComponent, ShoppingListLineComponent],
  templateUrl: "./household-shopping-list.component.html",
  styleUrl: "./household-shopping-list.component.css"
})
export class HouseholdShoppingListComponent implements OnChanges {
  @Input({ required: true }) householdId = "";
  @Input() demoShoppingList: HouseholdShoppingList | null = null;
  @Input() shoppingScale: HouseholdShoppingList["scale"] = "keep_it_chill";
  @Input() selectedOwnerIds: readonly string[] | null = null;
  @Output() stockPageUpdated = new EventEmitter<HouseholdStockPage>();

  readonly loc = inject(LocalizationService);
  private readonly household = inject(HouseholdStockService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(BrowserLoggerService);

  readonly defaultCurrencyCode = "HUF";
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  readonly mutationState = signal<"idle" | "saving">("idle");
  readonly pendingConfirmation = signal<PendingConfirmation | null>(null);
  readonly purchasedSectionCollapsed = signal(true);
  readonly sectionCollapsed = signal(true);
  readonly quickAddDraft = signal<QuickAddDraft>({
    displayName: "",
    purchasedAmount: 1,
    unit: "db"
  });
  readonly shoppingScaleValue = signal<HouseholdShoppingList["scale"]>("keep_it_chill");
  readonly shoppingList = signal<HouseholdShoppingList | null>(null);
  readonly shops = signal<HouseholdShop[]>([]);
  readonly statusMessage = signal("");
  readonly shoppingScaleLabel = computed(() => {
    const key =
      this.shoppingScaleValue() === "business_as_usual"
        ? "household.shoppingScaleUsual"
        : this.shoppingScaleValue() === "keep_it_chill"
          ? "household.shoppingScaleChill"
          : this.shoppingScaleValue() === "start_fresh"
            ? "household.shoppingScaleStartFresh"
            : "household.shoppingScaleStockUp";

    return this.loc.t(key);
  });
  readonly pendingItems = computed(() =>
    [...(this.shoppingList()?.items ?? [])]
      .filter((item) => !item.ticked)
      .sort(compareShoppingLines)
  );
  readonly purchasedItems = computed(() =>
    [...(this.shoppingList()?.items ?? [])].filter((item) => item.ticked).sort(compareShoppingLines)
  );
  readonly stockAppliedAt = signal(todayDateInputValue());
  private loadSerial = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["shoppingScale"]) {
      this.shoppingScaleValue.set(changes["shoppingScale"].currentValue ?? "keep_it_chill");
    }

    if (changes["demoShoppingList"]) {
      this.applyDemoShoppingList();
      return;
    }

    if (this.demoShoppingList) {
      return;
    }

    if (changes["householdId"]?.currentValue) {
      void this.loadPanelState();
    }
  }

  isReadOnly(): boolean {
    return this.demoShoppingList !== null;
  }

  async addManualLine(): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    const draft = this.quickAddDraft();
    if (!list) {
      this.toast.push(this.loc.t("household.generateShoppingList"), "info");
      return;
    }

    if (!draft.displayName.trim() || !draft.unit.trim()) {
      this.toast.push(this.loc.t("household.quickAddInvalid"), "warning");
      return;
    }

    const displayName = draft.displayName.trim();
    const stockGroupKey = normalizeStockGroupKey(displayName);
    if (list.items.some((item) => normalizeStockGroupKey(item.displayName) === stockGroupKey)) {
      this.logger.log("info", "Shopping list item already added", { displayName });
      return;
    }

    const manualLine: HouseholdShoppingListLine = {
      currentAmount: 0,
      displayName,
      id: `manual_${Date.now()}_${stockGroupKey}`,
      idealMaxLimit: null,
      minLimit: 0,
      observedPrice: null,
      plannedAmount: coerceNumber(draft.purchasedAmount, 1),
      purchasedAmount: coerceNumber(draft.purchasedAmount, 1),
      reasonCode: null,
      sourceKind: "manual",
      status: "not_applied",
      stockGroupKey,
      suggestedBuyAmount: coerceNumber(draft.purchasedAmount, 1),
      targetAmount: coerceNumber(draft.purchasedAmount, 1),
      ticked: false,
      uncertaintyFlags: ["missing_catalog_product", "missing_product_source"],
      unit: draft.unit.trim()
    };
    const nextItems = [...list.items, manualLine];

    this.quickAddDraft.set({
      displayName: "",
      purchasedAmount: 1,
      unit: draft.unit.trim()
    });
    await this.persistShoppingList(
      {
        ...list,
        items: nextItems
      },
      this.loc.t("household.quickAddSaved")
    );
  }

  async applyPurchasedItems(
    confirmationMode?: "tick_all_and_update" | "update_ticked_only"
  ): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      return;
    }

    this.mutationState.set("saving");
    this.errorMessage.set("");
    const result = await this.household.updateShoppingListStocks({
      confirmationMode: confirmationMode ?? null,
      householdId: list.householdId,
      id: list.id,
      stockAppliedAt: this.stockAppliedAt()
    });
    this.mutationState.set("idle");

    if (result.status === "confirmation_required") {
      this.pendingConfirmation.set({
        allowedModes: result.allowedConfirmationModes
      });
      this.shoppingList.set(result.shoppingList);
      return;
    }

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.pendingConfirmation.set(null);
    this.shoppingList.set(result.shoppingList);
    this.sectionCollapsed.set(false);
    this.stockPageUpdated.emit(result.householdStockPage);
    this.statusMessage.set(
      this.loc.t("household.shoppingListApplySuccess", { count: result.appliedLineCount })
    );
  }

  async changeShop(shopId: string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      return;
    }

    await this.persistShoppingList({
      ...list,
      shopId: shopId || null
    });
  }

  async generateShoppingList(): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    if (!this.householdId) {
      return;
    }

    this.mutationState.set("saving");
    this.errorMessage.set("");
    const result = await this.household.createShoppingList({
      householdId: this.householdId,
      selectedOwnerIds: this.selectedOwnerIds ? [...this.selectedOwnerIds] : undefined,
      scale: this.shoppingScaleValue(),
      shopId: this.shoppingList()?.shopId ?? null
    });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.pendingConfirmation.set(null);
    this.shoppingList.set(result.shoppingList);
    this.stockAppliedAt.set(readPreferredStockAppliedAt(result.shoppingList.stockAppliedAt));
    this.statusMessage.set(
      this.loc.t("household.shoppingListGenerated", { count: result.shoppingList.items.length })
    );
  }

  async cancelShoppingList(): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      return;
    }

    this.pendingConfirmation.set(null);
    this.mutationState.set("saving");
    const result = await this.household.updateShoppingList({
      householdId: list.householdId,
      id: list.id,
      status: "archived"
    });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.shoppingList.set(null);
    this.sectionCollapsed.set(true);
    this.stockAppliedAt.set(todayDateInputValue());
    this.statusMessage.set(this.loc.t("household.shoppingListCancelled"));
  }

  async reloadShoppingList(): Promise<void> {
    if (this.isReadOnly()) {
      this.applyDemoShoppingList();
      return;
    }

    await this.loadPanelState();
  }

  async handleLineChange(
    item: HouseholdShoppingListLine,
    change: ShoppingListLineChange
  ): Promise<void> {
    switch (change.kind) {
      case "observedPriceAmount":
        await this.updateObservedPriceAmount(item.id, change.value);
        return;
      case "observedPriceCurrency":
        await this.updateObservedPriceCurrency(item.id, change.value);
        return;
      case "plannedAmount":
        await this.updateLineNumber(item.id, "plannedAmount", change.value);
        return;
      case "purchasedAmount":
        await this.updateLineNumber(item.id, "purchasedAmount", change.value);
        return;
      case "ticked":
        await this.toggleTicked(item.id, change.value);
        return;
      case "unit":
        await this.updateLineText(item.id, "unit", change.value);
        return;
    }
  }

  async toggleTicked(id: string, ticked: boolean): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    if (ticked) {
      this.purchasedSectionCollapsed.set(true);
    }

    await this.updateLine(id, (item) => ({
      ...item,
      purchasedAmount:
        ticked && item.purchasedAmount === 0 ? item.plannedAmount : item.purchasedAmount,
      ticked
    }));
  }

  togglePurchasedSection(): void {
    this.purchasedSectionCollapsed.update((collapsed) => !collapsed);
  }

  hasShoppingLineForStockItem(stockItemId: string): boolean {
    return (this.shoppingList()?.items ?? []).some(
      (item) => item.householdStockItemId === stockItemId
    );
  }

  notifyReceiptUploadComingSoon(): void {
    this.toast.push(this.loc.t("household.receiptUploadComingSoon"), "info");
  }

  async addStockItemFromHouseholdStock(
    item: HouseholdStockItemListItem,
    planning: {
      plannedAmount: number;
      reasonCode: HouseholdShoppingListLine["reasonCode"];
      targetAmount: number;
    }
  ): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    const list = this.shoppingList();
    if (!list) {
      this.toast.push(this.loc.t("household.shoppingListAddRequiresExisting"), "info");
      return;
    }

    if (this.hasShoppingLineForStockItem(item.id)) {
      return;
    }

    const manualLine: HouseholdShoppingListLine = {
      catalogProductId: item.catalogProductId ?? null,
      catalogProductNameSnapshot: item.catalogProductNameSnapshot ?? null,
      currentAmount: item.currentAmount,
      displayName: item.displayName,
      gtin: item.gtin ?? null,
      householdProductId: item.householdProductId,
      householdStockItemId: item.id,
      id: `manual_stock_${Date.now()}_${normalizeStockGroupKey(item.displayName)}`,
      idealMaxLimit: item.idealMaxLimit ?? null,
      minLimit: item.minLimit,
      observedPrice: null,
      plannedAmount: Math.max(0, planning.plannedAmount),
      productSourceId: item.productSourceId ?? null,
      purchasedAmount: 0,
      reasonCode: planning.reasonCode,
      sourceKind: "manual",
      sourceName: item.sourceName ?? null,
      sourceProductUrl: item.sourceProductUrl ?? null,
      status: "not_applied",
      stockGroupKey: item.stockGroupKey,
      stockStatus: item.stockStatus,
      suggestedBuyAmount: Math.max(0, planning.plannedAmount),
      targetAmount: planning.targetAmount,
      ticked: false,
      uncertaintyFlags: [
        ...(item.catalogProductId ? [] : ["missing_catalog_product" as const]),
        ...(item.productSourceId ? [] : ["missing_product_source" as const])
      ],
      unit: item.unit
    };

    await this.persistShoppingList(
      {
        ...list,
        items: [...list.items, manualLine]
      },
      this.loc.t("household.shoppingListAddItemSuccess", { name: item.displayName })
    );
  }

  async updateLineNumber(
    id: string,
    field: "plannedAmount" | "purchasedAmount",
    value: number | string
  ): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      [field]: coerceNumber(value, item[field])
    }));
  }

  async updateLineText(id: string, field: "unit", value: string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      [field]: value
    }));
  }

  async updateObservedPriceAmount(id: string, value: number | string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      observedPrice:
        value === "" || value === null
          ? null
          : {
              amount: Math.max(0, Math.round(coerceNumber(value, item.observedPrice?.amount ?? 0))),
              currencyCode: item.observedPrice?.currencyCode ?? this.defaultCurrencyCode,
              observedAt: item.observedPrice?.observedAt ?? toObservedAt(this.stockAppliedAt())
            }
    }));
  }

  async updateObservedPriceCurrency(id: string, value: string): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    await this.updateLine(id, (item) => ({
      ...item,
      observedPrice: {
        amount: item.observedPrice?.amount ?? 0,
        currencyCode: value.trim() || this.defaultCurrencyCode,
        observedAt: item.observedPrice?.observedAt ?? toObservedAt(this.stockAppliedAt())
      }
    }));
  }

  updateQuickAddAmount(value: number | string): void {
    this.quickAddDraft.update((draft) => ({
      ...draft,
      purchasedAmount: coerceNumber(value, draft.purchasedAmount)
    }));
  }

  updateQuickAddText(value: string): void {
    this.quickAddDraft.update((draft) => ({
      ...draft,
      displayName: value
    }));
  }

  updateQuickAddUnit(value: string): void {
    this.quickAddDraft.update((draft) => ({
      ...draft,
      unit: value
    }));
  }

  setStockAppliedDate(value: string): void {
    this.stockAppliedAt.set(value || todayDateInputValue());
  }

  private applyDemoShoppingList(): void {
    const demoList = this.demoShoppingList;
    if (!demoList) {
      return;
    }

    this.errorMessage.set("");
    this.loadState.set("ready");
    this.mutationState.set("idle");
    this.pendingConfirmation.set(null);
    this.purchasedSectionCollapsed.set(true);
    this.shoppingList.set(demoList);
    this.shops.set([]);
    this.stockAppliedAt.set(readPreferredStockAppliedAt(demoList.stockAppliedAt));
    this.statusMessage.set("");
  }

  private async loadPanelState(): Promise<void> {
    if (this.isReadOnly()) {
      this.applyDemoShoppingList();
      return;
    }

    if (!this.householdId) {
      this.shoppingList.set(null);
      this.sectionCollapsed.set(true);
      this.shops.set([]);
      return;
    }

    const currentLoad = ++this.loadSerial;
    this.loadState.set("loading");
    this.errorMessage.set("");
    this.statusMessage.set("");
    this.pendingConfirmation.set(null);

    const [listResult, shopsResult] = await Promise.all([
      this.household.loadLatestShoppingList(this.householdId),
      this.household.listShops()
    ]);
    if (currentLoad !== this.loadSerial) {
      return;
    }

    if (shopsResult.status === "ok") {
      this.shops.set(shopsResult.shops);
    }

    if (listResult.status === "ok") {
      this.shoppingList.set(listResult.shoppingList);
      if (listResult.shoppingList) this.sectionCollapsed.set(false);
      this.purchasedSectionCollapsed.set(true);
      this.stockAppliedAt.set(readPreferredStockAppliedAt(listResult.shoppingList.stockAppliedAt));
      this.loadState.set("ready");
      return;
    }

    if (listResult.status === "not_found") {
      this.shoppingList.set(null);
      this.stockAppliedAt.set(todayDateInputValue());
      this.loadState.set("ready");
      return;
    }

    this.loadState.set("error");
    this.errorMessage.set(listResult.message);
  }

  private async persistShoppingList(
    nextList: HouseholdShoppingList,
    successMessage?: string
  ): Promise<void> {
    if (this.isReadOnly()) {
      return;
    }

    this.shoppingList.set(nextList);
    this.pendingConfirmation.set(null);
    this.mutationState.set("saving");
    const result = await this.household.updateShoppingList({
      householdId: nextList.householdId,
      id: nextList.id,
      items: nextList.items,
      shopId: nextList.shopId ?? null
    });
    this.mutationState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.shoppingList.set(result.shoppingList);
    this.statusMessage.set(successMessage ?? this.loc.t("household.shoppingListSaved"));
  }

  private async updateLine(
    id: string,
    updater: (item: HouseholdShoppingListLine) => HouseholdShoppingListLine
  ): Promise<void> {
    const list = this.shoppingList();
    if (!list) {
      return;
    }

    const nextList: HouseholdShoppingList = {
      ...list,
      items: list.items.map((item) => (item.id === id ? updater(item) : item))
    };
    await this.persistShoppingList(nextList);
  }
}

function coerceNumber(value: number | string, fallback: number): number {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
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

function readPreferredStockAppliedAt(stockAppliedAt: string | null | undefined): string {
  return stockAppliedAt?.slice(0, 10) || todayDateInputValue();
}

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toObservedAt(dateInput: string): string {
  const trimmed = dateInput.trim();
  return trimmed ? new Date(`${trimmed}T12:00:00.000Z`).toISOString() : new Date().toISOString();
}

function compareShoppingLines(
  left: HouseholdShoppingListLine,
  right: HouseholdShoppingListLine
): number {
  return left.displayName.localeCompare(right.displayName, "hu-HU");
}
