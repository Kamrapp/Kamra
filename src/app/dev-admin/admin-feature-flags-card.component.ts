import { Component, inject, input, output } from "@angular/core";

import { LocalizationService } from "../shared/localization.service";

@Component({
  selector: "app-admin-feature-flags-card",
  standalone: true,
  template: `
    <article class="ui-panel-card status-panel utility-card placeholder-card">
      <div class="status-heading">
        <p class="ui-kicker">{{ loc.t("health.featureFlagsKicker") }}</p>
        <p class="status-summary">{{ loc.t("health.featureFlagsTitle") }}</p>
      </div>
      <p class="status-message">{{ loc.t("health.featureFlagsDescription") }}</p>
      <div class="placeholder-list">
        <label class="placeholder-row" for="shopping-list-auto-tick-flag">
          <span>{{ loc.t("health.featureFlagAutoTickAllShoppingListEntries") }}</span>
          <input
            id="shopping-list-auto-tick-flag"
            type="checkbox"
            [checked]="autoTickEnabled()"
            [disabled]="loading() || !admin()"
            (change)="autoTickChanged.emit($any($event.target).checked)"
          />
        </label>
        <label class="placeholder-row" for="abbreviated-ui-labels-flag">
          <span>Use abbreviated labels in compact UI</span>
          <input
            id="abbreviated-ui-labels-flag"
            type="checkbox"
            [checked]="abbreviatedUiLabelsEnabled()"
            [disabled]="loading() || !admin()"
            (change)="abbreviatedUiLabelsChanged.emit($any($event.target).checked)"
          />
        </label>
      </div>
      <div class="button-row">
        <button
          class="run-button ui-button"
          type="button"
          (click)="saveRequested.emit()"
          [disabled]="busy() || loading()"
        >
          {{ loading() ? loc.t("health.updating") : loc.t("common.save") }}
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

      .placeholder-card {
        background:
          linear-gradient(
            180deg,
            color-mix(in srgb, var(--surface-panel-background) 92%, white 8%),
            var(--surface-panel-background)
          ),
          radial-gradient(
            circle at top right,
            color-mix(in srgb, var(--color-accent-sky) 16%, transparent),
            transparent 55%
          );
      }

      .placeholder-list {
        display: grid;
        gap: var(--space-2);
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
export class AdminFeatureFlagsCardComponent {
  readonly loc = inject(LocalizationService);

  readonly admin = input.required<boolean>();
  readonly autoTickEnabled = input.required<boolean>();
  readonly abbreviatedUiLabelsEnabled = input.required<boolean>();
  readonly busy = input.required<boolean>();
  readonly loading = input.required<boolean>();
  readonly message = input.required<string>();
  readonly autoTickChanged = output<boolean>();
  readonly abbreviatedUiLabelsChanged = output<boolean>();
  readonly saveRequested = output<void>();
}
