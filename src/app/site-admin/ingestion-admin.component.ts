import {
  Component,
  computed,
  effect,
  inject,
  signal,
  type OnDestroy,
  type OnInit
} from "@angular/core";

import { AuthService } from "../auth.service";
import { BrowserLoggerService } from "../browser-logger.service";
import {
  IngestionAdminService,
  productReviewDecisionReasons,
  type IngestionProductReviewItem,
  type IngestionRowPreview,
  type IngestionSnapshotListItem,
  type ProductReviewCandidateDraft,
  type ProductReviewDecisionReason
} from "./ingestion-admin.service";
import {
  ResizableTableComponent,
  type ResizableTableColumn
} from "../shared/resizable-table.component";
import { PageRailService, type PageRailSection } from "../shared/page-rail.service";
import { ProductEditorDialogComponent } from "../shared/product-editor-dialog.component";
import { TableIconButtonComponent } from "../shared/table-icon-button.component";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";
import { IngestionSnapshotTableComponent } from "./ingestion-snapshot-table.component";

@Component({
  imports: [
    IngestionSnapshotTableComponent,
    ProductEditorDialogComponent,
    ResizableTableComponent,
    TableIconButtonComponent
  ],
  selector: "app-ingestion-admin",
  standalone: true,
  templateUrl: "./ingestion-admin.component.html",
  styleUrl: "./ingestion-admin.component.css"
})
export class IngestionAdminComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly logger = inject(BrowserLoggerService);
  readonly ingestion = inject(IngestionAdminService);
  readonly loc = inject(LocalizationService);
  readonly pageRail = inject(PageRailService);
  readonly snapshotColumns = computed<readonly ResizableTableColumn[]>(() => [
    { key: "source", label: this.loc.t("common.source"), minWidth: 80, maxWidth: 640, width: 180 },
    {
      key: "captured",
      label: this.loc.t("common.captured"),
      minWidth: 80,
      maxWidth: 640,
      width: 120
    },
    { key: "rows", label: this.loc.t("common.rows"), minWidth: 60, maxWidth: 640, width: 70 },
    { key: "state", label: this.loc.t("common.state"), minWidth: 80, maxWidth: 640, width: 120 }
  ]);
  readonly rowColumns = computed<readonly ResizableTableColumn[]>(() => [
    { key: "actions", label: "", minWidth: 120, maxWidth: 220, width: 150 },
    {
      key: "product",
      label: this.loc.t("common.product"),
      minWidth: 120,
      maxWidth: 820,
      width: 360
    },
    { key: "key", label: this.loc.t("common.key"), minWidth: 60, maxWidth: 540, width: 100 },
    { key: "price", label: this.loc.t("common.price"), minWidth: 60, maxWidth: 540, width: 100 },
    {
      key: "validity",
      label: this.loc.t("common.validity"),
      minWidth: 130,
      maxWidth: 540,
      width: 180
    },
    { key: "status", label: this.loc.t("common.state"), minWidth: 90, maxWidth: 220, width: 120 },
    {
      key: "match",
      label: this.loc.t("crawl.matchConfidence"),
      minWidth: 110,
      maxWidth: 280,
      width: 150
    }
  ]);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "success" | "error">("idle");
  readonly processState = signal<"idle" | "loading">("idle");
  readonly crawlListWidthPercent = signal(42);
  readonly currentSnapshotPage = signal(0);
  readonly hasNextSnapshotPage = signal(true);
  readonly snapshotListScrollTop = signal(0);
  readonly snapshotPageSize = signal(25);
  readonly showAcceptedItems = signal(false);
  readonly snapshots = signal<IngestionSnapshotListItem[]>([]);
  readonly statusMessage = signal("");
  readonly selectedSnapshotId = signal<string | null>(null);
  readonly editingReviewItem = signal<IngestionProductReviewItem | null>(null);
  readonly reviewEditorOpen = signal(false);
  readonly decliningReviewId = signal<string | null>(null);
  readonly decliningReviewReason = signal<ProductReviewDecisionReason>("bad_name");
  readonly reviewItemsBySnapshot = signal<Record<string, IngestionProductReviewItem[]>>({});
  readonly crawlSourceFilterTouched = signal(false);
  readonly crawlSourceNames = signal<string[]>([]);
  readonly selectedCrawlSources = signal<Set<string>>(new Set());
  readonly selectedSnapshot = computed(
    () =>
      this.snapshots().find((snapshot) => snapshot.id === this.selectedSnapshotId()) ??
      this.snapshots()[0] ??
      null
  );
  readonly pendingSnapshots = computed(
    () =>
      this.snapshots().filter((snapshot) => snapshot.processingState?.state !== "processed").length
  );
  readonly totalRows = computed(() =>
    this.snapshots().reduce((total, snapshot) => total + snapshot.parsedRowCount, 0)
  );
  readonly crawlSourceOptions = computed(() =>
    this.crawlSourceNames().map((sourceName) => ({
      key: sourceName,
      label: sourceName
    }))
  );
  readonly pageRailSections = computed<PageRailSection[]>(() => {
    const sections: PageRailSection[] = [
      {
        key: "crawl-summary",
        kind: "summary",
        kicker: this.loc.t("common.siteAdmin"),
        title: this.loc.t("common.siteAdmin"),
        items: [
          { label: this.loc.t("crawl.snapshots"), value: `${this.snapshots().length}` },
          { label: this.loc.t("common.rows"), value: `${this.totalRows()}` },
          { label: this.loc.t("common.pending"), value: `${this.pendingSnapshots()}` }
        ],
        actionLabel:
          this.loadState() === "loading"
            ? this.loc.t("common.loading")
            : this.loc.t("common.refresh"),
        actionDisabled: this.loadState() === "loading",
        error: this.errorMessage() || undefined,
        onAction: () => {
          void this.loadSnapshots();
        }
      }
    ];

    if (!this.auth.token()) {
      sections.push({
        key: "crawl-auth",
        kind: "status",
        kicker: this.loc.t("common.adminOnly"),
        message: this.loc.t("crawl.signIn")
      });
      return sections;
    }

    const snapshot = this.selectedSnapshot();
    if (
      this.loadState() === "loading" ||
      this.crawlSourceOptions().length ||
      this.crawlSourceFilterTouched()
    ) {
      const allSourcesSelected =
        this.selectedCrawlSources().size === this.crawlSourceOptions().length;
      sections.push({
        key: "crawl-sources",
        kind: "filters",
        kicker: this.loc.t("crawl.crawlSources"),
        loading: this.loadState() === "loading" && !this.crawlSourceOptions().length,
        placeholderRows: 4,
        title: this.loc.t("common.sources"),
        selectedCount: this.selectedCrawlSources().size,
        optionCount: this.crawlSourceOptions().length || 4,
        secondaryActionLabel: this.crawlSourceOptions().length
          ? allSourcesSelected
            ? this.loc.t("common.deselectAll")
            : this.loc.t("common.selectAll")
          : undefined,
        onSecondaryAction: this.crawlSourceOptions().length
          ? () => this.toggleAllCrawlSources()
          : undefined,
        note: this.loc.t("crawl.loadedNote", { count: this.snapshots().length }),
        options: this.crawlSourceOptions().map((source) => ({
          key: source.key,
          label: source.label,
          checked: this.selectedCrawlSources().has(source.key),
          onToggle: () => this.toggleCrawlSource(source.key)
        }))
      });
    }

    if (snapshot) {
      sections.push({
        key: "crawl-selected",
        kind: "summary",
        kicker: snapshot.workflowName,
        title: snapshot.sourceName,
        items: [
          { label: this.loc.t("common.captured"), value: this.formatDateTime(snapshot.capturedAt) },
          {
            label: this.loc.t("common.parser"),
            value: `${snapshot.parserName} ${snapshot.parserVersion}`
          },
          { label: this.loc.t("common.content"), value: snapshot.contentType },
          { label: this.loc.t("common.processing"), value: this.processingStateLabel(snapshot) }
        ],
        note: snapshot.processingState?.lastErrorMessage ?? undefined,
        actionLabel:
          this.processState() === "loading"
            ? this.loc.t("common.processingEllipsis")
            : this.loc.t("common.process"),
        actionDisabled: this.processState() === "loading",
        onAction: () => {
          void this.processSelectedSnapshot();
        }
      });
    }

    return sections;
  });
  private readonly syncPageRail = effect(() => {
    this.pageRail.setSections(this.pageRailSections());
  });
  private snapshotLoadSerial = 0;

  ngOnInit(): void {
    if (this.auth.token()) {
      void this.loadSnapshots();
    }
  }

  ngOnDestroy(): void {
    this.pageRail.clearSections();
  }

  formatDateTime(value: string): string {
    return value.replace("T", " ").slice(0, 19);
  }

  processingStateLabel(snapshot: IngestionSnapshotListItem): string {
    const state = snapshot.processingState?.state ?? "pending";
    return this.loc.t(`processingState.${state}` as TranslationKey);
  }

  formatPrice(row: IngestionRowPreview): string {
    if (typeof row.priceValue === "number") {
      return `${row.priceValue.toLocaleString("hu-HU")} HUF`;
    }

    return row.priceText || this.loc.t("common.none");
  }

  formatValidity(row: IngestionRowPreview): string {
    if (row.validFrom || row.validTo) {
      return `${row.validFrom ?? "?"} - ${row.validTo ?? "?"}`;
    }

    return this.loc.t("common.none");
  }

  selectSnapshot(snapshotId: string): void {
    this.selectedSnapshotId.set(snapshotId);
    void this.ensureReviewItems(snapshotId);
  }

  reviewItemForRow(row: IngestionRowPreview): IngestionProductReviewItem | null {
    const snapshot = this.selectedSnapshot();
    if (!snapshot) return null;
    return (
      this.reviewItemsBySnapshot()[snapshot.id]?.find(
        (item) =>
          item.rawRowPreview["sourceRecordId"] === row.sourceRecordId ||
          item.rawRowPreview["sourceProductKey"] === row.sourceProductKey ||
          item.rawRowPreview["displayName"] === row.displayName
      ) ?? null
    );
  }

  reviewStatusLabel(status: IngestionProductReviewItem["status"]): string {
    return this.loc.t(`reviewStatus.${status}` as TranslationKey);
  }

  candidateMatchLabel(match: IngestionProductReviewItem["candidateMatch"]): string {
    return this.loc.t(`candidateMatch.${match}` as TranslationKey);
  }

  declineReasonLabel(reason: ProductReviewDecisionReason): string {
    return this.loc.t(`reviewReason.${reason}` as TranslationKey);
  }

  beginRowDecline(item: IngestionProductReviewItem): void {
    this.decliningReviewId.set(item.id);
    this.decliningReviewReason.set(item.decision?.declineReason ?? "bad_name");
  }

  cancelRowDecline(): void {
    this.decliningReviewId.set(null);
    this.decliningReviewReason.set("bad_name");
  }

  async confirmRowDecline(item: IngestionProductReviewItem): Promise<void> {
    const reason = this.decliningReviewReason();
    this.cancelRowDecline();
    await this.declineReviewItem(item.id, reason, null);
  }

  setShowAcceptedItems(showAccepted: boolean): void {
    this.showAcceptedItems.set(showAccepted);
    void this.loadSnapshots();
  }

  toggleCrawlSource(sourceKey: string): void {
    this.crawlSourceFilterTouched.set(true);
    this.selectedCrawlSources.update((selectedSources) => {
      const next = new Set(selectedSources);

      if (next.has(sourceKey)) {
        next.delete(sourceKey);
      } else {
        next.add(sourceKey);
      }

      return next;
    });
    void this.loadSnapshots();
  }

  toggleAllCrawlSources(): void {
    const allSources = new Set(this.crawlSourceOptions().map((source) => source.key));
    const nextSources =
      this.selectedCrawlSources().size === allSources.size ? new Set<string>() : allSources;

    this.crawlSourceFilterTouched.set(true);
    this.selectedCrawlSources.set(nextSources);
    void this.loadSnapshots();
  }

  onSnapshotScroll(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLElement) {
      this.snapshotListScrollTop.set(target.scrollTop);

      const remainingDistance = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remainingDistance < 74 * 6) {
        void this.loadNextSnapshotPage();
      }
    }
  }

  startWorkspaceResize(event: PointerEvent): void {
    event.preventDefault();
    const workspace = (event.currentTarget as HTMLElement).closest(".crawl-workspace");

    if (!(workspace instanceof HTMLElement)) {
      return;
    }

    const bounds = workspace.getBoundingClientRect();
    const updateWidth = (clientX: number): void => {
      const nextPercent = ((clientX - bounds.left) / bounds.width) * 100;
      this.crawlListWidthPercent.set(Math.max(28, Math.min(64, nextPercent)));
    };
    const onPointerMove = (moveEvent: PointerEvent): void => {
      updateWidth(moveEvent.clientX);
    };
    const onPointerUp = (): void => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    updateWidth(event.clientX);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }

  async loadSnapshots(): Promise<void> {
    if (!this.auth.token()) {
      this.loadState.set("error");
      this.statusMessage.set(this.loc.t("crawl.signInBeforeLoad"));
      return;
    }

    const loadSerial = this.snapshotLoadSerial + 1;
    this.snapshotLoadSerial = loadSerial;
    this.errorMessage.set("");
    this.currentSnapshotPage.set(0);
    this.hasNextSnapshotPage.set(true);
    this.loadState.set("loading");
    this.selectedSnapshotId.set(null);
    this.snapshotListScrollTop.set(0);
    this.snapshots.set([]);
    this.statusMessage.set(this.loc.t("crawl.loadingSnapshots"));

    await this.loadNextSnapshotPage(loadSerial);
  }

  async loadNextSnapshotPage(loadSerial = this.snapshotLoadSerial): Promise<void> {
    if (
      !this.auth.token() ||
      (this.loadState() === "loading" && this.currentSnapshotPage() > 0) ||
      !this.hasNextSnapshotPage()
    ) {
      return;
    }

    this.errorMessage.set("");
    this.loadState.set("loading");

    try {
      if (this.crawlSourceFilterTouched() && this.selectedCrawlSources().size === 0) {
        this.snapshots.set([]);
        this.currentSnapshotPage.set(1);
        this.hasNextSnapshotPage.set(false);
        this.loadState.set("success");
        this.statusMessage.set(this.loc.t("crawl.noSourceFilters"));
        return;
      }

      const pageToLoad = this.currentSnapshotPage() + 1;
      const result = await this.ingestion.listSnapshots(
        this.showAcceptedItems(),
        pageToLoad,
        this.snapshotPageSize(),
        this.selectedServerCrawlSourceNames()
      );

      if (loadSerial !== this.snapshotLoadSerial) {
        return;
      }

      if (result.status !== "ok") {
        this.snapshots.set([]);
        this.currentSnapshotPage.set(0);
        this.hasNextSnapshotPage.set(false);
        this.loadState.set("error");
        this.statusMessage.set(this.loc.t("crawl.snapshotsFailure"));
        this.errorMessage.set(result.message);
        return;
      }

      if (result.snapshots.length === 0 && result.pagination.hasNextPage) {
        this.currentSnapshotPage.set(result.pagination.page);
        this.hasNextSnapshotPage.set(true);
        this.loadState.set("success");
        await this.loadNextSnapshotPage(loadSerial);
        return;
      }

      this.snapshots.update((snapshots) => mergeSnapshotsById(snapshots, result.snapshots));
      this.currentSnapshotPage.set(result.pagination.page);
      this.crawlSourceNames.set(result.sourceNames);
      if (!this.crawlSourceFilterTouched()) {
        this.selectedCrawlSources.set(new Set(result.sourceNames));
      }
      this.hasNextSnapshotPage.set(result.pagination.hasNextPage);
      if (!this.selectedSnapshotId()) {
        const firstSnapshotId = result.snapshots[0]?.id ?? null;
        this.selectedSnapshotId.set(firstSnapshotId);
        if (firstSnapshotId) void this.ensureReviewItems(firstSnapshotId);
      }
      this.loadState.set("success");
      this.statusMessage.set(this.loc.t("crawl.loadedCount", { count: this.snapshots().length }));

      this.logger.log("info", "Ingestion snapshots loaded", {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        processorName: result.processorName,
        processorVersion: result.processorVersion,
        snapshotCount: this.snapshots().length
      });
    } catch (error: unknown) {
      if (loadSerial !== this.snapshotLoadSerial) {
        return;
      }

      this.snapshots.set([]);
      this.currentSnapshotPage.set(0);
      this.hasNextSnapshotPage.set(false);
      this.loadState.set("error");
      this.statusMessage.set(this.loc.t("crawl.routeFailure"));
      this.errorMessage.set(this.loc.t("crawl.routeHint"));

      this.logger.log("error", "Ingestion snapshot request failed", { error });
    }
  }

  async processSelectedSnapshot(): Promise<void> {
    const snapshot = this.selectedSnapshot();
    if (!snapshot) {
      return;
    }

    this.errorMessage.set("");
    this.processState.set("loading");

    const result = await this.ingestion.processSnapshot(snapshot.id);
    this.processState.set("idle");

    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.statusMessage.set(
      this.loc.t("crawl.processedRows", {
        count: result.processedRowCount,
        source: snapshot.sourceName
      })
    );
    await this.loadSnapshots();
  }

  async openReviewEditor(
    snapshot: IngestionSnapshotListItem,
    row: IngestionRowPreview
  ): Promise<void> {
    this.errorMessage.set("");
    const items = await this.ensureReviewItems(snapshot.id);
    if (!items) {
      return;
    }

    const reviewItem =
      items.find(
        (item) =>
          item.rawRowPreview["sourceRecordId"] === row.sourceRecordId ||
          item.rawRowPreview["sourceProductKey"] === row.sourceProductKey ||
          item.rawRowPreview["displayName"] === row.displayName
      ) ??
      items[0] ??
      null;

    if (!reviewItem) {
      this.errorMessage.set(this.loc.t("crawl.noReviewItem"));
      return;
    }

    this.editingReviewItem.set(reviewItem);
    this.reviewEditorOpen.set(true);
  }

  closeReviewEditor(): void {
    this.reviewEditorOpen.set(false);
    this.editingReviewItem.set(null);
  }

  async updateReviewCandidate(id: string, candidate: ProductReviewCandidateDraft): Promise<void> {
    const result = await this.ingestion.updateReviewItemCandidate(id, candidate);
    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.editingReviewItem.set(result.reviewItem);
    this.replaceReviewItem(result.reviewItem);
  }

  async acceptReviewItem(id: string, note: string | null): Promise<void> {
    const preview = await this.ingestion.previewReviewItemAcceptance(id);
    if (preview.status !== "ok") {
      this.errorMessage.set(preview.message);
      return;
    }

    if (!window.confirm(this.formatAcceptancePreview(preview.preview))) {
      return;
    }

    const result = await this.ingestion.acceptReviewItem(id, note);
    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.closeReviewEditor();
    await this.refreshSelectedReviewItems();
    await this.loadSnapshots();
  }

  async declineReviewItem(
    id: string,
    reason: ProductReviewDecisionReason,
    note: string | null
  ): Promise<void> {
    if (!productReviewDecisionReasons.includes(reason)) {
      this.errorMessage.set(this.loc.t("crawl.chooseDecline"));
      return;
    }

    const result = await this.ingestion.declineReviewItem(id, reason, note);
    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.closeReviewEditor();
    await this.refreshSelectedReviewItems();
  }

  private async ensureReviewItems(
    snapshotId: string
  ): Promise<IngestionProductReviewItem[] | null> {
    const cachedItems = this.reviewItemsBySnapshot()[snapshotId];
    if (cachedItems?.length) {
      return cachedItems;
    }

    const prepared = await this.ingestion.prepareReviewItems(snapshotId);
    if (prepared.status !== "ok") {
      this.errorMessage.set(prepared.message);
      return null;
    }

    this.reviewItemsBySnapshot.update((itemsBySnapshot) => ({
      ...itemsBySnapshot,
      [snapshotId]: prepared.reviewItems
    }));
    return prepared.reviewItems;
  }

  private async refreshSelectedReviewItems(): Promise<void> {
    const snapshot = this.selectedSnapshot();
    if (!snapshot) {
      return;
    }

    const result = await this.ingestion.listReviewItemsForSnapshot(snapshot.id);
    if (result.status !== "ok") {
      this.errorMessage.set(result.message);
      return;
    }

    this.reviewItemsBySnapshot.update((itemsBySnapshot) => ({
      ...itemsBySnapshot,
      [snapshot.id]: result.reviewItems
    }));
  }

  private replaceReviewItem(nextItem: IngestionProductReviewItem): void {
    this.reviewItemsBySnapshot.update((itemsBySnapshot) => {
      const snapshotItems = itemsBySnapshot[nextItem.snapshotId] ?? [];
      return {
        ...itemsBySnapshot,
        [nextItem.snapshotId]: snapshotItems.map((item) =>
          item.id === nextItem.id ? nextItem : item
        )
      };
    });
  }

  private selectedServerCrawlSourceNames(): string[] {
    const selectedSources = this.selectedCrawlSources();
    const selectedRealSources = this.crawlSourceNames().filter((sourceName) =>
      selectedSources.has(sourceName)
    );

    return selectedRealSources.length === this.crawlSourceNames().length ? [] : selectedRealSources;
  }

  private formatAcceptancePreview(preview: {
    action: "create" | "merge";
    existingProduct?: { id: string; name: string; sourceNames: string[] } | null;
    productId: string;
    reason: string;
  }): string {
    if (preview.action === "merge" && preview.existingProduct) {
      return [
        this.loc.t("crawl.acceptMerge", { name: preview.existingProduct.name }),
        preview.reason,
        this.loc.t("crawl.acceptTargetId", { id: preview.productId }),
        this.loc.t("crawl.acceptExistingSources", {
          sources: preview.existingProduct.sourceNames.join(", ") || this.loc.t("common.none")
        }),
        "",
        this.loc.t("crawl.continue")
      ].join("\n");
    }

    return [
      this.loc.t("crawl.acceptCreate"),
      preview.reason,
      this.loc.t("crawl.acceptNewId", { id: preview.productId }),
      "",
      this.loc.t("crawl.continue")
    ].join("\n");
  }
}

function mergeSnapshotsById(
  existingSnapshots: IngestionSnapshotListItem[],
  nextSnapshots: IngestionSnapshotListItem[]
): IngestionSnapshotListItem[] {
  const snapshotsById = new Map(existingSnapshots.map((snapshot) => [snapshot.id, snapshot]));

  for (const snapshot of nextSnapshots) {
    snapshotsById.set(snapshot.id, snapshot);
  }

  return [...snapshotsById.values()];
}
