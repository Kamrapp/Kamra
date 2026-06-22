import { Component, type OnInit } from "@angular/core";

import { logBrowserEvent } from "./browser-logger";

interface HealthReport {
  checks: {
    api: {
      status: string;
    };
    mongodb: {
      databaseName?: string;
      status: string;
    };
  };
  stage: string;
  status: string;
}

@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <main class="shell" aria-label="Kamra app home">
      <section class="app-frame" aria-labelledby="brand-title">
        <header class="topbar">
          <div class="brand-lockup">
            <img
              class="brand-mark"
              src="/brand/kamra-basket.png"
              alt=""
              width="220"
              height="220"
            />
            <div class="brand-copy">
              <p class="eyebrow">Kamra</p>
              <h1 id="brand-title">Pantry foundations, gently stocked.</h1>
              <p class="intro">
                The first deployed slice is intentionally small: frontend shell, shared API
                runtime, and MongoDB-backed health visibility.
              </p>
            </div>
          </div>

          <nav class="menu" aria-label="Primary">
            <button
              class="menu-button"
              type="button"
              (click)="runHealthCheck()"
              [disabled]="healthState === 'loading'"
            >
              {{ healthState === "loading" ? "Checking..." : "Health check" }}
            </button>
          </nav>
        </header>

        <section class="status-panel" aria-live="polite">
          <div class="status-heading">
            <p class="status-kicker">Runtime</p>
            <p class="status-summary">{{ healthSummary }}</p>
          </div>

          @if (healthMessage) {
            <p class="status-message">{{ healthMessage }}</p>
          }

          @if (healthReport) {
            <dl class="status-grid">
              <div>
                <dt>API</dt>
                <dd>{{ healthReport.checks.api.status }}</dd>
              </div>
              <div>
                <dt>MongoDB</dt>
                <dd>{{ healthReport.checks.mongodb.status }}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{{ healthReport.checks.mongodb.databaseName ?? "not configured" }}</dd>
              </div>
              <div>
                <dt>Stage</dt>
                <dd>{{ healthReport.stage }}</dd>
              </div>
            </dl>
          }
        </section>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .shell {
        display: flex;
        justify-content: center;
        padding: var(--space-page);
        min-height: 100vh;
      }

      .app-frame {
        display: grid;
        gap: var(--space-8);
        width: min(100%, 72rem);
      }

      .topbar {
        align-items: start;
        display: grid;
        gap: var(--space-6);
      }

      .brand-lockup {
        align-items: center;
        display: grid;
        gap: var(--space-6);
      }

      .brand-copy {
        display: grid;
        gap: var(--space-3);
      }

      .brand-mark {
        aspect-ratio: 1;
        height: auto;
        width: min(48vw, 220px);
      }

      .eyebrow {
        color: var(--color-text-muted);
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      h1 {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(1.9rem, 4vw, 3.1rem);
        font-weight: 700;
        line-height: 1.16;
        margin: 0;
        max-width: 12ch;
      }

      .intro {
        color: var(--color-text-muted);
        font-size: 1rem;
        line-height: 1.6;
        margin: 0;
        max-width: 34rem;
      }

      .menu {
        display: flex;
        justify-content: flex-start;
      }

      .menu-button {
        background: var(--color-accent-strong);
        border: 1px solid color-mix(in srgb, var(--color-accent-strong) 72%, black 28%);
        border-radius: 999px;
        color: var(--color-surface);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        min-height: 2.75rem;
        min-width: 9.5rem;
        padding: 0.7rem 1.1rem;
      }

      .menu-button:disabled {
        cursor: progress;
        opacity: 0.74;
      }

      .status-panel {
        background: color-mix(in srgb, var(--color-surface) 88%, white 12%);
        border: 1px solid color-mix(in srgb, var(--color-accent-soft) 30%, white 70%);
        border-radius: 8px;
        display: grid;
        gap: var(--space-4);
        padding: clamp(1rem, 2vw, 1.5rem);
      }

      .status-heading {
        display: grid;
        gap: 0.35rem;
      }

      .status-kicker {
        color: var(--color-text-muted);
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0;
        text-transform: uppercase;
      }

      .status-summary,
      .status-message {
        color: var(--color-text);
        margin: 0;
      }

      .status-summary {
        font-size: 1.05rem;
        font-weight: 600;
      }

      .status-grid {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
        margin: 0;
      }

      .status-grid div {
        background: color-mix(in srgb, var(--color-background) 85%, white 15%);
        border-radius: 8px;
        display: grid;
        gap: 0.35rem;
        min-height: 5rem;
        padding: 0.9rem 1rem;
      }

      dt {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        font-weight: 600;
        margin: 0;
        text-transform: uppercase;
      }

      dd {
        color: var(--color-text);
        font-size: 1rem;
        margin: 0;
      }

      @media (min-width: 900px) {
        .topbar {
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .brand-lockup {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .menu {
          justify-content: flex-end;
          padding-top: 0.5rem;
        }
      }
    `
  ]
})
export class AppComponent implements OnInit {
  healthMessage = "Run the health check from here to verify the shared server path.";
  healthReport: HealthReport | null = null;
  healthState: "idle" | "loading" | "error" | "success" = "idle";

  get healthSummary(): string {
    if (this.healthState === "loading") {
      return "Checking API and MongoDB connectivity...";
    }

    if (this.healthReport) {
      return `Health is ${this.healthReport.status}.`;
    }

    if (this.healthState === "error") {
      return "Health check could not be completed.";
    }

    return "No health check has been run yet.";
  }

  ngOnInit(): void {
    logBrowserEvent("info", "Browser app ready", {
      hostname: window.location.hostname,
      pathname: window.location.pathname
    });
  }

  async runHealthCheck(): Promise<void> {
    this.healthState = "loading";
    this.healthMessage = "";

    logBrowserEvent("info", "Health check requested from app shell", {
      pathname: window.location.pathname
    });

    try {
      const response = await fetch("/api/health", {
        headers: {
          accept: "application/json"
        },
        method: "GET"
      });

      const report = (await response.json()) as HealthReport;

      this.healthReport = report;
      this.healthState = response.ok ? "success" : "error";
      this.healthMessage = response.ok
        ? "Shared API health route responded successfully."
        : "Shared API health route responded with a degraded or failed status.";

      logBrowserEvent("info", "Health check response received", {
        httpStatus: response.status,
        mongodbStatus: report.checks.mongodb.status,
        status: report.status
      });
    } catch (error: unknown) {
      this.healthReport = null;
      this.healthState = "error";
      this.healthMessage = "The browser could not reach the health route.";

      logBrowserEvent("error", "Health check request failed", error);
    }
  }
}
