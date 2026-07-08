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
import { PageRailOutletComponent } from "./shared/page-rail-outlet.component";
import { ThemePreferenceService, type ThemePreference } from "./shared/theme-preference.service";
import { ToastHostComponent } from "./shared/toast-host.component";
import { ToastService } from "./shared/toast.service";

@Component({
  imports: [FormsModule, PageRailOutletComponent, RouterLink, RouterLinkActive, RouterOutlet, ToastHostComponent],
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

        <app-page-rail-outlet [resetToken]="railResetToken()" [sections]="pageRail.sections()" />
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

          <label class="preference-field">
            <span>Theme</span>
            <select
              name="theme"
              [ngModel]="theme.theme()"
              (ngModelChange)="setTheme($event)"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
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
        <nav id="primary-menu" class="radial-nav" aria-label="Primary">
          @for (item of menuItems; track item.path) {
            <a
              class="radial-nav-item"
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
              [style.--item-angle]="item.angle + 'deg'"
              [attr.aria-label]="item.label"
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
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-shell-shadow);
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

      .login-form,
      .preference-field,
      .user-chip {
        align-items: center;
        display: grid;
        gap: var(--space-2);
      }

      .login-form input,
      .preference-field select {
        background: var(--form-field-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        font: inherit;
        min-height: 2.15rem;
        padding: 0.45rem 0.62rem;
        width: 100%;
      }

      .preference-field {
        margin-top: var(--space-2);
      }

      .preference-field span {
        color: var(--color-text-muted);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .login-form button,
      .user-chip button {
        background: var(--control-primary-background);
        border: 1px solid var(--control-primary-border);
        border-radius: var(--radius-ui);
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
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
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
        border-radius: var(--radius-ui);
        bottom: max(var(--space-5), env(safe-area-inset-bottom));
        box-shadow: var(--surface-floating-shadow);
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
        --mini-item-radius: clamp(3.65rem, 5vw, 4.2rem);
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
        border-radius: var(--radius-pill);
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
        position: absolute;
      }

      .radial-nav-item {
        align-items: center;
        background: color-mix(in srgb, var(--color-surface) 92%, white 8%);
        border: 1px solid var(--line-strong);
        border-radius: var(--radius-pill);
        box-shadow: 0 0.45rem 1.2rem rgb(48 43 50 / 16%);
        color: var(--color-text);
        display: flex;
        gap: 0;
        height: 2.35rem;
        justify-content: center;
        min-height: 2.35rem;
        min-width: 2.35rem;
        opacity: 0.96;
        overflow: hidden;
        padding: 0;
        pointer-events: auto;
        position: absolute;
        right: 0;
        top: 0;
        text-decoration: none;
        transform: translate(0, -50%) rotate(var(--item-angle)) translateX(var(--mini-item-radius)) rotate(calc(-1 * var(--item-angle))) scale(0.94);
        transform-origin: center;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          box-shadow 180ms ease,
          gap 220ms ease,
          height 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          min-height 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          min-width 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          opacity 180ms ease,
          padding 240ms cubic-bezier(0.2, 0.9, 0.2, 1.08),
          transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1.08);
        white-space: nowrap;
        width: 2.35rem;
        z-index: 1;
      }

      .radial-menu-open .radial-nav-item {
        box-shadow: 0 0.8rem 2rem rgb(48 43 50 / 14%);
        gap: 0.55rem;
        height: auto;
        justify-content: flex-start;
        min-height: 3rem;
        min-width: 7.4rem;
        opacity: 1;
        overflow: visible;
        padding: 0.48rem 0.68rem;
        transform: translate(0, -50%) rotate(var(--item-angle)) translateX(var(--item-radius)) rotate(calc(-1 * var(--item-angle))) scale(1);
        width: auto;
      }

      .radial-nav-item:hover,
      .radial-nav-item.active {
        background: color-mix(in srgb, var(--color-accent-sky) 28%, white 72%);
      }

      .radial-nav-item svg {
        color: var(--color-wood-deep);
        flex: 0 0 auto;
        height: 1rem;
        transition: height 220ms ease, width 220ms ease;
        width: 1rem;
      }

      .radial-menu-open .radial-nav-item svg {
        height: 1.18rem;
        width: 1.18rem;
      }

      .radial-nav-item span {
        font-size: 0.86rem;
        font-weight: 800;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transition: max-width 220ms ease, opacity 160ms ease 70ms;
      }

      .radial-menu-open .radial-nav-item span {
        max-width: 7rem;
        opacity: 1;
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
        .preference-field,
        .user-chip {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .login-form input,
        .preference-field select {
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

        .login-form input,
        .preference-field select {
          width: min(100%, 11rem);
        }

        .login-form,
        .preference-field,
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

        .radial-menu-open .radial-nav-item {
          min-width: 6.8rem;
        }
      }
    `
  ]
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly pageRail = inject(PageRailService);
  readonly theme = inject(ThemePreferenceService);
  readonly toast = inject(ToastService);
  readonly currentPageTitle = signal("Home");
  readonly loginMessage = signal("");
  readonly loginMessageTone = signal<"error" | "success">("success");
  readonly loginState = signal<"idle" | "loading">("idle");
  readonly railResetToken = signal(0);
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
  loginEmail = "";
  loginPassword = "";
  private readonly router = inject(Router);
  private loginMessageTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentPageTitle.set(this.pageTitleForUrl(event.urlAfterRedirects));
        this.closeMenu();
        this.railResetToken.update((token) => token + 1);
      }
    });
  }

  ngOnInit(): void {
    void this.loadCurrentUserProfile();
    this.currentPageTitle.set(this.pageTitleForUrl(this.router.url));

    logBrowserEvent("info", "Browser app ready", {
      hostname: window.location.hostname,
      pathname: window.location.pathname
    });
  }

  closeMenu(): void {
    this.isMenuOpen = false;
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
    this.theme.applyUserTheme(this.auth.user()?.profile.theme);
    this.showLoginToast(`Signed in as ${this.auth.user()?.email ?? this.loginEmail}.`, "success");
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.loginPassword = "";
    this.theme.applyUserTheme(undefined);
    this.showLoginToast("Signed out.", "success");
  }

  async setTheme(theme: ThemePreference): Promise<void> {
    if (this.auth.user()) {
      this.theme.setTheme(theme);
      await this.auth.updateThemePreference(theme);
      return;
    }

    this.theme.setAnonymousTheme(theme);
  }

  private async loadCurrentUserProfile(): Promise<void> {
    await this.auth.loadCurrentUser();
    const userTheme = this.auth.user()?.profile.theme;
    if (userTheme) {
      this.theme.applyUserTheme(userTheme);
    }
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
