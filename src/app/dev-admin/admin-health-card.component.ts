import { Component, inject, input, output } from "@angular/core";

import { LocalizationService } from "../shared/localization.service";

export interface HealthCheckError {
  code?: string;
  message: string;
  name: string;
}

export interface HealthCheckItem {
  databaseName?: string | null;
  error?: HealthCheckError;
  id: string;
  label: string;
  message: string;
  status: string;
}

@Component({
  selector: "app-admin-health-card",
  standalone: true,
  template: `
    <article class="ui-panel-card status-panel utility-card" aria-live="polite">
      <div class="status-heading">
        <p class="ui-kicker">{{ loc.t("health.databaseKicker") }}</p>
        <p class="status-summary">{{ summary() }}</p>
      </div>

      @if (message()) {
        <p class="status-message">{{ message() }}</p>
      }

      <div class="button-row">
        <button
          class="run-button ui-button"
          type="button"
          (click)="runRequested.emit()"
          [disabled]="loading()"
        >
          {{ loading() ? loc.t("health.checking") : loc.t("health.run") }}
        </button>
      </div>

      @if (checks().length) {
        <div class="check-list" [attr.aria-label]="loc.t('common.healthCheck')">
          @for (check of checks(); track check.id) {
            <article
              class="check-card"
              [class.check-card-ok]="check.status === 'ok'"
              [class.check-card-problem]="check.status !== 'ok'"
            >
              <div class="check-heading">
                <h2>{{ check.label }}</h2>
                <span>{{ check.status }}</span>
              </div>
              <p>{{ check.message }}</p>

              @if (check.databaseName !== undefined) {
                <dl>
                  <div>
                    <dt>{{ loc.t("common.database") }}</dt>
                    <dd>{{ check.databaseName ?? loc.t("common.notConfigured") }}</dd>
                  </div>
                </dl>
              }

              @if (check.error; as error) {
                <div class="error-block">
                  <p class="error-title">{{ error.name }}</p>
                  <p>{{ error.message }}</p>
                  @if (error.code) {
                    <p>{{ loc.t("common.code") }}: {{ error.code }}</p>
                  }
                </div>
              }
            </article>
          }
        </div>
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
      .status-message {
        color: var(--color-text);
        margin: 0;
      }

      .status-summary {
        font-size: 1.05rem;
        font-weight: 700;
      }

      .run-button {
        justify-self: start;
        min-width: 11rem;
      }

      .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .check-list {
        display: grid;
        gap: var(--space-3);
      }

      .check-card {
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: var(--space-3);
        padding: 1rem;
      }

      .check-card-ok {
        border-color: color-mix(in srgb, var(--color-accent-leaf) 36%, var(--color-card-tint) 64%);
      }

      .check-card-problem {
        border-color: color-mix(in srgb, var(--color-wood) 38%, var(--color-card-tint) 62%);
      }

      .check-heading {
        align-items: center;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      h2 {
        color: var(--color-text);
        font-size: 1rem;
        line-height: 1.25;
        margin: 0;
      }

      .check-heading span {
        background: color-mix(in srgb, var(--color-card-tint) 54%, var(--color-surface) 46%);
        border-radius: var(--radius-ui);
        color: var(--color-on-soft-accent);
        font-size: 0.78rem;
        font-weight: 700;
        padding: 0.35rem 0.55rem;
      }

      .check-card p {
        color: var(--color-text);
        margin: 0;
      }

      dl {
        display: grid;
        margin: 0;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        font-weight: 700;
        margin: 0;
        text-transform: uppercase;
      }

      dd {
        color: var(--color-text);
        font-size: 1rem;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .error-block {
        background: var(--surface-soft-background);
        border-radius: var(--radius-ui);
        display: grid;
        gap: 0.35rem;
        padding: 0.85rem;
      }

      .error-block .error-title {
        color: var(--color-text);
        font-weight: 700;
      }

      .error-block p {
        color: var(--color-text-muted);
        overflow-wrap: anywhere;
      }
    `
  ]
})
export class AdminHealthCardComponent {
  readonly loc = inject(LocalizationService);

  readonly checks = input.required<readonly HealthCheckItem[]>();
  readonly loading = input.required<boolean>();
  readonly message = input.required<string>();
  readonly summary = input.required<string>();
  readonly runRequested = output<void>();
}
