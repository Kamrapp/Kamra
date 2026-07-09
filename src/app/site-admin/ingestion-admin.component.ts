import { Component, computed, effect, inject, signal, type OnDestroy, type OnInit } from "@angular/core";

import { AuthService } from "../auth.service";
import { logBrowserEvent } from "../browser-logger";
import {
  IngestionAdminService,
  productReviewDecisionReasons,
  type IngestionProductReviewItem,
  type IngestionRowPreview,
  type IngestionSnapshotListItem,
  type ProductReviewCandidateDraft,
  type ProductReviewDecisionReason
} from "./ingestion-admin.service";
import { ResizableTableComponent, type ResizableTableColumn } from "../shared/resizable-table.component";
import { PageRailService, type PageRailSection } from "../shared/page-rail.service";
import { ProductEditorDialogComponent } from "../shared/product-editor-dialog.component";
import { TableIconButtonComponent } from "../shared/table-icon-button.component";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";

interface VisibleSnapshotRow {
  index: number;
  offset: number;
  snapshot: IngestionSnapshotListItem;
}

@Component({
  imports: [ProductEditorDialogComponent, ResizableTableComponent, TableIconButtonComponent],
  selector: "app-ingestion-admin",
  standalone: true,
  template: `
    <section class="ingestion-page" aria-labelledby="ingestion-title">
      <label class="accepted-toggle">
        <input
          type="checkbox"
          [checked]="showAcceptedItems()"
          (change)="setShowAcceptedItems($any($event.target).checked)"
        />
        <span>{{ loc.t("crawl.showAccepted") }}</span>
      </label>

      <section
        class="crawl-workspace"
        [class.crawl-workspace-single]="!selectedSnapshot()"
        [style.--crawl-list-fr]="crawlListWidthPercent() + 'fr'"
        [style.--crawl-detail-fr]="100 - crawlListWidthPercent() + 'fr'"
      >
          <app-resizable-table #snapshotTable class="snapshot-list" [ariaLabel]="loc.t('crawl.snapshotTable')" [columns]="snapshotColumns()">
              <div
                class="snapshot-body"
                [style.--snapshot-row-height]="snapshotRowHeight + 'px'"
                (scroll)="onSnapshotScroll($event)"
              >
                @if (!snapshots().length) {
                  <p class="empty-list">{{ snapshotListPlaceholder() }}</p>
                }

                <div class="snapshot-spacer" [style.height.px]="snapshotListHeight()">
                @for (row of visibleSnapshots(); track row.snapshot.id) {
                  <button
                    class="snapshot-row"
                    type="button"
                    role="row"
                    [class.snapshot-row-selected]="selectedSnapshotId() === row.snapshot.id"
                    (click)="selectSnapshot(row.snapshot.id)"
                    [style.grid-template-columns]="snapshotTable.columnTemplate()"
                    [style.transform]="'translateY(' + row.offset + 'px)'"
                  >
                    <span role="cell">
                      <strong>{{ row.snapshot.sourceName }}</strong>
                      <small>{{ row.snapshot.sourceRecordId }}</small>
                    </span>
                    <span role="cell">{{ formatDate(row.snapshot.capturedAt) }}</span>
                    <span role="cell">{{ row.snapshot.parsedRowCount }}</span>
                    <span role="cell">{{ processingStateLabel(row.snapshot) }}</span>
                  </button>
                }
                </div>
              </div>
          </app-resizable-table>

          @if (selectedSnapshot(); as snapshot) {
            <button
              class="workspace-resizer"
              type="button"
              [attr.aria-label]="loc.t('common.resizePanels')"
              [title]="loc.t('common.resizePanels')"
              (pointerdown)="startWorkspaceResize($event)"
            >
              <span aria-hidden="true"></span>
            </button>

            <aside class="detail-panel surface-panel" [attr.aria-label]="loc.t('crawl.selectedSnapshot')">
              <app-resizable-table #rowTable class="row-table" [ariaLabel]="loc.t('crawl.rowsTable')" [columns]="rowColumns()">
                  <div class="row-body">
                    @for (row of snapshot.rows; track row.sourceRecordId || row.sourceProductKey || row.displayName) {
                      <article class="parsed-row" role="row" [style.grid-template-columns]="rowTable.columnTemplate()">
                        <span class="action-cell" role="cell">
                          <app-table-icon-button
                            [titleText]="loc.t('common.reviewProduct')"
                            [ariaLabel]="loc.t('common.reviewProduct')"
                            (press)="openReviewEditor(snapshot, row)"
                          >
                            ✓
                          </app-table-icon-button>
                        </span>
                        <span role="cell">
                          <strong>{{ row.displayName }}</strong>
                          <small>{{ row.packageLabel || loc.t("common.noPackage") }}</small>
                        </span>
                        <span role="cell">{{ row.sourceProductKey || loc.t("common.none") }}</span>
                        <span role="cell">{{ formatPrice(row) }}</span>
                        <span role="cell">{{ formatValidity(row) }}</span>
                      </article>
                    }
                  </div>
              </app-resizable-table>
            </aside>
          }
        </section>
        <app-product-editor-dialog
          mode="review"
          [open]="reviewEditorOpen()"
          [reviewItem]="editingReviewItem()"
          (acceptReview)="acceptReviewItem($event.id, $event.note)"
          (close)="closeReviewEditor()"
          (declineReview)="declineReviewItem($event.id, $event.reason, $event.note)"
          (updateReviewCandidate)="updateReviewCandidate($event.id, $event.candidate)"
        />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }

      .ingestion-page {
        display: block;
        min-height: 0;
      }

      dd,
      dl,
      h1,
      h2,
      p {
        margin: 0;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(1.8rem, 4vw, 2.7rem);
        line-height: 1.05;
      }

      h2 {
        color: var(--color-text);
        font-size: 1.15rem;
        line-height: 1.2;
      }

      .error-message {
        color: var(--color-text-muted);
      }

      .crawl-workspace {
        --crawl-detail-fr: 58fr;
        --crawl-list-fr: 42fr;
        display: grid;
        gap: var(--space-3);
        grid-template-columns: minmax(20rem, var(--crawl-list-fr)) 0.75rem minmax(24rem, var(--crawl-detail-fr));
        min-height: 42rem;
        min-width: 0;
      }

      .accepted-toggle {
        align-items: center;
        color: var(--color-text);
        display: inline-flex;
        font-size: 0.92rem;
        font-weight: 700;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
      }

      .accepted-toggle input {
        accent-color: var(--color-accent-leaf-strong);
        height: 1rem;
        margin: 0;
        width: 1rem;
      }

      .crawl-workspace-single {
        grid-template-columns: 1fr;
      }

      .detail-panel {
        display: grid;
        min-width: 0;
        overflow: hidden;
        padding: 0;
      }

      .snapshot-list,
      .row-table {
        min-height: 0;
        min-width: 0;
      }

      .snapshot-row,
      .parsed-row {
        box-sizing: border-box;
        display: grid;
        gap: var(--space-3);
      }

      .snapshot-row {
        min-width: var(--table-width);
      }

      .snapshot-body,
      .row-body {
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-gutter: stable;
      }

      .snapshot-body {
        height: 36rem;
        min-width: var(--table-width);
        position: relative;
      }

      .snapshot-spacer {
        min-width: 100%;
        position: relative;
      }

      .snapshot-row {
        background: transparent;
        border: 0;
        border-bottom: 1px solid var(--line-subtle);
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 4.6rem;
        padding: 0.7rem 1rem;
        position: absolute;
        right: 0;
        text-align: left;
        top: 0;
        width: 100%;
      }

      .snapshot-row-selected,
      .snapshot-row:hover {
        background: var(--row-hover-background);
      }

      .workspace-resizer {
        align-items: center;
        align-self: stretch;
        background: transparent;
        border: 0;
        cursor: col-resize;
        display: flex;
        justify-content: center;
        min-width: 0.75rem;
        padding: 0;
      }

      .workspace-resizer span {
        background: color-mix(in srgb, var(--color-wood-deep) 22%, transparent);
        border-radius: var(--radius-pill);
        display: block;
        height: min(18rem, 46vh);
        transition: background 160ms ease, width 160ms ease;
        width: 0.22rem;
      }

      .workspace-resizer:hover span,
      .workspace-resizer:focus-visible span {
        background: color-mix(in srgb, var(--color-accent-leaf-strong) 72%, var(--color-wood-deep) 28%);
        width: 0.34rem;
      }

      strong,
      .action-cell,
      small {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .action-cell {
        align-items: center;
        display: flex;
      }

      small {
        color: var(--color-text-muted);
        font-size: 0.78rem;
      }

      .empty-list {
        color: var(--color-text-muted);
        padding: 1rem;
      }

      .parsed-row {
        min-width: var(--table-width);
      }

      .row-body {
        height: 36rem;
        min-width: var(--table-width);
        position: relative;
      }

      .parsed-row {
        align-items: center;
        border-bottom: 1px solid var(--line-subtle);
        min-height: 4.2rem;
        padding: 0.6rem 1rem;
      }

      @media (max-width: 980px) {
        .crawl-workspace {
          gap: var(--space-5);
        }

        .workspace-resizer {
          display: none;
        }
      }
    `
  ]
})
export class IngestionAdminComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly ingestion = inject(IngestionAdminService);
  readonly loc = inject(LocalizationService);
  readonly pageRail = inject(PageRailService);
  readonly snapshotColumns = computed<readonly ResizableTableColumn[]>(() => [
    { key: "source", label: this.loc.t("common.source"), minWidth: 80, maxWidth: 640, width: 180 },
    { key: "captured", label: this.loc.t("common.captured"), minWidth: 80, maxWidth: 640, width: 120 },
    { key: "rows", label: this.loc.t("common.rows"), minWidth: 60, maxWidth: 640, width: 70 },
    { key: "state", label: this.loc.t("common.state"), minWidth: 80, maxWidth: 640, width: 120 }
  ]);
  readonly rowColumns = computed<readonly ResizableTableColumn[]>(() => [
    { key: "actions", label: "", minWidth: 52, maxWidth: 72, width: 56 },
    { key: "product", label: this.loc.t("common.product"), minWidth: 120, maxWidth: 820, width: 360 },
    { key: "key", label: this.loc.t("common.key"), minWidth: 60, maxWidth: 540, width: 100 },
    { key: "price", label: this.loc.t("common.price"), minWidth: 60, maxWidth: 540, width: 100 },
    { key: "validity", label: this.loc.t("common.validity"), minWidth: 130, maxWidth: 540, width: 240 }
  ]);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "success" | "error">("idle");
  readonly processState = signal<"idle" | "loading">("idle");
  readonly crawlListWidthPercent = signal(42);
  readonly currentSnapshotPage = signal(0);
  readonly hasNextSnapshotPage = signal(true);
  readonly snapshotListScrollTop = signal(0);
  readonly snapshotPageSize = signal(25);
  readonly snapshotRowHeight = 74;
  readonly snapshotViewportHeight = 576;
  readonly showAcceptedItems = signal(false);
  readonly snapshots = signal<IngestionSnapshotListItem[]>([]);
  readonly statusMessage = signal("");
  readonly selectedSnapshotId = signal<string | null>(null);
  readonly editingReviewItem = signal<IngestionProductReviewItem | null>(null);
  readonly reviewEditorOpen = signal(false);
  readonly reviewItemsBySnapshot = signal<Record<string, IngestionProductReviewItem[]>>({});
  readonly crawlSourceFilterTouched = signal(false);
  readonly crawlSourceNames = signal<string[]>([]);
  readonly selectedCrawlSources = signal<Set<string>>(new Set());
  readonly selectedSnapshot = computed(() =>
    this.snapshots().find((snapshot) => snapshot.id === this.selectedSnapshotId()) ?? this.snapshots()[0] ?? null
  );
  readonly pendingSnapshots = computed(() =>
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
  readonly snapshotListHeight = computed(() => this.snapshots().length * this.snapshotRowHeight);
  readonly visibleSnapshots = computed<VisibleSnapshotRow[]>(() => {
    const snapshots = this.snapshots();
    const overscan = 5;
    const start = Math.max(0, Math.floor(this.snapshotListScrollTop() / this.snapshotRowHeight) - overscan);
    const visibleCount = Math.ceil(this.snapshotViewportHeight / this.snapshotRowHeight) + overscan * 2;

    return snapshots.slice(start, start + visibleCount).map((snapshot, index) => ({
      index: start + index,
      offset: (start + index) * this.snapshotRowHeight,
      snapshot
    }));
  });
  readonly pageRailSections = computed<PageRailSection[]>(() => {
    const sections: PageRailSection[] = [
      {
        key: "crawl-summary",
        kind: "summary",
        kicker: this.loc.t("common.siteAdmin"),
        title: this.loc.t("common.crawls"),
        items: [
          { label: this.loc.t("crawl.snapshots"), value: `${this.snapshots().length}` },
          { label: this.loc.t("common.rows"), value: `${this.totalRows()}` },
          { label: this.loc.t("common.pending"), value: `${this.pendingSnapshots()}` }
        ],
        actionLabel: this.loadState() === "loading" ? this.loc.t("common.loading") : this.loc.t("common.refresh"),
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
    if (this.loadState() === "loading" || this.crawlSourceOptions().length || this.crawlSourceFilterTouched()) {
      const allSourcesSelected = this.selectedCrawlSources().size === this.crawlSourceOptions().length;
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
          ? allSourcesSelected ? this.loc.t("common.deselectAll") : this.loc.t("common.selectAll")
          : undefined,
        onSecondaryAction: this.crawlSourceOptions().length ? () => this.toggleAllCrawlSources() : undefined,
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
          { label: this.loc.t("common.parser"), value: `${snapshot.parserName} ${snapshot.parserVersion}` },
          { label: this.loc.t("common.content"), value: snapshot.contentType },
          { label: this.loc.t("common.processing"), value: this.processingStateLabel(snapshot) }
        ],
        note: snapshot.processingState?.lastErrorMessage ?? undefined,
        actionLabel: this.processState() === "loading" ? this.loc.t("common.processingEllipsis") : this.loc.t("common.process"),
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

  formatDate(value: string): string {
    return value.slice(0, 10);
  }

  formatDateTime(value: string): string {
    return value.replace("T", " ").slice(0, 19);
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

  processingStateLabel(snapshot: IngestionSnapshotListItem): string {
    const state = snapshot.processingState?.state ?? "pending";
    return this.loc.t(`processingState.${state}` as TranslationKey);
  }

  selectSnapshot(snapshotId: string): void {
    this.selectedSnapshotId.set(snapshotId);
  }

  snapshotListPlaceholder(): string {
    if (!this.auth.token()) {
      return this.loc.t("crawl.signInLoad");
    }

    if (this.loadState() === "loading") {
      return this.loc.t("crawl.loadingSnapshots");
    }

    return this.loc.t("crawl.noSnapshots");
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
    const nextSources = this.selectedCrawlSources().size === allSources.size
      ? new Set<string>()
      : allSources;

    this.crawlSourceFilterTouched.set(true);
    this.selectedCrawlSources.set(nextSources);
    void this.loadSnapshots();
  }

  onSnapshotScroll(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLElement) {
      this.snapshotListScrollTop.set(target.scrollTop);

      const remainingDistance = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remainingDistance < this.snapshotRowHeight * 6) {
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
    if (!this.auth.token() || (this.loadState() === "loading" && this.currentSnapshotPage() > 0) || !this.hasNextSnapshotPage()) {
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
        this.selectedSnapshotId.set(result.snapshots[0]?.id ?? null);
      }
      this.loadState.set("success");
      this.statusMessage.set(this.loc.t("crawl.loadedCount", { count: this.snapshots().length }));

      logBrowserEvent("info", "Ingestion snapshots loaded", {
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

      logBrowserEvent("error", "Ingestion snapshot request failed", error);
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

    this.statusMessage.set(this.loc.t("crawl.processedRows", { count: result.processedRowCount, source: snapshot.sourceName }));
    await this.loadSnapshots();
  }

  async openReviewEditor(snapshot: IngestionSnapshotListItem, row: IngestionRowPreview): Promise<void> {
    this.errorMessage.set("");
    const items = await this.ensureReviewItems(snapshot.id);
    if (!items) {
      return;
    }

    const reviewItem = items.find((item) =>
      item.rawRowPreview["sourceRecordId"] === row.sourceRecordId
      || item.rawRowPreview["sourceProductKey"] === row.sourceProductKey
      || item.rawRowPreview["displayName"] === row.displayName
    ) ?? items[0] ?? null;

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

  private async ensureReviewItems(snapshotId: string): Promise<IngestionProductReviewItem[] | null> {
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
        [nextItem.snapshotId]: snapshotItems.map((item) => item.id === nextItem.id ? nextItem : item)
      };
    });
  }

  private selectedServerCrawlSourceNames(): string[] {
    const selectedSources = this.selectedCrawlSources();
    const selectedRealSources = this.crawlSourceNames().filter((sourceName) => selectedSources.has(sourceName));

    return selectedRealSources.length === this.crawlSourceNames().length
      ? []
      : selectedRealSources;
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
