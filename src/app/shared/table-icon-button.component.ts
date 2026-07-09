import { Component, input, output } from "@angular/core";

@Component({
  selector: "app-table-icon-button",
  standalone: true,
  template: `
    <button
      class="table-icon-button"
      type="button"
      [attr.aria-label]="ariaLabel()"
      [title]="titleText()"
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
    `
  ]
})
export class TableIconButtonComponent {
  readonly ariaLabel = input.required<string>();
  readonly titleText = input.required<string>();
  readonly press = output<void>();
}
