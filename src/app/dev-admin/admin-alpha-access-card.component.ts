import { Component, inject, input, output } from "@angular/core";

import { LocalizationService } from "../shared/localization.service";

@Component({
  selector: "app-admin-alpha-access-card",
  standalone: true,
  template: `
    <article class="ui-panel-card status-panel utility-card alpha-access-card">
      <div class="status-heading">
        <p class="ui-kicker">{{ loc.t("health.alphaAccessKicker") }}</p>
        <p class="status-summary">{{ loc.t("health.alphaAccessTitle") }}</p>
      </div>
      <p class="status-message">{{ loc.t("health.alphaAccessDescription") }}</p>
      <label class="placeholder-row" for="controlled-alpha-access-flag">
        <span>{{ loc.t("health.alphaAccessEnabled") }}</span>
        <input
          id="controlled-alpha-access-flag"
          type="checkbox"
          [checked]="enabled()"
          [disabled]="featureFlagsLoading() || !admin()"
          (change)="enabledChanged.emit($any($event.target).checked)"
        />
      </label>
      <div class="alpha-form">
        <label for="alpha-user-email">{{ loc.t("health.alphaUserEmail") }}</label>
        <input
          id="alpha-user-email"
          type="email"
          autocomplete="off"
          [value]="email()"
          (input)="emailChanged.emit($any($event.target).value)"
        />
        <label for="alpha-user-password">{{ loc.t("health.alphaUserPassword") }}</label>
        <input
          id="alpha-user-password"
          type="password"
          autocomplete="new-password"
          [value]="password()"
          (input)="passwordChanged.emit($any($event.target).value)"
        />
      </div>
      <div class="button-row">
        <button
          class="run-button ui-button"
          type="button"
          (click)="saveRequested.emit()"
          [disabled]="busy()"
        >
          {{ featureFlagsLoading() ? loc.t("health.updating") : loc.t("health.saveAlphaAccess") }}
        </button>
        <button
          class="run-button ui-button"
          type="button"
          (click)="createRequested.emit()"
          [disabled]="busy() || !enabled()"
        >
          {{ userLoading() ? loc.t("health.creatingAlphaUser") : loc.t("health.createAlphaUser") }}
        </button>
      </div>
      @if (message()) {
        <p class="maintenance-message">{{ message() }}</p>
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .status-panel {
        gap: var(--space-4);
      }

      .utility-card {
        align-content: start;
        min-height: 16rem;
      }

      .status-heading {
        display: grid;
        gap: 0.35rem;
      }

      .status-summary,
      .status-message,
      .maintenance-message {
        color: var(--color-text);
        margin: 0;
      }

      .status-summary {
        font-size: 1.05rem;
        font-weight: 700;
      }

      .placeholder-row {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        display: flex;
        justify-content: space-between;
        padding: 0.85rem 0.95rem;
      }

      .alpha-form {
        display: grid;
        gap: 0.35rem;
      }

      .alpha-form label {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
      }

      .alpha-form input {
        background: var(--form-field-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.15rem;
        padding: 0.45rem 0.62rem;
        width: 100%;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .run-button {
        justify-self: start;
        min-width: 11rem;
      }

      .maintenance-message {
        color: var(--color-text-muted);
        font-size: 0.95rem;
        line-height: 1.5;
      }
    `
  ]
})
export class AdminAlphaAccessCardComponent {
  readonly loc = inject(LocalizationService);

  readonly admin = input.required<boolean>();
  readonly busy = input.required<boolean>();
  readonly email = input.required<string>();
  readonly enabled = input.required<boolean>();
  readonly featureFlagsLoading = input.required<boolean>();
  readonly message = input.required<string>();
  readonly password = input.required<string>();
  readonly userLoading = input.required<boolean>();
  readonly createRequested = output<void>();
  readonly emailChanged = output<string>();
  readonly enabledChanged = output<boolean>();
  readonly passwordChanged = output<string>();
  readonly saveRequested = output<void>();
}
