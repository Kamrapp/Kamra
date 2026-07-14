import { Component, input, output } from "@angular/core";

export type TableIconButtonTone = "quiet" | "info" | "warning" | "danger";

@Component({
  selector: "app-table-icon-button",
  standalone: true,
  template: `
    <button
      class="table-icon-button"
      type="button"
      [attr.aria-label]="ariaLabel()"
      [title]="titleText()"
      [class.table-icon-button-info]="tone() === 'info'"
      [class.table-icon-button-warning]="tone() === 'warning'"
      [class.table-icon-button-danger]="tone() === 'danger'"
      (click)="press.emit()"
    >
      <ng-content />
    </button>
  `,
  styles: [
    `
      .table-icon-button {
        align-items: center;
        background: var(--control-quiet-background);
        border: 1px solid var(--control-quiet-border);
        border-radius: var(--radius-ui);
        color: var(--control-quiet-text);
        cursor: pointer;
        display: inline-flex;
        font: inherit;
        font-weight: 900;
        height: 2rem;
        justify-content: center;
        padding: 0;
        width: 2rem;
      }

      .table-icon-button-info {
        background: color-mix(
          in srgb,
          var(--color-accent-sky) 18%,
          var(--control-quiet-background)
        );
        border-color: color-mix(in srgb, var(--color-accent-sky) 42%, var(--control-quiet-border));
        color: var(--color-accent-sky);
      }

      .table-icon-button-warning {
        background: color-mix(
          in srgb,
          var(--color-status-warning) 18%,
          var(--control-quiet-background)
        );
        border-color: color-mix(
          in srgb,
          var(--color-status-warning) 42%,
          var(--control-quiet-border)
        );
        color: var(--color-status-warning);
      }

      .table-icon-button-danger {
        background: color-mix(
          in srgb,
          var(--color-status-danger) 18%,
          var(--control-quiet-background)
        );
        border-color: color-mix(
          in srgb,
          var(--color-status-danger) 42%,
          var(--control-quiet-border)
        );
        color: var(--color-status-danger-text);
      }
    `
  ]
})
export class TableIconButtonComponent {
  readonly ariaLabel = input.required<string>();
  readonly titleText = input.required<string>();
  readonly tone = input<TableIconButtonTone>("quiet");
  readonly press = output<void>();
}
