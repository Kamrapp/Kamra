import { Component, computed, inject, signal, type OnInit } from "@angular/core";

import { buildApiUrl } from "../api-url";
import { AuthService } from "../auth.service";
import { readApiErrorMessage } from "../shared/api-errors";
import { LocalizationService } from "../shared/localization.service";
import {
  DatabaseMaintenanceEntryComponent,
  type DatabaseMaintenanceEntry,
  type MaintenanceAction
} from "./database-maintenance-entry.component";

@Component({
  selector: "app-database-maintenance",
  standalone: true,
  imports: [DatabaseMaintenanceEntryComponent],
  templateUrl: "./database-maintenance.component.html",
  styleUrl: "./database-maintenance.component.css"
})
export class DatabaseMaintenanceComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly loc = inject(LocalizationService);
  readonly entries = signal<DatabaseMaintenanceEntry[]>([]);
  readonly loadState = signal<"idle" | "loading" | "error">("idle");
  readonly message = signal("");
  readonly busyKey = signal<string | null>(null);
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
