import { Component, inject, input, output } from "@angular/core";

import { LocalizationService } from "../shared/localization.service";

export type ShoppingListCompletionMode = "tick_all_and_update" | "update_ticked_only";

@Component({
  selector: "app-shopping-list-completion-panel",
  standalone: true,
  template: `
    <section class="confirmation-panel">
      <p>{{ loc.t("household.shoppingListConfirmationPrompt") }}</p>
      <div class="confirmation-actions">
        @if (allowedModes().includes("tick_all_and_update")) {
          <button
            class="ui-button ui-button-sm"
            [class.ui-button-primary]="isPrimaryMode('tick_all_and_update')"
            [class.ui-button-quiet]="!isPrimaryMode('tick_all_and_update')"
            type="button"
            (click)="confirmRequested.emit('tick_all_and_update')"
          >
            {{ loc.t("household.tickAllAndApply") }}
          </button>
        }
        @if (allowedModes().includes("update_ticked_only")) {
          <button
            class="ui-button ui-button-sm"
            [class.ui-button-primary]="isPrimaryMode('update_ticked_only')"
            [class.ui-button-quiet]="!isPrimaryMode('update_ticked_only')"
            type="button"
            (click)="confirmRequested.emit('update_ticked_only')"
          >
            {{ loc.t("household.applyTickedOnly") }}
          </button>
        }
        <button class="ui-button ui-button-danger ui-button-sm" type="button" (click)="cancelRequested.emit()">
          {{ loc.t("common.close") }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .confirmation-panel {
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: var(--space-2);
        padding: 0.9rem 1rem;
      }

      .confirmation-panel p {
        margin: 0;
      }

      .confirmation-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }
    `
  ]
})
export class ShoppingListCompletionPanelComponent {
  readonly loc = inject(LocalizationService);

  readonly allowedModes = input.required<readonly ShoppingListCompletionMode[]>();
  readonly confirmRequested = output<ShoppingListCompletionMode>();
  readonly cancelRequested = output<void>();

  isPrimaryMode(mode: ShoppingListCompletionMode): boolean {
    return this.allowedModes()[0] === mode;
  }
}
