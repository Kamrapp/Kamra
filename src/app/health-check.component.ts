import { Component, computed, inject, signal, type OnInit } from "@angular/core";

import { logBrowserEvent } from "./browser-logger";
import { AuthService } from "./auth.service";

interface HealthReport {
  checklist?: HealthCheckItem[];
  checks: {
    api: HealthCheckItem;
    database?: HealthCheckItem;
    mongodb?: HealthCheckItem;
  };
  stage: string;
  status: string;
}

interface HealthCheckError {
  code?: string;
  message: string;
  name: string;
}

interface HealthCheckItem {
  databaseName?: string | null;
  error?: HealthCheckError;
  id: string;
  label: string;
  message: string;
  status: string;
}

@Component({
  selector: "app-health-check",
  standalone: true,
  template: `
    <section class="health-page" aria-labelledby="health-title">
      <div class="health-copy">
        <p class="eyebrow">Runtime</p>
        <h1 id="health-title">Health check</h1>
        <p>
          Verify the shared API route and MongoDB connection path used by local
          development and Vercel Functions.
        </p>
      </div>

      @if (!auth.token()) {
        <section class="status-panel unauthorized-panel" aria-live="polite">
          <div class="status-heading">
            <p class="status-kicker">Admin only</p>
            <p class="status-summary">Sign in to view health checks.</p>
          </div>
          <p class="status-message">
            Use the header login with an active admin user, then the health checklist will be available here.
          </p>
        </section>
      } @else {
        <section class="status-panel" aria-live="polite">
        <div class="status-heading">
          <p class="status-kicker">Current State</p>
          <p class="status-summary">{{ healthSummary() }}</p>
        </div>

        @if (healthMessage(); as message) {
          <p class="status-message">{{ message }}</p>
        }

        <button
          class="run-button"
          type="button"
          (click)="runHealthCheck()"
          [disabled]="healthState() === 'loading'"
        >
          {{ healthState() === "loading" ? "Checking..." : "Run health check" }}
        </button>

        @if (healthChecks().length) {
          <div class="check-list" aria-label="Health checks">
            @for (check of healthChecks(); track check.id) {
              <article
                class="check-card"
                [class.check-card-ok]="check.status === 'ok'"
                [class.check-card-problem]="check.status !== 'ok'"
              >
                <div class="check-heading">
                  <h2>{{ check.label }}</h2>
                  <span>{{ check.status }}</span>
                </div>
                <p>{{ check.message }}</p>

                @if (check.databaseName !== undefined) {
                  <dl>
                    <div>
                      <dt>Database</dt>
                      <dd>{{ check.databaseName ?? "not configured" }}</dd>
                    </div>
                  </dl>
                }

                @if (check.error; as error) {
                  <div class="error-block">
                    <p class="error-title">{{ error.name }}</p>
                    <p>{{ error.message }}</p>
                    @if (error.code) {
                      <p>Code: {{ error.code }}</p>
                    }
                  </div>
                }
              </article>
            }
          </div>
        }
        </section>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }

      .health-page {
        display: grid;
        gap: var(--space-6);
        grid-template-columns: minmax(0, 1fr);
      }

      .health-copy {
        display: grid;
        gap: var(--space-3);
        max-width: 43rem;
      }

      .eyebrow,
      .status-kicker {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(2rem, 5vw, 3.4rem);
        line-height: 1.05;
      }

      .health-copy p:last-child {
        color: var(--color-text-muted);
        font-size: 1rem;
        line-height: 1.65;
      }

      .status-panel {
        background: color-mix(in srgb, var(--color-surface) 90%, white 10%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 18%, transparent);
        border-radius: 8px;
        box-shadow: 0 1.2rem 2.6rem rgb(48 43 50 / 10%);
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 2.5vw, 1.5rem);
      }

      .unauthorized-panel {
        align-content: center;
      }

      .status-heading {
        display: grid;
        gap: 0.35rem;
      }

      .status-summary,
      .status-message {
        color: var(--color-text);
      }

      .status-summary {
        font-size: 1.05rem;
        font-weight: 700;
      }

      .run-button {
        background: var(--color-accent-leaf-strong);
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf-strong) 72%, black 28%);
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        justify-self: start;
        min-height: 2.75rem;
        min-width: 11rem;
        padding: 0.72rem 1rem;
      }

      .run-button:disabled {
        cursor: progress;
        opacity: 0.74;
      }

      .check-list {
        display: grid;
        gap: var(--space-3);
      }

      .check-card {
        background: color-mix(in srgb, var(--color-background-soft) 74%, white 26%);
        border: 1px solid rgb(255 255 255 / 66%);
        border-radius: 8px;
        display: grid;
        gap: var(--space-3);
        padding: 1rem;
      }

      .check-card-ok {
        border-color: color-mix(in srgb, var(--color-accent-leaf) 36%, white 64%);
      }

      .check-card-problem {
        border-color: color-mix(in srgb, var(--color-wood) 38%, white 62%);
      }

      .check-heading {
        align-items: center;
        display: flex;
        gap: var(--space-3);
        justify-content: space-between;
      }

      h2 {
        color: var(--color-text);
        font-size: 1rem;
        line-height: 1.25;
        margin: 0;
      }

      .check-heading span {
        background: rgb(255 255 255 / 60%);
        border-radius: 8px;
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        padding: 0.35rem 0.55rem;
      }

      .check-card p {
        color: var(--color-text);
        margin: 0;
      }

      dl {
        display: grid;
        margin: 0;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        font-weight: 700;
        margin: 0;
        text-transform: uppercase;
      }

      dd {
        color: var(--color-text);
        font-size: 1rem;
        margin: 0;
        overflow-wrap: anywhere;
      }

      .error-block {
        background: rgb(255 255 255 / 58%);
        border-radius: 8px;
        display: grid;
        gap: 0.35rem;
        padding: 0.85rem;
      }

      .error-block .error-title {
        color: var(--color-text);
        font-weight: 700;
      }

      .error-block p {
        color: var(--color-text-muted);
        overflow-wrap: anywhere;
      }

      @media (min-width: 900px) {
        .health-page {
          grid-template-columns: minmax(16rem, 0.65fr) minmax(24rem, 1fr);
        }
      }
    `
  ]
})
export class HealthCheckComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly healthMessage = signal("Run the health check to verify the shared server path.");
  readonly healthReport = signal<HealthReport | null>(null);
  readonly healthState = signal<"idle" | "loading" | "error" | "success">("idle");
  readonly healthChecks = computed((): HealthCheckItem[] => {
    const report = this.healthReport();
    if (!report) {
      return [];
    }

    if (report.checklist?.length) {
      return report.checklist;
    }

    return [
      report.checks.api,
      report.checks.database ?? report.checks.mongodb
    ].filter((check): check is HealthCheckItem => Boolean(check));
  });
  readonly healthSummary = computed(() => {
    const state = this.healthState();
    const report = this.healthReport();

    if (state === "loading") {
      return "Checking API and MongoDB connectivity...";
    }

    if (report) {
      return `Health is ${report.status}.`;
    }

    if (state === "error") {
      return "Health check could not be completed.";
    }

    return "No health check has been run yet.";
  });

  ngOnInit(): void {
    void this.auth.loadCurrentUser();
  }

  async runHealthCheck(): Promise<void> {
    if (!this.auth.token()) {
      this.healthReport.set(null);
      this.healthState.set("error");
      this.healthMessage.set("Sign in before running the health check.");
      return;
    }

    this.healthState.set("loading");
    this.healthMessage.set("");

    logBrowserEvent("info", "Health check requested from health screen", {
      pathname: window.location.pathname
    });

    try {
      const response = await fetch("/api/health", {
        headers: {
          accept: "application/json",
          ...this.auth.getAuthorizationHeaders()
        },
        method: "GET"
      });

      if (response.status === 401) {
        await this.auth.logout();
        this.healthReport.set(null);
        this.healthState.set("error");
        this.healthMessage.set("Sign in before running the health check.");
        return;
      }

      const report = (await response.json()) as HealthReport;

      this.healthReport.set(report);
      this.healthState.set(response.ok ? "success" : "error");
      this.healthMessage.set(response.ok
        ? "Shared API health route responded successfully."
        : "Shared API health route responded with a degraded or failed status.");

      logBrowserEvent("info", "Health check response received", {
        httpStatus: response.status,
        databaseStatus: report.checks.database?.status ?? report.checks.mongodb?.status,
        status: report.status
      });
    } catch (error: unknown) {
      this.healthReport.set(null);
      this.healthState.set("error");
      this.healthMessage.set("The browser could not reach the health route.");

      logBrowserEvent("error", "Health check request failed", error);
    }
  }
}
