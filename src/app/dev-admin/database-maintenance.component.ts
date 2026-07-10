import { Component, computed, inject, signal, type OnInit } from "@angular/core";

import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService } from "../shared/localization.service";

interface DatabaseMaintenanceEntry {
  details: string;
  id: string;
  migrationCompleted: boolean;
  title: string;
  validatorUpdated: boolean;
}

type MaintenanceAction = "migration" | "validator";

@Component({
  selector: "app-database-maintenance",
  standalone: true,
  template: `
    <section class="maintenance-section" aria-labelledby="database-maintenance-title">
      <div class="section-heading">
        <p class="ui-kicker">{{ loc.t("health.databaseMaintenanceKicker") }}</p>
        <h2 id="database-maintenance-title">{{ loc.t("health.databaseMaintenanceTitle") }}</h2>
        <p>{{ loc.t("health.databaseMaintenanceDescription") }}</p>
        <button
          class="ui-button ui-button-warm run-all-button"
          type="button"
          [disabled]="busyKey() !== null || activeEntries().length === 0"
          (click)="runAll()"
        >
          {{ busyKey() === "run-all" ? loc.t("health.runningAll") : loc.t("health.runAll") }}
        </button>
      </div>

      @if (!auth.token()) {
        <p class="maintenance-message">{{ loc.t("health.signInBeforeMaintenance") }}</p>
      } @else if (!auth.user()) {
        <p class="maintenance-message">{{ loc.t("health.checkingAccess") }}</p>
      } @else if (auth.user()?.role !== "admin") {
        <p class="maintenance-message">{{ loc.t("health.adminOnlyDescription") }}</p>
      } @else {
        @if (message(); as currentMessage) {
          <p class="maintenance-message" aria-live="polite">{{ currentMessage }}</p>
        }

        @if (loadState() === "loading") {
          <p class="maintenance-message">{{ loc.t("health.loadingDatabaseMaintenance") }}</p>
        } @else {
          <div class="maintenance-table" role="table" [attr.aria-label]="loc.t('health.databaseMaintenanceTitle')">
            <div class="maintenance-table-row maintenance-table-header" role="row">
              <span role="columnheader">{{ loc.t("health.databaseMaintenanceEntry") }}</span>
              <span role="columnheader">{{ loc.t("health.updateValidators") }}</span>
              <span role="columnheader">{{ loc.t("health.migrateExistingData") }}</span>
              <span role="columnheader" class="details-column">{{ loc.t("health.details") }}</span>
              <span role="columnheader">{{ loc.t("health.markAsComplete") }}</span>
            </div>

            <div class="active-entries-scroll">
              @for (entry of activeEntries(); track entry.id) {
                <div class="maintenance-table-row" role="row" (mouseleave)="hideDetails()">
                  <strong role="cell">{{ entry.title }}</strong>
                  <button
                    class="ui-button ui-button-warm"
                    type="button"
                    [disabled]="entry.validatorUpdated || busyKey() !== null"
                    (click)="runAction(entry, 'validator')"
                  >
                    {{ busyKey() === entry.id + ':validator' ? loc.t("health.updating") : loc.t("health.updateValidators") }}
                  </button>
                  <button
                    class="ui-button ui-button-warm"
                    type="button"
                    [disabled]="entry.migrationCompleted || busyKey() !== null"
                    (click)="runAction(entry, 'migration')"
                  >
                    {{ busyKey() === entry.id + ':migration' ? loc.t("health.updating") : loc.t("health.migrateExistingData") }}
                  </button>
                  <span class="details-wrap" (mouseenter)="showDetails(entry.id)" (focusin)="showDetails(entry.id)">
                    <button
                      class="details-button"
                      type="button"
                      [attr.aria-label]="loc.t('health.showDatabaseMaintenanceDetails')"
                      [attr.title]="loc.t('health.showDatabaseMaintenanceDetails')"
                    >
                      <span aria-hidden="true">⌕</span>
                    </button>
                  </span>
                  <button
                    class="ui-button ui-button-quiet"
                    type="button"
                    [disabled]="busyKey() !== null"
                    (click)="markComplete(entry)"
                  >
                    {{ loc.t("health.markAsComplete") }}
                  </button>
                  @if (hoveredDetailsId() === entry.id) {
                    <p class="details-note" role="tooltip">{{ entry.details }}</p>
                  }
                </div>
              }
            </div>

            @if (finishedEntries().length > 0) {
              <details class="finished-entries">
                <summary>
                  <span>{{ loc.t("health.finishedDatabaseMaintenance") }}</span>
                  <span>{{ finishedEntries().length }}</span>
                </summary>
                <div class="finished-entries-scroll">
                  @for (entry of finishedEntries(); track entry.id) {
                    <div class="maintenance-table-row finished-row" role="row" (mouseleave)="hideDetails()">
                  <strong role="cell">{{ entry.title }}</strong>
                  <span class="completed-label">{{ loc.t("health.completed") }}</span>
                  <span class="completed-label">{{ loc.t("health.completed") }}</span>
                  <span class="details-wrap" (mouseenter)="showDetails(entry.id)" (focusin)="showDetails(entry.id)">
                    <button
                      class="details-button"
                      type="button"
                      [attr.aria-label]="loc.t('health.showDatabaseMaintenanceDetails')"
                      [attr.title]="loc.t('health.showDatabaseMaintenanceDetails')"
                    >
                      <span aria-hidden="true">⌕</span>
                    </button>
                  </span>
                  <span class="completed-label">{{ loc.t("health.completed") }}</span>
                  @if (hoveredDetailsId() === entry.id) {
                    <p class="details-note" role="tooltip">{{ entry.details }}</p>
                  }
                    </div>
                  }
                </div>
              </details>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host {
      display: block;
      grid-column: 1;
      min-width: 0;
    }

    .maintenance-section {
      background: var(--surface-panel-background);
      border: 1px solid var(--line-panel);
      border-radius: var(--radius-ui);
      display: grid;
      gap: var(--space-4);
      justify-self: start;
      padding: var(--space-4);
      width: 100%;
    }

    .section-heading,
    .section-heading p,
    .section-heading h2 {
      margin: 0;
    }

    .section-heading {
      display: grid;
      gap: 0.35rem;
    }

    .section-heading h2 {
      color: var(--color-text);
      font-size: 1.15rem;
    }

    .section-heading p:last-child,
    .maintenance-message {
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .maintenance-table {
      display: grid;
      gap: 0.45rem;
      min-width: 0;
    }

    .active-entries-scroll,
    .finished-entries-scroll {
      display: grid;
      gap: 0.45rem;
      max-height: min(22rem, 40vh);
      min-width: 0;
      overflow-y: auto;
      padding-right: 0.25rem;
      scrollbar-gutter: stable;
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

    .maintenance-table-header {
      background: transparent;
      border: 0;
      color: var(--color-text-muted);
      font-size: 0.72rem;
      font-weight: 800;
      min-height: 0;
      padding-block: 0.1rem;
      text-transform: uppercase;
    }

    .maintenance-table-row strong {
      color: var(--color-text);
      overflow-wrap: anywhere;
    }

    .maintenance-table-row .ui-button {
      min-width: 9.4rem;
    }

    .run-all-button {
      justify-self: start;
      margin-top: 0.35rem;
    }

    .details-column {
      text-align: center;
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

    .finished-entries {
      border-top: 1px solid var(--line-subtle);
      margin-top: var(--space-4);
      padding-top: var(--space-3);
    }

    .finished-entries summary {
      align-items: center;
      color: var(--color-text-muted);
      cursor: pointer;
      display: flex;
      font-size: 0.78rem;
      font-weight: 800;
      justify-content: space-between;
      text-transform: uppercase;
    }

    .finished-entries-scroll {
      margin-top: var(--space-3);
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
      .maintenance-table-header {
        display: none;
      }

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
  `]
})
export class DatabaseMaintenanceComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly loc = inject(LocalizationService);
  readonly entries = signal<DatabaseMaintenanceEntry[]>([]);
  readonly loadState = signal<"idle" | "loading" | "error">("idle");
  readonly message = signal("");
  readonly busyKey = signal<string | null>(null);
  readonly hoveredDetailsId = signal<string | null>(null);
  readonly activeEntries = computed(() => this.entries().filter((entry) => !entry.validatorUpdated || !entry.migrationCompleted));
  readonly finishedEntries = computed(() => this.entries().filter((entry) => entry.validatorUpdated && entry.migrationCompleted));

  ngOnInit(): void {
    void this.loadEntries();
  }

  async loadEntries(): Promise<void> {
    this.loadState.set("loading");
    this.message.set("");

    try {
      const response = await fetch(buildApiUrl("/api/admin/database-maintenance"), {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "GET"
      });
      if (!response.ok) {
        this.message.set(await readApiErrorMessage(response, this.loc.t("health.databaseMaintenanceLoadFailure")));
        this.loadState.set("error");
        return;
      }

      const payload = (await response.json()) as { entries?: DatabaseMaintenanceEntry[] };
      this.entries.set(payload.entries ?? []);
      this.loadState.set("idle");
    } catch {
      this.message.set(this.loc.t("health.databaseMaintenanceLoadFailure"));
      this.loadState.set("error");
    }
  }

  showDetails(entryId: string): void {
    this.hoveredDetailsId.set(entryId);
  }

  hideDetails(): void {
    this.hoveredDetailsId.set(null);
  }

  async runAction(entry: DatabaseMaintenanceEntry, action: MaintenanceAction): Promise<void> {
    const key = `${entry.id}:${action}`;
    this.busyKey.set(key);
    this.message.set("");

    try {
      const response = await fetch(buildApiUrl(`/api/admin/database-maintenance/${action === "validator" ? "validators" : "migrations"}`), {
        body: JSON.stringify({ entryId: entry.id }),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });
      if (!response.ok) {
        this.message.set(await readApiErrorMessage(response, this.loc.t("health.databaseMaintenanceActionFailure")));
        return;
      }

      await this.loadEntries();
    } catch {
      this.message.set(this.loc.t("health.databaseMaintenanceActionFailure"));
    } finally {
      this.busyKey.set(null);
    }
  }

  async markComplete(entry: DatabaseMaintenanceEntry): Promise<void> {
    this.busyKey.set(`${entry.id}:complete`);
    this.message.set("");

    try {
      const response = await fetch(buildApiUrl("/api/admin/database-maintenance/complete"), {
        body: JSON.stringify({ entryId: entry.id }),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });
      if (!response.ok) {
        this.message.set(await readApiErrorMessage(response, this.loc.t("health.databaseMaintenanceActionFailure")));
        return;
      }

      await this.loadEntries();
    } catch {
      this.message.set(this.loc.t("health.databaseMaintenanceActionFailure"));
    } finally {
      this.busyKey.set(null);
    }
  }

  async runAll(): Promise<void> {
    this.busyKey.set("run-all");
    this.message.set("");

    try {
      const response = await fetch(buildApiUrl("/api/admin/database-maintenance/run-all"), {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "POST"
      });
      if (!response.ok) {
        this.message.set(await readApiErrorMessage(response, this.loc.t("health.databaseMaintenanceActionFailure")));
        await this.loadEntries();
        return;
      }

      await this.loadEntries();
    } catch {
      this.message.set(this.loc.t("health.databaseMaintenanceActionFailure"));
    } finally {
      this.busyKey.set(null);
    }
  }
}
