import { Component, computed, inject, signal, type OnInit } from "@angular/core";

import { AuthService } from "../auth.service";
import { logBrowserEvent } from "../browser-logger";
import {
  IngestionAdminService,
  type IngestionRowPreview,
  type IngestionSnapshotListItem
} from "./ingestion-admin.service";

@Component({
  selector: "app-ingestion-admin",
  standalone: true,
  template: `
    <section class="ingestion-page" aria-labelledby="ingestion-title">
      <header class="page-header surface-panel">
        <div>
          <p class="ui-kicker">Site admin</p>
          <h1 id="ingestion-title">Crawls</h1>
        </div>

        <dl class="summary-strip" aria-label="Crawl summary">
          <div>
            <dt>Snapshots</dt>
            <dd>{{ snapshots().length }}</dd>
          </div>
          <div>
            <dt>Rows</dt>
            <dd>{{ totalRows() }}</dd>
          </div>
          <div>
            <dt>Pending</dt>
            <dd>{{ pendingSnapshots() }}</dd>
          </div>
        </dl>
      </header>

      @if (!auth.token()) {
        <section class="state-panel surface-panel surface-copy">
          <p class="ui-kicker">Admin only</p>
          <p class="state-title">Sign in to view crawl snapshots.</p>
        </section>
      } @else {
        <section class="state-panel surface-panel surface-copy">
          <div class="state-header">
            <div>
              <p class="ui-kicker">Current state</p>
              <p class="state-title">{{ statusMessage() }}</p>
            </div>

            <button class="ui-action-button" type="button" (click)="loadSnapshots()" [disabled]="loadState() === 'loading'">
              {{ loadState() === "loading" ? "Loading..." : "Refresh" }}
            </button>
          </div>

          @if (errorMessage(); as errorMessage) {
            <p class="error-message">{{ errorMessage }}</p>
          }
        </section>

        <section class="crawl-workspace">
          <div class="snapshot-list surface-panel" role="table" aria-label="Crawl snapshots">
            <div class="snapshot-head" role="row">
              <span role="columnheader">Source</span>
              <span role="columnheader">Captured</span>
              <span role="columnheader">Rows</span>
              <span role="columnheader">State</span>
            </div>

            <div class="snapshot-body">
              @for (snapshot of snapshots(); track snapshot.id) {
                <button
                  class="snapshot-row"
                  type="button"
                  role="row"
                  [class.snapshot-row-selected]="selectedSnapshotId() === snapshot.id"
                  (click)="selectSnapshot(snapshot.id)"
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
          </div>

          @if (selectedSnapshot(); as snapshot) {
            <aside class="detail-panel surface-panel" aria-label="Selected crawl snapshot">
              <header class="detail-header">
                <div>
                  <p class="ui-kicker">{{ snapshot.workflowName }}</p>
                  <h2>{{ snapshot.sourceName }}</h2>
                  <p class="detail-subtitle">{{ snapshot.sourceRecordId }}</p>
                </div>

                <button
                  class="ui-action-button"
                  type="button"
                  (click)="processSelectedSnapshot()"
                  [disabled]="processState() === 'loading'"
                >
                  {{ processState() === "loading" ? "Processing..." : "Process" }}
                </button>
              </header>

              <dl class="detail-grid">
                <div>
                  <dt>Captured</dt>
                  <dd>{{ formatDateTime(snapshot.capturedAt) }}</dd>
                </div>
                <div>
                  <dt>Parser</dt>
                  <dd>{{ snapshot.parserName }} {{ snapshot.parserVersion }}</dd>
                </div>
                <div>
                  <dt>Content</dt>
                  <dd>{{ snapshot.contentType }}</dd>
                </div>
                <div>
                  <dt>Processing</dt>
                  <dd>{{ processingStateLabel(snapshot) }}</dd>
                </div>
              </dl>

              @if (snapshot.processingState?.lastErrorMessage; as lastErrorMessage) {
                <p class="error-message">{{ lastErrorMessage }}</p>
              }

              <div class="row-table" role="table" aria-label="Parsed crawl rows">
                <div class="row-head" role="row">
                  <span role="columnheader">Product</span>
                  <span role="columnheader">Key</span>
                  <span role="columnheader">Price</span>
                  <span role="columnheader">Validity</span>
                </div>

                <div class="row-body">
                  @for (row of snapshot.rows; track row.sourceRecordId || row.sourceProductKey || row.displayName) {
                    <article class="parsed-row" role="row">
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
              </div>
            </aside>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }

      .ingestion-page {
        display: grid;
        gap: var(--space-5);
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

      .page-header {
        align-items: end;
        display: flex;
        gap: var(--space-5);
        justify-content: space-between;
        padding: clamp(1rem, 2.4vw, 1.4rem);
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

      .summary-strip {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(3, minmax(5rem, 1fr));
        min-width: min(28rem, 100%);
      }

      .summary-strip div,
      .detail-grid div {
        background: color-mix(in srgb, var(--color-background-soft) 72%, white 28%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 14%, transparent);
        border-radius: 8px;
        min-height: 4rem;
        padding: 0.65rem 0.8rem;
      }

      .summary-strip dd,
      .detail-grid dd {
        color: var(--color-text);
        font-weight: 800;
      }

      .summary-strip dd {
        font-size: 1.25rem;
      }

      .state-header,
      .detail-header {
        align-items: center;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      .state-title,
      .detail-subtitle,
      .error-message {
        color: var(--color-text-muted);
      }

      .state-title {
        color: var(--color-text);
        font-size: 1rem;
        font-weight: 700;
      }

      .crawl-workspace {
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(24rem, 0.8fr) minmax(0, 1.2fr);
        min-height: 42rem;
      }

      .snapshot-list,
      .detail-panel {
        overflow: hidden;
      }

      .snapshot-head,
      .row-head,
      .snapshot-row,
      .parsed-row {
        display: grid;
        gap: var(--space-3);
      }

      .snapshot-head,
      .row-head {
        background: color-mix(in srgb, var(--color-wood-deep) 12%, var(--color-surface) 88%);
        border-bottom: 1px solid color-mix(in srgb, var(--color-wood) 22%, transparent);
        color: var(--color-text-muted);
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0;
        padding: 0.75rem 1rem;
        text-transform: uppercase;
      }

      .snapshot-head,
      .snapshot-row {
        grid-template-columns: minmax(13rem, 1fr) 6rem 4rem 6.5rem;
      }

      .snapshot-body,
      .row-body {
        max-height: 36rem;
        overflow: auto;
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

      .detail-panel {
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 2.2vw, 1.25rem);
      }

      .detail-grid {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .row-head,
      .parsed-row {
        grid-template-columns: minmax(18rem, 1fr) 8rem 7rem 9rem;
      }

      .parsed-row {
        align-items: center;
        border-bottom: 1px solid color-mix(in srgb, var(--color-wood) 12%, transparent);
        min-height: 4.2rem;
        padding: 0.6rem 1rem;
      }

      @media (max-width: 980px) {
        .page-header,
        .state-header,
        .detail-header {
          align-items: stretch;
          flex-direction: column;
        }

        .crawl-workspace,
        .detail-grid {
          grid-template-columns: 1fr;
        }

        .summary-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          min-width: 0;
        }

        .snapshot-list,
        .detail-panel {
          overflow-x: auto;
        }
      }
    `
  ]
})
export class IngestionAdminComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly ingestion = inject(IngestionAdminService);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "success" | "error">("idle");
  readonly processState = signal<"idle" | "loading">("idle");
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

  ngOnInit(): void {
    if (this.auth.token()) {
      void this.loadSnapshots();
    }
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
