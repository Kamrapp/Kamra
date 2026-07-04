import { Component, inject, signal, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from "@angular/router";

import { logBrowserEvent } from "./browser-logger";
import { AuthService } from "./auth.service";
import { PageRailService } from "./shared/page-rail.service";
import { ToastHostComponent } from "./shared/toast-host.component";
import { ToastService } from "./shared/toast.service";

@Component({
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet, ToastHostComponent],
  selector: "app-root",
  standalone: true,
  template: `
    <main class="shell" aria-label="Kamra app">
      <aside class="left-rail" aria-label="Application context">
        <a class="brand-card" routerLink="/" (click)="closeMenu()" aria-label="Kamra home">
          <span class="brand-line">
            <img
              class="brand-mark"
              src="/brand/kamra-basket.png"
              alt=""
              width="72"
              height="72"
            />
            <span class="brand-name">Kamra</span>
          </span>
          <span class="brand-title">Pantry foundations, gently stocked.</span>
        </a>

        <section class="page-context-card" aria-label="Page context">
          <p class="rail-kicker">Context</p>
          <p class="rail-title">{{ currentPageTitle() }}</p>
        </section>

        @for (section of pageRail.sections(); track section.key) {
          <section class="page-context-card page-rail-card" [attr.aria-label]="section.kicker">
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
      </aside>

      <section class="page-body" aria-label="Current page">
        <div class="page-scroll">
          <router-outlet />
        </div>
      </section>

      <aside class="right-rail" aria-label="Account and actions">
        <section class="auth-card" aria-label="Account">
          @if (auth.user(); as user) {
            <div class="user-chip">
              <span>{{ user.email }}</span>
              <button type="button" (click)="logout()">Logout</button>
            </div>
          } @else {
            <form class="login-form" (ngSubmit)="login()">
              <input
                autocomplete="username"
                name="email"
                placeholder="Email"
                type="email"
                [(ngModel)]="loginEmail"
                [disabled]="loginState() === 'loading'"
              />
              <input
                autocomplete="current-password"
                name="password"
                placeholder="Password"
                type="password"
                [(ngModel)]="loginPassword"
                [disabled]="loginState() === 'loading'"
              />
              <button type="submit" [disabled]="loginState() === 'loading'">
                {{ loginState() === "loading" ? "Logging in" : "Login" }}
              </button>
            </form>
          }
        </section>
      </aside>

      <app-toast-host />

      @if (loginMessage(); as message) {
        <p
          class="login-message"
          [class.login-message-error]="loginMessageTone() === 'error'"
          [class.login-message-success]="loginMessageTone() === 'success'"
          aria-live="polite"
        >
          {{ message }}
        </p>
      }

      <div class="radial-menu" [class.radial-menu-open]="isMenuOpen">
        <nav id="primary-menu" class="radial-nav" aria-label="Primary" [attr.aria-hidden]="!isMenuOpen">
          @for (item of menuItems; track item.path) {
            <a
              class="radial-nav-item"
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
              [style.--item-angle]="item.angle + 'deg'"
              [attr.tabindex]="isMenuOpen ? null : -1"
              (click)="closeMenu()"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path [attr.d]="item.iconPath"></path>
              </svg>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <button
          class="radial-menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-controls="primary-menu"
          [attr.aria-expanded]="isMenuOpen"
          (click)="toggleMenu()"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            @if (isMenuOpen) {
              <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z"></path>
            } @else {
              <path d="M4 6.5H20V8.5H4V6.5ZM4 11H20V13H4V11ZM4 15.5H20V17.5H4V15.5Z"></path>
            }
          </svg>
        </button>
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100dvh;
      }

      .shell {
        display: grid;
        gap: var(--space-4);
        grid-template-columns: minmax(16rem, 1fr) minmax(0, 6fr) minmax(16rem, 1fr);
        grid-template-rows: minmax(0, 1fr);
        height: 100dvh;
        margin: 0 auto;
        max-height: 100dvh;
        overflow: clip;
        padding: var(--space-page-y) var(--space-page-x);
        width: 100%;
      }

      .left-rail,
      .right-rail {
        align-content: start;
        display: grid;
        gap: var(--space-3);
        min-height: 0;
        min-width: 0;
      }

      .left-rail {
        max-height: 100%;
        overflow: auto;
        padding-right: 0.15rem;
        scrollbar-gutter: stable;
      }

      .brand-card,
      .auth-card,
      .page-context-card {
        backdrop-filter: blur(14px);
        background: rgb(248 244 241 / 76%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 16%, transparent);
        border-radius: 8px;
        box-shadow: 0 1rem 2.4rem rgb(48 43 50 / 12%);
      }

      .brand-card {
        color: inherit;
        display: grid;
        gap: 0.18rem;
        padding: 0.48rem 0.7rem 0.55rem;
        text-decoration: none;
      }

      .brand-line {
        align-items: center;
        display: flex;
        gap: 0.45rem;
      }

      .brand-mark {
        aspect-ratio: 1;
        filter: drop-shadow(0 0.4rem 0.75rem rgb(105 88 79 / 18%));
        height: 2.2rem;
        width: 2.2rem;
      }

      .brand-name {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: 1.2rem;
        font-weight: 800;
        letter-spacing: 0;
        line-height: 1;
      }

      .brand-title {
        color: var(--color-text-muted);
        font-size: 0.76rem;
        font-weight: 700;
        line-height: 1.15;
        max-width: 13rem;
      }

      .auth-card {
        padding: 0.45rem;
      }

      .page-context-card {
        display: grid;
        gap: 0.18rem;
        padding: 0.65rem 0.75rem;
      }

      .page-rail-card {
        gap: 0.55rem;
      }

      .rail-kicker,
      .rail-title {
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
        background: color-mix(in srgb, var(--color-background-soft) 72%, white 28%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 14%, transparent);
        border-radius: 8px;
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

      .rail-message {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        line-height: 1.35;
      }

      .rail-action {
        min-height: 2rem;
        padding: 0.35rem 0.55rem;
      }

      .rail-filter-list {
        display: none;
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
        border: 1px solid color-mix(in srgb, var(--color-wood) 14%, transparent);
        border-radius: 8px;
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

      .login-form,
      .user-chip {
        align-items: center;
        display: grid;
        gap: var(--space-2);
      }

      .login-form input {
        background: color-mix(in srgb, var(--color-surface) 88%, white 12%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 18%, transparent);
        border-radius: 8px;
        color: var(--color-text);
        font: inherit;
        min-height: 2.15rem;
        padding: 0.45rem 0.62rem;
        width: 100%;
      }

      .login-form button,
      .user-chip button {
        background: var(--color-accent-leaf-strong);
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf-strong) 72%, black 28%);
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        min-height: 2.15rem;
        padding: 0.45rem 0.7rem;
      }

      .login-form button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .user-chip {
        background: color-mix(in srgb, var(--color-surface) 82%, white 18%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 18%, transparent);
        border-radius: 8px;
        padding: 0.25rem;
      }

      .user-chip span {
        color: var(--color-text);
        font-size: 0.84rem;
        overflow: hidden;
        padding: 0 0.45rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .page-body {
        min-height: 0;
        min-width: 0;
        overflow: hidden;
        position: relative;
      }

      .page-scroll {
        display: grid;
        height: 100%;
        min-height: 0;
        overflow: auto;
        padding: 0 0 max(var(--space-6), env(safe-area-inset-bottom));
        scrollbar-gutter: stable both-edges;
      }

      .login-message {
        backdrop-filter: blur(12px);
        border-radius: 8px;
        bottom: max(var(--space-5), env(safe-area-inset-bottom));
        box-shadow: 0 1rem 2.6rem rgb(48 43 50 / 14%);
        color: var(--color-text);
        max-width: min(24rem, calc(100vw - 2rem));
        padding: 0.8rem 0.95rem;
        position: fixed;
        right: max(var(--space-5), env(safe-area-inset-right));
        z-index: 45;
      }

      .login-message-success {
        background: color-mix(in srgb, var(--color-accent-leaf) 18%, white 82%);
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf-strong) 32%, transparent);
      }

      .login-message-error {
        background: color-mix(in srgb, var(--color-wood) 18%, white 82%);
        border: 1px solid color-mix(in srgb, var(--color-wood-deep) 34%, transparent);
      }

      .radial-menu {
        --item-radius: clamp(5.2rem, 8vw, 6.8rem);
        height: 1px;
        position: fixed;
        right: max(1.25rem, env(safe-area-inset-right));
        top: 50%;
        width: 1px;
        z-index: 35;
      }

      .radial-menu-button {
        align-items: center;
        background: color-mix(in srgb, var(--color-accent-leaf-strong) 82%, var(--color-wood-deep) 18%);
        border: 1px solid color-mix(in srgb, var(--color-accent-leaf-strong) 55%, white 45%);
        border-radius: 999px;
        box-shadow: 0 1rem 2.6rem rgb(48 43 50 / 22%);
        color: white;
        cursor: pointer;
        display: inline-flex;
        height: 4.3rem;
        justify-content: center;
        padding: 0;
        position: absolute;
        right: 0;
        top: 0;
        transform: translate(0, -50%);
        transition: box-shadow 180ms ease, transform 180ms ease;
        width: 4.3rem;
        z-index: 2;
      }

      .radial-menu-button:hover,
      .radial-menu-open .radial-menu-button {
        box-shadow: 0 1.2rem 3rem rgb(48 43 50 / 28%);
        transform: translate(0, -50%) scale(1.04);
      }

      .radial-menu-button svg,
      .radial-nav-item svg {
        display: block;
        fill: currentColor;
      }

      .radial-menu-button svg {
        color: white;
        height: 1.55rem;
        width: 1.55rem;
      }

      .radial-nav {
        inset: 0;
        pointer-events: none;
        position: absolute;
      }

      .radial-nav-item {
        align-items: center;
        background: color-mix(in srgb, var(--color-surface) 92%, white 8%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 20%, transparent);
        border-radius: 999px;
        box-shadow: 0 0.8rem 2rem rgb(48 43 50 / 14%);
        color: var(--color-text);
        display: flex;
        gap: 0.55rem;
        min-height: 3rem;
        min-width: 7.4rem;
        opacity: 0;
        padding: 0.48rem 0.68rem;
        pointer-events: none;
        position: absolute;
        right: 0;
        top: 0;
        text-decoration: none;
        transform: translate(0, -50%) rotate(var(--item-angle)) translateX(0) rotate(calc(-1 * var(--item-angle))) scale(0.72);
        transform-origin: center;
        transition: background 160ms ease, opacity 180ms ease, transform 220ms ease;
        white-space: nowrap;
      }

      .radial-menu-open .radial-nav-item {
        opacity: 1;
        pointer-events: auto;
        transform: translate(0, -50%) rotate(var(--item-angle)) translateX(var(--item-radius)) rotate(calc(-1 * var(--item-angle))) scale(1);
      }

      .radial-nav-item:hover,
      .radial-nav-item.active {
        background: color-mix(in srgb, var(--color-accent-sky) 28%, white 72%);
      }

      .radial-nav-item svg {
        color: var(--color-wood-deep);
        flex: 0 0 auto;
        height: 1.18rem;
        width: 1.18rem;
      }

      .radial-nav-item span {
        font-size: 0.86rem;
        font-weight: 800;
      }

      @media (max-width: 1180px) {
        .shell {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          grid-template-rows: auto minmax(0, 1fr);
          width: min(100%, max(82rem, 86vw));
        }

        .left-rail,
        .right-rail {
          grid-row: 1;
        }

        .left-rail {
          grid-column: 1;
        }

        .right-rail {
          grid-column: 2;
        }

        .page-body {
          grid-column: 1 / -1;
          grid-row: 2;
        }

        .login-form,
        .user-chip {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .login-form input {
          width: min(11rem, 28vw);
        }

        .left-rail {
          max-height: none;
          overflow: visible;
        }
      }

      @media (max-width: 520px) {
        :host,
        .shell {
          height: 100dvh;
        }

        .shell {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: auto auto minmax(0, 1fr);
        }

        .left-rail,
        .right-rail,
        .page-body {
          grid-column: 1;
        }

        .left-rail {
          grid-row: 1;
        }

        .right-rail {
          grid-row: 2;
        }

        .page-body {
          grid-row: 3;
        }

        .login-form input {
          width: min(100%, 11rem);
        }

        .login-form,
        .user-chip {
          align-items: stretch;
          display: grid;
          justify-content: stretch;
        }

        .login-message {
          left: var(--space-4);
          max-width: none;
          right: var(--space-4);
        }

        .radial-menu {
          --item-radius: 5.2rem;
          right: 0.9rem;
        }

        .radial-nav-item {
          min-width: 6.8rem;
        }
      }
    `
  ]
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly pageRail = inject(PageRailService);
  readonly toast = inject(ToastService);
  readonly currentPageTitle = signal("Home");
  readonly loginMessage = signal("");
  readonly loginMessageTone = signal<"error" | "success">("success");
  readonly loginState = signal<"idle" | "loading">("idle");
  readonly menuItems = [
    {
      angle: 225,
      exact: true,
      iconPath: "M4 10.5 12 4 20 10.5V20H14.5V14H9.5V20H4V10.5Z",
      label: "Home",
      path: "/"
    },
    {
      angle: 195,
      exact: false,
      iconPath: "M12 3C8.1 3 5 6.1 5 10C5 15.2 12 21 12 21S19 15.2 19 10C19 6.1 15.9 3 12 3ZM12 12.5C10.6 12.5 9.5 11.4 9.5 10S10.6 7.5 12 7.5 14.5 8.6 14.5 10 13.4 12.5 12 12.5Z",
      label: "Health",
      path: "/health"
    },
    {
      angle: 165,
      exact: false,
      iconPath: "M5 5H19V8H5V5ZM5 10.5H19V13.5H5V10.5ZM5 16H19V19H5V16Z",
      label: "Products",
      path: "/products"
    },
    {
      angle: 135,
      exact: false,
      iconPath: "M4 5H20V9H4V5ZM6 11H18V14H6V11ZM8 16H16V19H8V16Z",
      label: "Crawls",
      path: "/admin/ingestion"
    }
  ];
  isMenuOpen = false;
  readonly openFilterKey = signal<string | null>(null);
  loginEmail = "";
  loginPassword = "";
  private readonly router = inject(Router);
  private loginMessageTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentPageTitle.set(this.pageTitleForUrl(event.urlAfterRedirects));
        this.closeMenu();
        this.openFilterKey.set(null);
      }
    });
  }

  ngOnInit(): void {
    void this.auth.loadCurrentUser();
    this.currentPageTitle.set(this.pageTitleForUrl(this.router.url));

    logBrowserEvent("info", "Browser app ready", {
      hostname: window.location.hostname,
      pathname: window.location.pathname
    });
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleRailFilter(key: string): void {
    this.openFilterKey.set(this.openFilterKey() === key ? null : key);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async login(): Promise<void> {
    this.loginState.set("loading");
    this.clearLoginToast();

    const result = await this.auth.login(this.loginEmail, this.loginPassword);
    this.loginState.set("idle");

    if (result.status === "error") {
      this.showLoginToast(result.message, "error");
      this.toast.push(result.message, "error");
      return;
    }

    this.loginPassword = "";
    this.showLoginToast(`Signed in as ${this.auth.user()?.email ?? this.loginEmail}.`, "success");
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.loginPassword = "";
    this.showLoginToast("Signed out.", "success");
  }

  private clearLoginToast(): void {
    this.loginMessage.set("");

    if (this.loginMessageTimer !== null) {
      clearTimeout(this.loginMessageTimer);
      this.loginMessageTimer = null;
    }
  }

  private showLoginToast(message: string, tone: "error" | "success"): void {
    this.loginMessageTone.set(tone);
    this.loginMessage.set(message);

    if (this.loginMessageTimer !== null) {
      clearTimeout(this.loginMessageTimer);
    }

    this.loginMessageTimer = setTimeout(() => {
      this.loginMessage.set("");
      this.loginMessageTimer = null;
    }, 3200);
  }

  private pageTitleForUrl(url: string): string {
    if (url.startsWith("/admin/ingestion")) {
      return "Crawls";
    }

    if (url.startsWith("/products")) {
      return "Product offers";
    }

    if (url.startsWith("/health")) {
      return "Health check";
    }

    return "Home";
  }
}
