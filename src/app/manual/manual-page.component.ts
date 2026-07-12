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
            <div class="manual-vocabulary">
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.stockTargetTerm") }}</h2>
                <p>{{ loc.t("manual.stockTargetDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.productTerm") }}</h2>
                <p>{{ loc.t("manual.productDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.batchTerm") }}</h2>
                <p>{{ loc.t("manual.batchDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.allocationTerm") }}</h2>
                <p>{{ loc.t("manual.allocationDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.productConceptTerm") }}</h2>
                <p>{{ loc.t("manual.productConceptDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.shoppingListTerm") }}</h2>
                <p>{{ loc.t("manual.shoppingListDefinition") }}</p>
              </article>
            </div>
          } @else {
            <div class="manual-intro">
              <p class="ui-kicker">{{ loc.t("manual.adminKicker") }}</p>
              <h2 class="ui-card-title">{{ loc.t("manual.adminTitle") }}</h2>
              <p>{{ loc.t("manual.adminBody") }}</p>
            </div>
            <div class="manual-vocabulary">
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.crawlTerm") }}</h2>
                <p>{{ loc.t("manual.crawlDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.ingestionTerm") }}</h2>
                <p>{{ loc.t("manual.ingestionDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.catalogTerm") }}</h2>
                <p>{{ loc.t("manual.catalogDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.sourceProductTerm") }}</h2>
                <p>{{ loc.t("manual.sourceProductDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.priceObservationTerm") }}</h2>
                <p>{{ loc.t("manual.priceObservationDefinition") }}</p>
              </article>
              <article class="ui-panel-card">
                <h2>{{ loc.t("manual.reviewTerm") }}</h2>
                <p>{{ loc.t("manual.reviewDefinition") }}</p>
              </article>
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
        gap: var(--space-3);
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
        gap: var(--space-2);
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .manual-vocabulary article {
        display: grid;
        gap: 0.25rem;
        padding: var(--space-2) var(--space-3);
      }
      .manual-vocabulary h2 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: 0.86rem;
      }
      .manual-vocabulary p {
        color: var(--color-text-muted);
        line-height: 1.3;
      }
      .admin-note {
        margin: 0;
      }
      @media (max-width: 700px) {
        .manual-vocabulary {
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
