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
                        class="rail-filter-secondary ui-button ui-button-quiet ui-button-sm"
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
            } @else if (section.loading) {
              <div class="rail-filter-placeholders" aria-hidden="true">
                @for (index of placeholderRows(section.placeholderRows); track index) {
                  <span></span>
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

          @case ("shopping") {
            <div class="rail-section-header">
              <div>
                <p class="rail-kicker">{{ section.kicker }}</p>
                @if (section.title) {
                  <p class="rail-title rail-section-title">{{ section.title }}</p>
                }
              </div>
            </div>

            <div class="rail-shopping-scale" [attr.aria-label]="section.title">
              <div class="rail-scale-track">
                <input
                  class="rail-scale-slider"
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  [value]="section.scaleIndex ?? 0"
                  [disabled]="section.actionDisabled"
                  [attr.aria-label]="section.title"
                  (input)="section.onScaleIndexChange?.($any($event.target).value)"
                />
                <div class="rail-scale-ticks" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div class="rail-scale-labels" aria-hidden="true">
                @for (option of section.scaleOptions ?? []; track option.key) {
                  <span [class.active-rail-scale-label]="option.active">
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.hint }}</small>
                  </span>
                }
              </div>
            </div>

            <div class="rail-shopping-count" aria-live="polite">
              <strong>{{ section.itemCount ?? 0 }}</strong>
              @if (section.itemCountLabel) {
                <span>{{ section.itemCountLabel }}</span>
              }
            </div>

            @if (section.actionLabel && section.onAction) {
              <button class="rail-cart-action" type="button" [disabled]="section.actionDisabled" (click)="section.onAction()">
                <span class="rail-cart-icon" aria-hidden="true">🛒</span>
                <span class="rail-cart-label">{{ section.actionLabel }}</span>
              </button>
            }

            <div class="rail-shopping-actions">
              @if (section.reloadActionLabel && section.onReloadAction) {
                <button class="ui-button ui-button-quiet ui-button-sm" type="button" [disabled]="section.reloadActionDisabled" (click)="section.onReloadAction()">
                  {{ section.reloadActionLabel }}
                </button>
              }
              @if (section.cancelActionLabel && section.onCancelAction) {
                <button class="ui-button ui-button-danger ui-button-sm" type="button" [disabled]="section.cancelActionDisabled" (click)="section.onCancelAction()">
                  {{ section.cancelActionLabel }}
                </button>
              }
            </div>
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
        font-size: 0.72rem;
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
        background: color-mix(in srgb, var(--color-accent-sky) 16%, var(--color-card-tint) 84%);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-on-soft-accent);
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

      .rail-filter-placeholders {
        display: grid;
        gap: 0.35rem;
        margin-top: 0.35rem;
      }

      .rail-filter-placeholders span {
        animation: rail-placeholder-pulse 1300ms ease-in-out infinite;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--surface-soft-background) 82%, transparent),
          color-mix(in srgb, var(--color-accent-sky) 18%, var(--surface-soft-background) 82%),
          color-mix(in srgb, var(--surface-soft-background) 82%, transparent)
        );
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        min-height: 2rem;
      }

      .rail-shopping-scale {
        align-items: center;
        display: grid;
        gap: var(--space-2);
        grid-template-columns: 2.45rem minmax(0, 1fr);
        min-height: 9.6rem;
      }

      .rail-scale-track {
        display: grid;
        height: 6.5rem;
        place-items: center;
        position: relative;
        width: 2.45rem;
      }

      .rail-scale-slider {
        appearance: none;
        background: transparent;
        cursor: pointer;
        direction: rtl;
        height: 6.5rem;
        margin: 0;
        position: relative;
        width: 2.2rem;
        writing-mode: vertical-lr;
        z-index: 1;
      }

      .rail-scale-slider:disabled {
        cursor: not-allowed;
        opacity: 0.72;
      }

      .rail-scale-slider::-webkit-slider-runnable-track {
        background: linear-gradient(to top, #75a547 0%, #75a547 24%, #ffe6a3 24%, #ffe6a3 48%, #f3ad54 48%, #f3ad54 72%, #d94c3c 72%, #d94c3c 100%);
        border: 1px solid color-mix(in srgb, var(--line-panel) 70%, transparent);
        border-radius: var(--radius-pill);
        box-shadow: inset 0 0.08rem 0.18rem rgb(40 31 21 / 18%);
        height: 6.5rem;
        width: 0.68rem;
      }

      .rail-scale-slider::-moz-range-track {
        background: linear-gradient(to top, #75a547 0%, #75a547 24%, #ffe6a3 24%, #ffe6a3 48%, #f3ad54 48%, #f3ad54 72%, #d94c3c 72%, #d94c3c 100%);
        border: 1px solid color-mix(in srgb, var(--line-panel) 70%, transparent);
        border-radius: var(--radius-pill);
        box-shadow: inset 0 0.08rem 0.18rem rgb(40 31 21 / 18%);
        height: 6.5rem;
        width: 0.68rem;
      }

      .rail-scale-slider::-webkit-slider-thumb {
        appearance: none;
        background: linear-gradient(180deg, #ffffff, color-mix(in srgb, var(--color-accent-leaf) 32%, #ffffff));
        border: 2px solid var(--color-accent-leaf);
        border-radius: 0.32rem;
        box-shadow: 0 0.35rem 0.8rem rgb(40 31 21 / 22%);
        height: 0.9rem;
        margin-left: -0.75rem;
        width: 2.05rem;
      }

      .rail-scale-slider::-moz-range-thumb {
        background: linear-gradient(180deg, #ffffff, color-mix(in srgb, var(--color-accent-leaf) 32%, #ffffff));
        border: 2px solid var(--color-accent-leaf);
        border-radius: 0.32rem;
        box-shadow: 0 0.35rem 0.8rem rgb(40 31 21 / 22%);
        height: 0.9rem;
        width: 2.05rem;
      }

      .rail-scale-ticks {
        display: flex;
        flex-direction: column;
        height: 6.25rem;
        justify-content: space-between;
        left: 0.25rem;
        pointer-events: none;
        position: absolute;
        top: 0.12rem;
        width: 2rem;
      }

      .rail-scale-ticks span {
        background: color-mix(in srgb, var(--color-text) 55%, transparent);
        border-radius: var(--radius-pill);
        height: 0.12rem;
        width: 0.5rem;
      }

      .rail-scale-labels {
        color: var(--color-text-muted);
        display: grid;
        font-size: 0.74rem;
        gap: 0.62rem;
        grid-template-rows: repeat(4, minmax(0, 1fr));
        line-height: 1.18;
      }

      .rail-scale-labels span {
        display: grid;
        gap: 0.1rem;
      }

      .rail-scale-labels strong {
        color: inherit;
        font-size: 0.76rem;
        font-weight: 900;
      }

      .rail-scale-labels small {
        color: var(--color-text-muted);
        font-size: 0.66rem;
        font-weight: 700;
      }

      .active-rail-scale-label {
        color: var(--color-text);
      }

      .rail-shopping-count {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        display: grid;
        gap: 0.15rem;
        justify-items: center;
        min-height: 4.8rem;
        padding: 0.55rem;
        text-align: center;
      }

      .rail-shopping-count strong {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: 2rem;
        line-height: 1;
      }

      .rail-shopping-count span {
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 800;
        line-height: 1.2;
      }

      .rail-cart-action {
        align-items: center;
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-floating-shadow);
        color: var(--color-text);
        cursor: pointer;
        display: grid;
        gap: 0.28rem;
        font: inherit;
        font-weight: 900;
        justify-items: center;
        justify-content: center;
        min-height: 4.2rem;
        padding: 0.55rem;
        text-align: center;
        width: 100%;
      }

      .rail-cart-icon {
        font-size: 1.55rem;
        line-height: 1;
      }

      .rail-cart-label {
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 900;
        line-height: 1.15;
      }

      .rail-cart-action:disabled {
        cursor: not-allowed;
        opacity: 0.62;
      }

      .rail-shopping-actions {
        display: grid;
        gap: var(--space-2);
      }

      .rail-shopping-actions .ui-button {
        width: 100%;
      }

      .sr-only {
        height: 1px;
        margin: -1px;
        overflow: hidden;
        position: absolute;
        width: 1px;
      }

      @keyframes rail-placeholder-pulse {
        0%,
        100% {
          opacity: 0.56;
        }

        50% {
          opacity: 0.92;
        }
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

  placeholderRows(count = 3): number[] {
    return Array.from({ length: count }, (_, index) => index);
  }
}
