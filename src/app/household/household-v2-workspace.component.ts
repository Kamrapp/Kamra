import { Component, effect, inject, input, signal } from "@angular/core";
import { HouseholdV2Service, type HouseholdV2Workspace } from "./household-v2.service";

@Component({ selector: "app-household-v2-workspace", standalone: true, templateUrl: "./household-v2-workspace.component.html", styleUrl: "./household-v2-workspace.component.css" })
export class HouseholdV2WorkspaceComponent {
  readonly householdId = input("");
  readonly workspace = signal<HouseholdV2Workspace | null>(null);
  readonly errorMessage = signal("");
  readonly loadState = signal<"idle" | "loading" | "ready" | "error">("idle");
  private readonly service = inject(HouseholdV2Service);
  constructor() { effect(() => { const householdId = this.householdId(); if (householdId) void this.load(householdId); }); }
  async refresh(): Promise<void> { const householdId = this.householdId(); if (householdId) await this.load(householdId); }
  private async load(householdId: string): Promise<void> {
    this.loadState.set("loading"); this.errorMessage.set("");
    const result = await this.service.loadWorkspace(householdId);
    if (result.status === "error") { this.loadState.set("error"); this.errorMessage.set(result.message ?? "The household workspace could not be loaded."); return; }
    this.workspace.set(result.workspace ?? null); this.loadState.set("ready");
  }
}
