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
        @for (entry of activity.entries().slice().reverse(); track entry.id) {
          <div class="client-console-row" [class.debug]="entry.level === 'debug'" [class.error]="entry.level === 'error'" [class.info]="entry.level === 'info'" [class.warn]="entry.level === 'warn'"><time>{{ entry.timestamp.slice(11, 16) }}</time><span>{{ entry.message }}</span></div>
        } @empty { <p>{{ loc.t("clientConsole.empty") }}</p> }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; margin-top: auto; position: sticky; bottom: 0; }
    .client-console { background: var(--surface-shell-background); border: 1px solid var(--line-panel); border-radius: var(--radius-ui); box-shadow: var(--surface-shell-shadow); display: grid; overflow: hidden; }
    header { align-items: center; border-bottom: 1px solid var(--line-subtle); color: var(--color-text); display: flex; font-size: .72rem; font-weight: 800; gap: var(--space-2); justify-content: space-between; padding: var(--space-2) var(--space-3); }
    header small { color: var(--color-text-muted); font-size: .62rem; font-weight: 700; }
    .client-console-scroll { height: 5.4rem; max-height: 13rem; min-height: 4.5rem; overflow: auto; padding: var(--space-2) var(--space-3); resize: vertical; }
    .client-console-row { border-radius: calc(var(--radius-ui) / 2); color: var(--color-text-muted); display: grid; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .68rem; gap: var(--space-2); grid-template-columns: 2.7rem minmax(0, 1fr); line-height: 1.35; padding: .1rem var(--space-2); }
    .client-console-row time { color: inherit; opacity: .8; }
    .client-console-row.debug { background: color-mix(in srgb, var(--color-text-muted) 8%, transparent); }
    .client-console-row.info { background: color-mix(in srgb, var(--color-accent-sky) 12%, transparent); color: var(--color-text); }
    .client-console-row.warn { background: color-mix(in srgb, var(--color-status-warning) 13%, transparent); color: var(--color-status-warning); }
    .client-console-row.error { background: color-mix(in srgb, var(--color-status-danger) 13%, transparent); color: var(--color-status-danger); }
    p { color: var(--color-text-muted); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .68rem; margin: 0; }
  `]
})
export class ClientConsoleWindowComponent {
  readonly activity = inject(ClientActivityLogService);
  readonly loc = inject(LocalizationService);
}
