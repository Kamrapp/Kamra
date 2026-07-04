import { Component, computed, effect, inject, signal, type OnDestroy, type OnInit } from "@angular/core";

import { AuthService } from "../auth.service";
import { logBrowserEvent } from "../browser-logger";
import {
  IngestionAdminService,
  type IngestionRowPreview,
  type IngestionSnapshotListItem
} from "./ingestion-admin.service";
import { ResizableTableComponent, type ResizableTableColumn } from "../shared/resizable-table.component";
import { PageRailService, type PageRailSection } from "../shared/page-rail.service";

@Component({
  imports: [ResizableTableComponent],
  selector: "app-ingestion-admin",
  standalone: true,
  template: `
    <section class="ingestion-page" aria-labelledby="ingestion-title">
      <section
        class="crawl-workspace"
        [class.crawl-workspace-single]="!selectedSnapshot()"
        [style.--crawl-list-fr]="crawlListWidthPercent() + 'fr'"
        [style.--crawl-detail-fr]="100 - crawlListWidthPercent() + 'fr'"
      >
          <app-resizable-table #snapshotTable class="snapshot-list" ariaLabel="Crawl snapshots" [columns]="snapshotColumns">
              <div class="snapshot-body">
                @for (snapshot of snapshots(); track snapshot.id) {
                  <button
                    class="snapshot-row"
                    type="button"
                    role="row"
                    [class.snapshot-row-selected]="selectedSnapshotId() === snapshot.id"
                    (click)="selectSnapshot(snapshot.id)"
                    [style.grid-template-columns]="snapshotTable.columnTemplate()"
                  >
                    <span role="cell">
                      <strong>{{ snapshot.sourceName }}</strong>
                      <small>{{ snapshot.sourceRecordId }}</small>
                    </span>
                    <span role="cell">{{ formatDate(snapshot.capturedAt) }}</span>
                    <span role="cell">{{ snapshot.parsedRowCount }}</span>
                    <span role="cell">{{ processingStateLabel(snapshot) }}</span>
                  </button>
                } @empty {
                  <p class="empty-list">No crawl snapshots loaded.</p>
                }
              </div>
          </app-resizable-table>

          @if (selectedSnapshot(); as snapshot) {
            <button
              class="workspace-resizer"
              type="button"
              aria-label="Resize crawl list and detail panels"
              title="Resize panels"
              (pointerdown)="startWorkspaceResize($event)"
            >
              <span aria-hidden="true"></span>
            </button>

            <aside class="detail-panel surface-panel" aria-label="Selected crawl snapshot">
              <app-resizable-table #rowTable class="row-table" ariaLabel="Parsed crawl rows" [columns]="rowColumns">
                  <div class="row-body">
                    @for (row of snapshot.rows; track row.sourceRecordId || row.sourceProductKey || row.displayName) {
                      <article class="parsed-row" role="row" [style.grid-template-columns]="rowTable.columnTemplate()">
                        <span role="cell">
                          <strong>{{ row.displayName }}</strong>
                          <small>{{ row.packageLabel || "no package" }}</small>
                        </span>
                        <span role="cell">{{ row.sourceProductKey || "none" }}</span>
                        <span role="cell">{{ formatPrice(row) }}</span>
                        <span role="cell">{{ formatValidity(row) }}</span>
                      </article>
                    }
                  </div>
              </app-resizable-table>
            </aside>
          }
        </section>
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

      .crawl-workspace-single {
        grid-template-columns: 1fr;
      }

      .detail-panel {
        min-width: 0;
        overflow: hidden;
        padding: 0;
      }

      .snapshot-list,
      .row-table {
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
        max-height: 36rem;
        overflow-x: hidden;
        overflow-y: auto;
      }

      .snapshot-body {
        min-width: var(--table-width);
      }

      .snapshot-row {
        background: transparent;
        border: 0;
        border-bottom: 1px solid color-mix(in srgb, var(--color-wood) 12%, transparent);
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 4.6rem;
        padding: 0.7rem 1rem;
        text-align: left;
        width: 100%;
      }

      .snapshot-row-selected,
      .snapshot-row:hover {
        background: color-mix(in srgb, var(--color-accent-sky) 22%, white 78%);
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
        border-radius: 999px;
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
      small {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        min-width: var(--table-width);
      }

      .parsed-row {
        align-items: center;
        border-bottom: 1px solid color-mix(in srgb, var(--color-wood) 12%, transparent);
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
  readonly pageRail = inject(PageRailService);
  readonly snapshotColumns: readonly ResizableTableColumn[] = [
    { key: "source", label: "Source", minWidth: 80, maxWidth: 640, width: 180 },
    { key: "captured", label: "Captured", minWidth: 80, maxWidth: 640, width: 120 },
    { key: "rows", label: "Rows", minWidth: 60, maxWidth: 640, width: 70 },
    { key: "state", label: "State", minWidth: 80, maxWidth: 640, width: 120 }
  ];
  readonly rowColumns: readonly ResizableTableColumn[] = [
    { key: "product", label: "Product", minWidth: 120, maxWidth: 820, width: 360 },
    { key: "key", label: "Key", minWidth: 60, maxWidth: 540, width: 100 },
    { key: "price", label: "Price", minWidth: 60, maxWidth: 540, width: 100 },
    { key: "validity", label: "Validity", minWidth: 130, maxWidth: 540, width: 240 }
  ];
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "success" | "error">("idle");
  readonly processState = signal<"idle" | "loading">("idle");
  readonly crawlListWidthPercent = signal(42);
  readonly snapshots = signal<IngestionSnapshotListItem[]>([]);
  readonly statusMessage = signal("No crawl snapshots have been loaded yet.");
  readonly selectedSnapshotId = signal<string | null>(null);
  readonly selectedSnapshot = computed(() =>
    this.snapshots().find((snapshot) => snapshot.id === this.selectedSnapshotId()) ?? this.snapshots()[0] ?? null
  );
  readonly pendingSnapshots = computed(() =>
    this.snapshots().filter((snapshot) => snapshot.processingState?.state !== "processed").length
  );
  readonly totalRows = computed(() =>
    this.snapshots().reduce((total, snapshot) => total + snapshot.parsedRowCount, 0)
  );
  readonly pageRailSections = computed<PageRailSection[]>(() => {
    const sections: PageRailSection[] = [
      {
        key: "crawl-summary",
        kind: "summary",
        kicker: "Site admin",
        title: "Crawls",
        items: [
          { label: "Snapshots", value: `${this.snapshots().length}` },
          { label: "Rows", value: `${this.totalRows()}` },
          { label: "Pending", value: `${this.pendingSnapshots()}` }
        ],
        actionLabel: this.loadState() === "loading" ? "Loading..." : "Refresh",
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
        kicker: "Admin only",
        message: "Sign in to view crawl snapshots."
      });
      return sections;
    }

    const snapshot = this.selectedSnapshot();
    if (snapshot) {
      sections.push({
        key: "crawl-selected",
        kind: "summary",
        kicker: snapshot.workflowName,
        title: snapshot.sourceName,
        items: [
          { label: "Captured", value: this.formatDateTime(snapshot.capturedAt) },
          { label: "Parser", value: `${snapshot.parserName} ${snapshot.parserVersion}` },
          { label: "Content", value: snapshot.contentType },
          { label: "Processing", value: this.processingStateLabel(snapshot) }
        ],
        note: snapshot.processingState?.lastErrorMessage ?? undefined,
        actionLabel: this.processState() === "loading" ? "Processing..." : "Process",
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

    return row.priceText || "none";
  }

  formatValidity(row: IngestionRowPreview): string {
    if (row.validFrom || row.validTo) {
      return `${row.validFrom ?? "?"} - ${row.validTo ?? "?"}`;
    }

    return "none";
  }

  processingStateLabel(snapshot: IngestionSnapshotListItem): string {
    return snapshot.processingState?.state ?? "pending";
  }

  selectSnapshot(snapshotId: string): void {
    this.selectedSnapshotId.set(snapshotId);
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
      this.statusMessage.set("Sign in before loading crawl snapshots.");
      return;
    }

    this.errorMessage.set("");
    this.loadState.set("loading");
    this.statusMessage.set("Loading crawl snapshots...");

    try {
      const result = await this.ingestion.listSnapshots();

      if (result.status !== "ok") {
        this.snapshots.set([]);
        this.loadState.set("error");
        this.statusMessage.set("Crawl snapshots could not be loaded.");
        this.errorMessage.set(result.message);
        return;
      }

      this.snapshots.set(result.snapshots);
      this.selectedSnapshotId.set(result.snapshots[0]?.id ?? null);
      this.loadState.set("success");
      this.statusMessage.set(`Loaded ${result.snapshots.length} crawl snapshots.`);

      logBrowserEvent("info", "Ingestion snapshots loaded", {
        processorName: result.processorName,
        processorVersion: result.processorVersion,
        snapshotCount: result.snapshots.length
      });
    } catch (error: unknown) {
      this.snapshots.set([]);
      this.loadState.set("error");
      this.statusMessage.set("The browser could not reach the crawl snapshot route.");
      this.errorMessage.set("Check the shared API path and database configuration.");

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

    this.statusMessage.set(`Processed ${result.processedRowCount} rows from ${snapshot.sourceName}.`);
    await this.loadSnapshots();
  }
}
