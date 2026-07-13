import { Component, computed, inject, signal } from "@angular/core";

import { AuthService } from "../auth.service";
import { LocalizationService } from "../shared/localization.service";

@Component({
  selector: "app-manual-page",
  standalone: true,
  template: `
    <section class="page-shell manual-page" aria-labelledby="manual-title">
      <article class="ui-shell-card manual-hero">
        <p class="ui-kicker">{{ loc.t("manual.kicker") }}</p>
        <h1 id="manual-title" class="page-title">{{ loc.t("manual.title") }}</h1>
        <p class="page-lead">{{ loc.t("manual.summary") }}</p>
      </article>

      <section class="manual-tab-section">
        <div class="manual-tabs" role="tablist" [attr.aria-label]="loc.t('manual.tabsLabel')">
          <button
            class="manual-tab"
            [class.active]="activeTab() === 'household'"
            role="tab"
            type="button"
            [attr.aria-selected]="activeTab() === 'household'"
            (click)="activeTab.set('household')"
          >
            {{ loc.t("manual.householdTab") }}
          </button>
          <button
            class="manual-tab"
            [class.active]="activeTab() === 'admin'"
            role="tab"
            type="button"
            [disabled]="!isAdmin()"
            [attr.aria-selected]="activeTab() === 'admin'"
            (click)="activeTab.set('admin')"
          >
            {{ loc.t("manual.adminTab") }}
          </button>
        </div>

        <div class="ui-panel-card manual-tab-panel" role="tabpanel">
          @if (activeTab() === "household") {
            <div class="manual-intro">
              <p class="ui-kicker">{{ loc.t("manual.householdKicker") }}</p>
              <h2 class="ui-card-title">{{ loc.t("manual.householdTitle") }}</h2>
              <p>{{ loc.t("manual.householdBody") }}</p>
            </div>
            <div class="manual-vocabulary" role="list">
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.stockTargetTerm") }}</strong>
                <span>{{ loc.t("manual.stockTargetDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.productTerm") }}</strong>
                <span>{{ loc.t("manual.productDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.batchTerm") }}</strong>
                <span>{{ loc.t("manual.batchDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.allocationTerm") }}</strong>
                <span>{{ loc.t("manual.allocationDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.productConceptTerm") }}</strong>
                <span>{{ loc.t("manual.productConceptDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.shoppingListTerm") }}</strong>
                <span>{{ loc.t("manual.shoppingListDefinition") }}</span>
              </div>
            </div>
          } @else {
            <div class="manual-intro">
              <p class="ui-kicker">{{ loc.t("manual.adminKicker") }}</p>
              <h2 class="ui-card-title">{{ loc.t("manual.adminTitle") }}</h2>
              <p>{{ loc.t("manual.adminBody") }}</p>
            </div>
            <div class="manual-vocabulary" role="list">
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.crawlTerm") }}</strong>
                <span>{{ loc.t("manual.crawlDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.ingestionTerm") }}</strong>
                <span>{{ loc.t("manual.ingestionDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.catalogTerm") }}</strong>
                <span>{{ loc.t("manual.catalogDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.sourceProductTerm") }}</strong>
                <span>{{ loc.t("manual.sourceProductDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.priceObservationTerm") }}</strong>
                <span>{{ loc.t("manual.priceObservationDefinition") }}</span>
              </div>
              <div class="manual-term-row" role="listitem">
                <strong>{{ loc.t("manual.reviewTerm") }}</strong>
                <span>{{ loc.t("manual.reviewDefinition") }}</span>
              </div>
            </div>
          }
        </div>
      </section>
      @if (!isAdmin()) {
        <p class="ui-copy-muted admin-note">{{ loc.t("manual.adminDisabled") }}</p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }
      .manual-page {
        align-content: stretch;
        display: grid;
        gap: var(--space-3);
        grid-template-rows: auto minmax(0, 1fr) auto;
      }
      .manual-hero {
        align-content: start;
        background:
          radial-gradient(
            circle at top right,
            color-mix(in srgb, var(--color-accent-sky) 22%, transparent) 0,
            transparent 44%
          ),
          linear-gradient(
            145deg,
            color-mix(in srgb, var(--color-accent-leaf) 10%, var(--surface-shell-background)) 0%,
            var(--surface-shell-background) 54%,
            color-mix(in srgb, var(--color-accent-sand) 18%, var(--surface-shell-background)) 100%
          );
        display: grid;
        gap: var(--space-2);
        padding: clamp(0.85rem, 2vw, 1.2rem);
      }
      .manual-intro {
        display: grid;
        gap: var(--space-2);
      }
      .manual-hero p,
      .manual-intro p,
      .manual-vocabulary h2,
      .manual-vocabulary p {
        margin: 0;
      }
      .manual-tab-section {
        display: grid;
        gap: 0;
        grid-template-rows: auto minmax(0, 1fr);
        min-height: 0;
      }
      .manual-tabs {
        align-items: end;
        align-self: start;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .manual-tab {
        background: var(--surface-soft-background);
        border: 1px solid var(--line-panel);
        border-bottom-color: var(--line-strong);
        border-radius: var(--radius-ui) var(--radius-ui) 0 0;
        color: var(--color-text-muted);
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        min-height: 2.75rem;
        padding: 0.65rem 1rem;
      }
      .manual-tab.active {
        background: var(--surface-panel-background);
        border-bottom-color: var(--surface-panel-background);
        color: var(--color-text);
      }
      .manual-tab:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .manual-tab-panel {
        border-top-left-radius: 0;
        gap: var(--space-3);
        min-height: 0;
      }
      .manual-vocabulary {
        display: grid;
        gap: 0;
        grid-template-columns: 1fr;
        overflow: hidden;
      }
      .manual-term-row {
        align-items: center;
        border-bottom: 1px solid var(--line-subtle);
        display: grid;
        gap: var(--space-3);
        grid-template-columns: minmax(8rem, 0.34fr) minmax(0, 1fr);
        padding: 0.62rem 0;
      }
      .manual-term-row:last-child {
        border-bottom: 0;
      }
      .manual-term-row strong {
        color: var(--color-text);
        font-size: 0.88rem;
      }
      .manual-term-row span {
        color: var(--color-text-muted);
        font-size: 0.84rem;
        line-height: 1.32;
      }
      .admin-note {
        margin: 0;
      }
      @media (max-width: 700px) {
        .manual-term-row {
          gap: 0.2rem;
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class ManualPageComponent {
  readonly auth = inject(AuthService);
  readonly loc = inject(LocalizationService);
  readonly activeTab = signal<"admin" | "household">("household");
  readonly isAdmin = computed(() => this.auth.user()?.role === "admin");
}
