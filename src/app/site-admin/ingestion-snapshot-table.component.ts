import { Component, computed, inject, input, output } from "@angular/core";

import { type IngestionSnapshotListItem } from "./ingestion-admin.service";
import {
  ResizableTableComponent,
  type ResizableTableColumn
} from "../shared/resizable-table.component";
import { LocalizationService, type TranslationKey } from "../shared/localization.service";

interface VisibleSnapshotRow {
  offset: number;
  snapshot: IngestionSnapshotListItem;
}

@Component({
  selector: "app-ingestion-snapshot-table",
  standalone: true,
  imports: [ResizableTableComponent],
  template: `
    <app-resizable-table
      #snapshotTable
      class="snapshot-list"
      [ariaLabel]="loc.t('crawl.snapshotTable')"
      [columns]="columns()"
    >
      <div
        class="snapshot-body"
        [style.--snapshot-row-height]="rowHeight + 'px'"
        (scroll)="scrolled.emit($event)"
      >
        @if (!snapshots().length) {
          <p class="empty-list">{{ placeholder() }}</p>
        }

        <div class="snapshot-spacer" [style.height.px]="snapshots().length * rowHeight">
          @for (row of visibleRows(); track row.snapshot.id) {
            <button
              class="snapshot-row"
              type="button"
              role="row"
              [class.snapshot-row-selected]="selectedId() === row.snapshot.id"
              (click)="snapshotSelected.emit(row.snapshot.id)"
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
  `,
  styles: [
    `
      :host,
      .snapshot-list {
        display: block;
        min-height: 0;
        min-width: 0;
      }

      .snapshot-row {
        box-sizing: border-box;
        display: grid;
        gap: var(--space-3);
        min-width: var(--table-width);
      }

      .snapshot-body {
        height: 36rem;
        min-width: var(--table-width);
        overflow-x: hidden;
        overflow-y: auto;
        position: relative;
        scrollbar-gutter: stable;
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
    `
  ]
})
export class IngestionSnapshotTableComponent {
  readonly loc = inject(LocalizationService);

  readonly auth = input.required<boolean>();
  readonly columns = input.required<readonly ResizableTableColumn[]>();
  readonly loadState = input.required<"idle" | "loading" | "success" | "error">();
  readonly selectedId = input.required<string | null>();
  readonly snapshots = input.required<readonly IngestionSnapshotListItem[]>();
  readonly scrolled = output<Event>();
  readonly snapshotSelected = output<string>();

  readonly rowHeight = 74;
  readonly viewportHeight = 576;
  readonly scrollTop = input.required<number>();
  readonly visibleRows = computed<VisibleSnapshotRow[]>(() => {
    const snapshots = this.snapshots();
    const overscan = 5;
    const start = Math.max(0, Math.floor(this.scrollTop() / this.rowHeight) - overscan);
    const visibleCount = Math.ceil(this.viewportHeight / this.rowHeight) + overscan * 2;

    return snapshots.slice(start, start + visibleCount).map((snapshot, index) => ({
      offset: (start + index) * this.rowHeight,
      snapshot
    }));
  });

  formatDate(value: string): string {
    return value.slice(0, 10);
  }

  placeholder(): string {
    if (!this.auth()) {
      return this.loc.t("crawl.signInLoad");
    }

    if (this.loadState() === "loading") {
      return this.loc.t("crawl.loadingSnapshots");
    }

    return this.loc.t("crawl.noSnapshots");
  }

  processingStateLabel(snapshot: IngestionSnapshotListItem): string {
    const state = snapshot.processingState?.state ?? "pending";
    return this.loc.t(`processingState.${state}` as TranslationKey);
  }
}
