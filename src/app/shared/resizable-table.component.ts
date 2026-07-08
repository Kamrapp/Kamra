import { Component, computed, input, signal } from "@angular/core";

export interface ResizableTableColumn {
  key: string;
  label: string;
  maxWidth?: number;
  minWidth?: number;
  width: number;
}

@Component({
  selector: "app-resizable-table",
  standalone: true,
  template: `
    <section class="resizable-table surface-panel" [attr.aria-label]="ariaLabel()">
      <div
        #topScroller
        class="table-top-scroll"
        aria-hidden="true"
        (scroll)="syncHorizontalScroll($event, tableScroller)"
      >
        <div class="table-top-scroll-width" [style.width.px]="tableWidth()"></div>
      </div>

      <div
        #tableScroller
        class="table-x-scroll"
        role="table"
        [attr.aria-label]="ariaLabel()"
        [style.--table-width]="tableWidth() + 'px'"
        (scroll)="syncHorizontalScroll($event, topScroller)"
      >
        <div class="table-head" role="row" [style.grid-template-columns]="columnTemplate()">
          @for (column of columns(); track column.key) {
            <span class="column-header" role="columnheader">
              {{ column.label }}
              <button
                class="column-resize-handle"
                type="button"
                title="Resize column"
                [attr.aria-label]="'Resize ' + column.label + ' column'"
                (pointerdown)="startColumnResize($event, column.key)"
              ></button>
            </span>
          }
        </div>

        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .resizable-table {
        min-width: 0;
        overflow: hidden;
      }

      .table-x-scroll {
        max-width: 100%;
        overflow-x: auto;
      }

      .table-top-scroll {
        border-bottom: 1px solid var(--line-subtle);
        height: 0.9rem;
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
      }

      .table-top-scroll-width {
        height: 1px;
      }

      .table-head {
        background: color-mix(in srgb, var(--color-wood-deep) 12%, var(--color-surface) 88%);
        border-bottom: 1px solid var(--line-strong);
        box-sizing: border-box;
        color: var(--color-text-muted);
        display: grid;
        font-size: var(--resizable-table-header-size, 0.76rem);
        font-weight: 800;
        gap: var(--space-3);
        letter-spacing: 0;
        min-width: var(--table-width);
        padding: var(--resizable-table-header-padding, 0.8rem 1rem);
        text-transform: uppercase;
      }

      .column-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
        min-width: 0;
        position: relative;
      }

      .column-resize-handle {
        background: color-mix(in srgb, var(--color-wood-deep) 22%, transparent);
        border: 0;
        border-radius: var(--radius-ui);
        cursor: col-resize;
        height: 1.5rem;
        margin-left: 0.5rem;
        padding: 0;
        position: relative;
        width: 0.45rem;
      }

      .column-resize-handle::after {
        background: color-mix(in srgb, var(--color-wood-deep) 42%, transparent);
        border-radius: var(--radius-pill);
        content: "";
        inset: 0.25rem 0.16rem;
        position: absolute;
      }
    `
  ]
})
export class ResizableTableComponent {
  readonly ariaLabel = input.required<string>();
  readonly columns = input.required<readonly ResizableTableColumn[]>();
  readonly columnWidths = signal<Record<string, number>>({});

  readonly columnTemplate = computed(() =>
    this.columns().map((column) => `${this.columnWidth(column)}px`).join(" ")
  );

  readonly tableWidth = computed(() =>
    this.columns().reduce((total, column) => total + this.columnWidth(column), 0)
      + (this.columns().length - 1) * 12
  );

  syncHorizontalScroll(event: Event, target: HTMLElement): void {
    const source = event.target;

    if (!(source instanceof HTMLElement) || target.scrollLeft === source.scrollLeft) {
      return;
    }

    target.scrollLeft = source.scrollLeft;
  }

  startColumnResize(event: PointerEvent, columnKey: string): void {
    event.preventDefault();
    const column = this.columns().find((candidate) => candidate.key === columnKey);

    if (!column) {
      return;
    }

    const startX = event.clientX;
    const startWidth = this.columnWidth(column);
    const minWidth = column.minWidth ?? 120;
    const maxWidth = column.maxWidth ?? 720;
    const onPointerMove = (moveEvent: PointerEvent): void => {
      const nextWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + moveEvent.clientX - startX));
      this.columnWidths.update((currentWidths) => ({
        ...currentWidths,
        [columnKey]: nextWidth
      }));
    };
    const onPointerUp = (): void => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }

  private columnWidth(column: ResizableTableColumn): number {
    return this.columnWidths()[column.key] ?? column.width;
  }
}
