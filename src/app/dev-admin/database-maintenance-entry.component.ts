import { Component, inject, input, output, signal } from "@angular/core";

import { LocalizationService } from "../shared/localization.service";

export interface DatabaseMaintenanceEntry {
  details: string;
  id: string;
  migrationCompleted: boolean;
  title: string;
  validatorUpdated: boolean;
}

export type MaintenanceAction = "migration" | "validator";

@Component({
  selector: "app-database-maintenance-entry",
  standalone: true,
  template: `
    <div
      class="maintenance-table-row"
      [class.finished-row]="finished()"
      role="row"
      (mouseleave)="detailsOpen.set(false)"
    >
      <strong role="cell">{{ entry().title }}</strong>
      @if (finished()) {
        <span class="completed-label">{{ loc.t("health.completed") }}</span>
        <span class="completed-label">{{ loc.t("health.completed") }}</span>
      } @else {
        <button
          class="ui-button ui-button-warm"
          type="button"
          [disabled]="entry().validatorUpdated || busyKey() !== null"
          (click)="actionRequested.emit('validator')"
        >
          {{
            busyKey() === entry().id + ":validator"
              ? loc.t("health.updating")
              : loc.t("health.updateValidators")
          }}
        </button>
        <button
          class="ui-button ui-button-warm"
          type="button"
          [disabled]="entry().migrationCompleted || busyKey() !== null"
          (click)="actionRequested.emit('migration')"
        >
          {{
            busyKey() === entry().id + ":migration"
              ? loc.t("health.updating")
              : loc.t("health.migrateExistingData")
          }}
        </button>
      }

      <span
        class="details-wrap"
        (mouseenter)="detailsOpen.set(true)"
        (focusin)="detailsOpen.set(true)"
      >
        <button
          class="details-button"
          type="button"
          [attr.aria-label]="loc.t('health.showDatabaseMaintenanceDetails')"
          [attr.title]="loc.t('health.showDatabaseMaintenanceDetails')"
        >
          <span aria-hidden="true">⌕</span>
        </button>
      </span>

      @if (finished()) {
        <span class="completed-label">{{ loc.t("health.completed") }}</span>
      } @else {
        <button
          class="ui-button ui-button-quiet"
          type="button"
          [disabled]="busyKey() !== null"
          (click)="completeRequested.emit()"
        >
          {{ loc.t("health.markAsComplete") }}
        </button>
      }

      @if (detailsOpen()) {
        <p class="details-note" role="tooltip">{{ entry().details }}</p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .maintenance-table-row {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: var(--space-3);
        grid-template-columns: minmax(10rem, 1fr) auto auto 2.8rem auto;
        min-height: 3.6rem;
        padding: 0.55rem 0.7rem;
      }

      .maintenance-table-row strong {
        color: var(--color-text);
        overflow-wrap: anywhere;
      }

      .maintenance-table-row .ui-button {
        min-width: 9.4rem;
      }

      .details-wrap {
        justify-self: center;
      }

      .details-button {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-strong);
        border-radius: var(--radius-pill);
        color: var(--color-text);
        cursor: help;
        display: inline-flex;
        font-size: 1.45rem;
        height: 2.35rem;
        justify-content: center;
        line-height: 1;
        width: 2.35rem;
      }

      .details-note {
        background: color-mix(in srgb, var(--color-text) 12%, var(--surface-soft-background) 88%);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        grid-column: 1 / -1;
        font-size: 0.88rem;
        line-height: 1.45;
        margin: 0;
        overflow-wrap: anywhere;
        padding: 0.85rem 1rem;
        text-indent: 0.2rem;
        white-space: normal;
      }

      .finished-row {
        opacity: 0.7;
      }

      .completed-label {
        color: var(--color-accent-leaf-strong);
        font-size: 0.82rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      @media (max-width: 760px) {
        .maintenance-table-row {
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .maintenance-table-row .ui-button {
          min-width: 0;
          width: 100%;
        }

        .maintenance-table-row strong {
          grid-column: 1 / -1;
        }

        .details-wrap {
          grid-column: 2;
          grid-row: 2 / span 2;
        }

        .maintenance-table-row > .ui-button:last-child,
        .completed-label:last-child {
          grid-column: 1 / -1;
        }
      }
    `
  ]
})
export class DatabaseMaintenanceEntryComponent {
  readonly loc = inject(LocalizationService);

  readonly busyKey = input.required<string | null>();
  readonly entry = input.required<DatabaseMaintenanceEntry>();
  readonly finished = input.required<boolean>();
  readonly actionRequested = output<MaintenanceAction>();
  readonly completeRequested = output<void>();
  readonly detailsOpen = signal(false);
}
