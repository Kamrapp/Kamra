import { Component, inject } from "@angular/core";

import { LocalizationService } from "./localization.service";
import { ToastService } from "./toast.service";

@Component({
  selector: "app-toast-host",
  standalone: true,
  template: `
    <section
      class="toast-stack"
      aria-live="assertive"
      [attr.aria-label]="loc.t('common.notifications')"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <article
          class="toast"
          [class.toast-error]="toast.tone === 'error'"
          [class.toast-info]="toast.tone === 'info'"
          [class.toast-success]="toast.tone === 'success'"
          [class.toast-warning]="toast.tone === 'warning'"
        >
          <p>{{ toast.message }}</p>
          <button
            type="button"
            [attr.aria-label]="loc.t('common.dismissNotification')"
            (click)="toastService.dismiss(toast.id)"
          >
            ×
          </button>
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
        background: var(--toast-background);
        border: 1px solid var(--line-panel);
        border-left-width: 0.3rem;
        border-radius: var(--radius-ui);
        box-shadow: var(--toast-shadow);
        color: var(--toast-text);
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
        color: var(--toast-text-muted);
        cursor: pointer;
        font: inherit;
        font-size: 1.1rem;
        line-height: 1;
        padding: 0;
      }

      .toast-error {
        border-left-color: var(--toast-error-border);
      }

      .toast-info {
        border-left-color: var(--toast-info-border);
      }

      .toast-success {
        border-left-color: var(--toast-success-border);
      }

      .toast-warning {
        border-left-color: var(--toast-warning-border);
      }
    `
  ]
})
export class ToastHostComponent {
  protected readonly loc = inject(LocalizationService);
  protected readonly toastService = inject(ToastService);
}
