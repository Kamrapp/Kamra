import { Component, inject } from "@angular/core";

import { ToastService } from "./toast.service";

@Component({
  selector: "app-toast-host",
  standalone: true,
  template: `
    <section class="toast-stack" aria-live="assertive" aria-label="Notifications">
      @for (toast of toastService.toasts(); track toast.id) {
        <article class="toast" [class.toast-error]="toast.tone === 'error'" [class.toast-info]="toast.tone === 'info'" [class.toast-success]="toast.tone === 'success'" [class.toast-warning]="toast.tone === 'warning'">
          <p>{{ toast.message }}</p>
          <button type="button" aria-label="Dismiss notification" (click)="toastService.dismiss(toast.id)">×</button>
        </article>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .toast-stack {
        bottom: max(var(--space-5), env(safe-area-inset-bottom));
        display: grid;
        gap: 0.5rem;
        left: max(var(--space-5), env(safe-area-inset-left));
        position: fixed;
        width: min(24rem, calc(100vw - 2rem));
        z-index: 70;
      }

      .toast {
        align-items: start;
        background: color-mix(in srgb, white 86%, var(--color-surface) 14%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 18%, transparent);
        border-left-width: 0.3rem;
        border-radius: 8px;
        box-shadow: 0 1rem 2.4rem rgb(48 43 50 / 16%);
        color: var(--color-text);
        display: grid;
        gap: 0.65rem;
        grid-template-columns: minmax(0, 1fr) auto;
        padding: 0.8rem 0.9rem;
      }

      .toast p {
        font-size: 0.88rem;
        line-height: 1.45;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .toast button {
        background: transparent;
        border: 0;
        color: var(--color-text-muted);
        cursor: pointer;
        font: inherit;
        font-size: 1.1rem;
        line-height: 1;
        padding: 0;
      }

      .toast-error {
        border-left-color: color-mix(in srgb, #b42318 72%, white 28%);
      }

      .toast-info {
        border-left-color: color-mix(in srgb, var(--color-accent-sky) 68%, white 32%);
      }

      .toast-success {
        border-left-color: color-mix(in srgb, var(--color-accent-leaf-strong) 72%, white 28%);
      }

      .toast-warning {
        border-left-color: color-mix(in srgb, #c97b1d 72%, white 28%);
      }
    `
  ]
})
export class ToastHostComponent {
  protected readonly toastService = inject(ToastService);
}
