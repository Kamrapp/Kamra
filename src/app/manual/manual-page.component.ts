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

      <div class="manual-tabs" role="tablist" [attr.aria-label]="loc.t('manual.tabsLabel')">
        <button class="ui-button" [class.ui-button-primary]="activeTab() === 'household'" role="tab" type="button" [attr.aria-selected]="activeTab() === 'household'" (click)="activeTab.set('household')">{{ loc.t("manual.householdTab") }}</button>
        <button class="ui-button" [class.ui-button-primary]="activeTab() === 'admin'" role="tab" type="button" [disabled]="!isAdmin()" [attr.aria-selected]="activeTab() === 'admin'" (click)="activeTab.set('admin')">{{ loc.t("manual.adminTab") }}</button>
      </div>

      @if (activeTab() === 'household') {
        <article class="ui-panel-card manual-intro" role="tabpanel">
          <p class="ui-kicker">{{ loc.t("manual.householdKicker") }}</p>
          <h2 class="ui-card-title">{{ loc.t("manual.householdTitle") }}</h2>
          <p>{{ loc.t("manual.householdBody") }}</p>
        </article>
        <div class="manual-vocabulary">
          <article class="ui-panel-card"><h2>{{ loc.t("manual.stockTargetTerm") }}</h2><p>{{ loc.t("manual.stockTargetDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.productTerm") }}</h2><p>{{ loc.t("manual.productDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.batchTerm") }}</h2><p>{{ loc.t("manual.batchDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.allocationTerm") }}</h2><p>{{ loc.t("manual.allocationDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.productConceptTerm") }}</h2><p>{{ loc.t("manual.productConceptDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.shoppingListTerm") }}</h2><p>{{ loc.t("manual.shoppingListDefinition") }}</p></article>
        </div>
      } @else {
        <article class="ui-panel-card manual-intro" role="tabpanel">
          <p class="ui-kicker">{{ loc.t("manual.adminKicker") }}</p>
          <h2 class="ui-card-title">{{ loc.t("manual.adminTitle") }}</h2>
          <p>{{ loc.t("manual.adminBody") }}</p>
        </article>
        <div class="manual-vocabulary">
          <article class="ui-panel-card"><h2>{{ loc.t("manual.crawlTerm") }}</h2><p>{{ loc.t("manual.crawlDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.ingestionTerm") }}</h2><p>{{ loc.t("manual.ingestionDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.catalogTerm") }}</h2><p>{{ loc.t("manual.catalogDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.sourceProductTerm") }}</h2><p>{{ loc.t("manual.sourceProductDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.priceObservationTerm") }}</h2><p>{{ loc.t("manual.priceObservationDefinition") }}</p></article>
          <article class="ui-panel-card"><h2>{{ loc.t("manual.reviewTerm") }}</h2><p>{{ loc.t("manual.reviewDefinition") }}</p></article>
        </div>
      }
      @if (!isAdmin()) { <p class="ui-copy-muted admin-note">{{ loc.t("manual.adminDisabled") }}</p> }
    </section>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .manual-page { display: grid; gap: var(--space-4); }
    .manual-hero, .manual-intro { display: grid; gap: var(--space-3); padding: clamp(1rem, 3vw, 1.6rem); }
    .manual-hero p, .manual-intro p, .manual-vocabulary h2, .manual-vocabulary p { margin: 0; }
    .manual-tabs { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .manual-vocabulary { display: grid; gap: var(--space-3); grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .manual-vocabulary article { display: grid; gap: var(--space-2); padding: var(--space-4); }
    .manual-vocabulary h2 { color: var(--color-text); font-family: var(--font-display); font-size: 1rem; }
    .manual-vocabulary p { color: var(--color-text-muted); line-height: 1.45; }
    .admin-note { margin: 0; }
    @media (max-width: 700px) { .manual-vocabulary { grid-template-columns: 1fr; } }
  `]
})
export class ManualPageComponent {
  readonly auth = inject(AuthService);
  readonly loc = inject(LocalizationService);
  readonly activeTab = signal<"admin" | "household">("household");
  readonly isAdmin = computed(() => this.auth.user()?.role === "admin");
}
