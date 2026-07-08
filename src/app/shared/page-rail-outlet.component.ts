import { Component, effect, input, signal } from "@angular/core";

import type { PageRailSection } from "./page-rail.service";

@Component({
  selector: "app-page-rail-outlet",
  standalone: true,
  template: `
    @for (section of sections(); track section.key) {
      <section class="page-rail-card" [attr.aria-label]="section.kicker">
        @switch (section.kind) {
          @case ("summary") {
            <div class="rail-section-header">
              <div>
                <p class="rail-kicker">{{ section.kicker }}</p>
                @if (section.title) {
                  <p class="rail-title rail-section-title">{{ section.title }}</p>
                }
              </div>

              @if (section.actionLabel && section.onAction) {
                <button class="ui-action-button rail-action" type="button" [disabled]="section.actionDisabled" (click)="section.onAction()">
                  {{ section.actionLabel }}
                </button>
              }
            </div>

            @if (section.items?.length) {
              <dl class="rail-summary-grid">
                @for (item of section.items; track item.label) {
                  <div>
                    <dt>{{ item.label }}</dt>
                    <dd>{{ item.value }}</dd>
                  </div>
                }
              </dl>
            }

            @if (section.note) {
              <p class="rail-message">{{ section.note }}</p>
            }

            @if (section.error) {
              <p class="error-message">{{ section.error }}</p>
            }
          }

          @case ("status") {
            <div class="rail-section-header">
              <div>
                <p class="rail-kicker">{{ section.kicker }}</p>
                @if (section.title) {
                  <p class="rail-title rail-section-title">{{ section.title }}</p>
                }
              </div>

              @if (section.actionLabel && section.onAction) {
                <button class="ui-action-button rail-action" type="button" [disabled]="section.actionDisabled" (click)="section.onAction()">
                  {{ section.actionLabel }}
                </button>
              }
            </div>

            @if (section.message) {
              <p class="rail-message">{{ section.message }}</p>
            }

            @if (section.error) {
              <p class="error-message">{{ section.error }}</p>
            }
          }

          @case ("filters") {
            <div class="rail-section-header">
              <div>
                <p class="rail-kicker">{{ section.kicker }}</p>
                @if (section.title) {
                  <div class="rail-filter-title-row">
                    <button
                      class="rail-filter-toggle"
                      type="button"
                      [attr.aria-expanded]="openFilterKey() === section.key"
                      (click)="toggleRailFilter(section.key)"
                    >
                      <span class="rail-title rail-section-title">{{ section.title }}</span>
                      <span class="rail-filter-count">
                        {{ section.selectedCount ?? 0 }}/{{ section.optionCount ?? section.options?.length ?? 0 }}
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 24 24" class="rail-filter-icon">
                        <path d="M7 10.5 12 15.5 17 10.5H7Z"></path>
                      </svg>
                    </button>

                    @if (section.secondaryActionLabel && section.onSecondaryAction) {
                      <button
                        class="rail-filter-secondary"
                        type="button"
                        [disabled]="section.secondaryActionDisabled"
                        (click)="section.onSecondaryAction()"
                      >
                        {{ section.secondaryActionLabel }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>

            @if (section.note) {
              <p class="rail-message">{{ section.note }}</p>
            }

            @if (section.options?.length) {
              <div class="rail-filter-popover" [class.rail-filter-popover-open]="openFilterKey() === section.key">
                @for (option of section.options; track option.key) {
                  <label class="rail-filter-option">
                    <input type="checkbox" [checked]="option.checked" (change)="option.onToggle()" />
                    <span>{{ option.label }}</span>
                  </label>
                }
              </div>
            }
          }

          @case ("action") {
            <div class="rail-section-header">
              <div>
                <p class="rail-kicker">{{ section.kicker }}</p>
                @if (section.title) {
                  <p class="rail-title rail-section-title">{{ section.title }}</p>
                }
              </div>
            </div>

            @if (section.note) {
              <p class="rail-message">{{ section.note }}</p>
            }

            @if (section.error) {
              <p class="error-message">{{ section.error }}</p>
            }

            @if (section.actionLabel && section.onAction) {
              <button class="ui-action-button rail-action" type="button" [disabled]="section.actionDisabled" (click)="section.onAction()">
                {{ section.actionLabel }}
              </button>
            }
          }
        }
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .page-rail-card {
        backdrop-filter: blur(14px);
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-shell-shadow);
        display: grid;
        gap: 0.55rem;
        padding: 0.65rem 0.75rem;
      }

      .rail-kicker,
      .rail-title,
      .rail-message,
      .error-message {
        margin: 0;
      }

      .rail-kicker {
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .rail-title {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: 1.05rem;
        font-weight: 800;
        line-height: 1.1;
      }

      .rail-section-title {
        font-size: 0.93rem;
      }

      .rail-section-header {
        align-items: start;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      .rail-summary-grid {
        display: grid;
        gap: var(--space-2);
        grid-template-columns: 1fr;
        margin: 0;
      }

      .rail-summary-grid div {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: var(--space-2);
        grid-template-columns: minmax(0, 1fr) auto;
        min-height: 3rem;
        padding: 0.42rem 0.55rem;
      }

      .rail-summary-grid dd,
      .rail-summary-grid dt {
        margin: 0;
        min-width: 0;
      }

      .rail-summary-grid dd {
        color: var(--color-text);
        font-size: 0.8rem;
        font-weight: 800;
        overflow-wrap: anywhere;
        text-align: right;
      }

      .rail-summary-grid dt {
        font-size: 0.68rem;
      }

      .rail-message,
      .error-message {
        font-size: 0.82rem;
        line-height: 1.35;
      }

      .rail-message,
      .error-message {
        color: var(--color-text-muted);
      }

      .rail-action {
        min-height: 2rem;
        padding: 0.35rem 0.55rem;
      }

      .rail-filter-toggle {
        align-items: center;
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        display: inline-flex;
        gap: 0.45rem;
        padding: 0;
      }

      .rail-filter-title-row {
        align-items: center;
        display: flex;
        gap: 0.45rem;
        justify-content: space-between;
      }

      .rail-filter-count {
        color: var(--color-text-muted);
        font-size: 0.75rem;
        font-weight: 700;
        margin-left: 0.1rem;
      }

      .rail-filter-icon {
        color: var(--color-text-muted);
        height: 0.9rem;
        margin-left: 0.1rem;
        width: 0.9rem;
      }

      .rail-filter-secondary {
        background: var(--control-quiet-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        cursor: pointer;
        font: inherit;
        font-size: 0.72rem;
        font-weight: 800;
        min-height: 1.65rem;
        padding: 0.18rem 0.5rem;
        white-space: nowrap;
      }

      .rail-filter-popover {
        display: none;
        gap: 0.35rem;
        margin-top: 0.35rem;
        max-height: 14rem;
        overflow: auto;
        padding-right: 0.1rem;
      }

      .rail-filter-popover-open {
        display: grid;
      }

      .rail-filter-option {
        align-items: center;
        background: color-mix(in srgb, var(--color-accent-sky) 14%, white 86%);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: flex;
        font-size: 0.8rem;
        font-weight: 800;
        gap: 0.42rem;
        min-height: 2rem;
        padding: 0.3rem 0.55rem;
      }

      .rail-filter-option input {
        accent-color: var(--color-accent-leaf-strong);
        height: 0.95rem;
        width: 0.95rem;
      }
    `
  ]
})
export class PageRailOutletComponent {
  readonly resetToken = input(0);
  readonly sections = input<readonly PageRailSection[]>([]);
  readonly openFilterKey = signal<string | null>(null);
  private readonly resetOpenFilter = effect(() => {
    this.resetToken();
    this.openFilterKey.set(null);
  });

  toggleRailFilter(key: string): void {
    this.openFilterKey.set(this.openFilterKey() === key ? null : key);
  }
}
