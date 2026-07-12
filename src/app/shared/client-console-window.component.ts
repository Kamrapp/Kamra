import { Component, inject } from "@angular/core";

import { ClientActivityLogService } from "../client-activity-log.service";
import { LocalizationService } from "./localization.service";

@Component({
  selector: "app-client-console-window",
  standalone: true,
  template: `
    <section class="client-console" [attr.aria-label]="loc.t('clientConsole.title')">
      <header><span>{{ loc.t("clientConsole.title") }}</span><small>{{ loc.t("clientConsole.localOnly") }}</small></header>
      <div class="client-console-scroll" aria-live="polite">
        @for (entry of activity.entries(); track entry.id) {
          <div class="client-console-row" [class.error]="entry.level === 'error'" [class.warn]="entry.level === 'warn'"><time>{{ entry.timestamp.slice(11, 16) }}</time><span>{{ entry.message }}</span></div>
        } @empty { <p>{{ loc.t("clientConsole.empty") }}</p> }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; margin-top: auto; position: sticky; bottom: 0; }
    .client-console { background: var(--surface-shell-background); border: 1px solid var(--line-panel); border-radius: var(--radius-ui); box-shadow: var(--surface-shell-shadow); display: grid; height: 7.5rem; max-height: 15rem; min-height: 6.5rem; overflow: auto; resize: vertical; }
    header { align-items: center; border-bottom: 1px solid var(--line-subtle); color: var(--color-text); display: flex; font-size: .72rem; font-weight: 800; gap: var(--space-2); justify-content: space-between; padding: var(--space-2) var(--space-3); }
    header small { color: var(--color-text-muted); font-size: .62rem; font-weight: 700; }
    .client-console-scroll { min-height: 0; overflow: auto; padding: var(--space-2) var(--space-3); }
    .client-console-row { color: var(--color-text-muted); display: grid; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .68rem; gap: var(--space-2); grid-template-columns: 2.7rem minmax(0, 1fr); line-height: 1.35; padding: .08rem 0; }
    .client-console-row time { color: var(--color-text-muted); }
    .client-console-row.error { color: var(--color-status-danger); }
    .client-console-row.warn { color: var(--color-status-warning); }
    p { color: var(--color-text-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .68rem; margin: 0; }
  `]
})
export class ClientConsoleWindowComponent {
  readonly activity = inject(ClientActivityLogService);
  readonly loc = inject(LocalizationService);
}
