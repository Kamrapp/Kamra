import { Component, computed, effect, inject, signal, type OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

import { BrowserLoggerService } from "./browser-logger.service";
import { AuthService } from "./auth.service";
import { PageRailService } from "./shared/page-rail.service";
import { PageRailOutletComponent } from "./shared/page-rail-outlet.component";
import { ClientConsoleWindowComponent } from "./shared/client-console-window.component";
import { LocalizationService, type LanguagePreference } from "./shared/localization.service";
import { NavigationHistoryService } from "./shared/navigation-history.service";
import { ThemePreferenceService, type ThemePreference } from "./shared/theme-preference.service";
import { ToastHostComponent } from "./shared/toast-host.component";
import { ToastService } from "./shared/toast.service";
import {
  RadialNavigationComponent,
  type RadialNavigationItem
} from "./shared/radial-navigation.component";
import {
  ShellAccountPanelComponent,
  type ShellLoginCredentials
} from "./shared/shell-account-panel.component";

interface ShellMenuItem extends RadialNavigationItem {
  requiresAdmin?: boolean;
}

@Component({
  imports: [
    ClientConsoleWindowComponent,
    PageRailOutletComponent,
    RadialNavigationComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ShellAccountPanelComponent,
    ToastHostComponent
  ],
  selector: "app-root",
  standalone: true,
  template: `
    <main class="shell" aria-label="Kamra">
      <aside class="left-rail" [attr.aria-label]="loc.t('app.context')">
        <a class="brand-card" routerLink="/" [attr.aria-label]="loc.t('app.home')">
          <span class="brand-line">
            <img class="brand-mark" src="/brand/kamra-basket.png" alt="" width="72" height="72" />
            <span class="brand-name">Kamra</span>
          </span>
          <span class="brand-title">{{ loc.t("app.brandTitle") }}</span>
        </a>

        <section class="page-context-card" [attr.aria-label]="loc.t('app.context')">
          <p class="rail-kicker">{{ loc.t("app.context") }}</p>
          <p class="rail-title">{{ currentPageTitle() }}</p>
        </section>

        <app-page-rail-outlet [resetToken]="railResetToken()" [sections]="pageRail.sections()" />
        <div class="rail-bottom-tools">
          <section class="rail-navigation" [attr.aria-label]="loc.t('app.navigation')">
            <button
              class="rail-navigation-button"
              type="button"
              [disabled]="!navigationHistory.canGoBack()"
              [attr.aria-label]="loc.t('app.navigateBack')"
              (click)="navigateHistory('back')"
            >
              ←
            </button>
            <span>{{ loc.t("app.navigation") }}</span>
            <button
              class="rail-navigation-button"
              type="button"
              [disabled]="!navigationHistory.canGoForward()"
              [attr.aria-label]="loc.t('app.navigateForward')"
              (click)="navigateHistory('forward')"
            >
              →
            </button>
          </section>
          <app-client-console-window />
        </div>
      </aside>

      <section class="page-body" [attr.aria-label]="loc.t('app.currentPage')">
        <div class="page-scroll">
          <router-outlet />
        </div>
      </section>

      <aside class="right-rail" [attr.aria-label]="loc.t('app.actions')">
        <app-shell-account-panel
          [language]="loc.language()"
          [loginLoading]="loginState() === 'loading' || auth.startupLoginLoading()"
          [loginResetToken]="loginResetToken()"
          [theme]="theme.theme()"
          [user]="auth.user()"
          (languageChanged)="setLanguage($event)"
          (loginRequested)="login($event)"
          (logoutRequested)="logout()"
          (registerRequested)="register($event)"
          (invitationAccepted)="invitationAccepted($event)"
          (themeChanged)="setTheme($event)"
        />

        <div class="rail-reference-links">
          <a
            class="about-rail-card manual-rail-card"
            routerLink="/manual"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            [attr.aria-label]="loc.t('manual.railTitle')"
          >
            <p class="rail-kicker">{{ loc.t("manual.railKicker") }}</p>
            <p class="about-rail-title">{{ loc.t("manual.railTitle") }}</p>
            <p class="about-rail-copy">{{ loc.t("manual.railBody") }}</p>
          </a>

          <a
            class="about-rail-card"
            routerLink="/about"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            [attr.aria-label]="loc.t('about.railTitle')"
          >
            <p class="rail-kicker">{{ loc.t("about.railKicker") }}</p>
            <p class="about-rail-title">{{ loc.t("about.railTitle") }}</p>
            <p class="about-rail-copy">{{ loc.t("about.railBody") }}</p>
          </a>
        </div>
      </aside>

      <app-toast-host />

      <app-radial-navigation [items]="menuItems()" [resetToken]="railResetToken()" />
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
        display: flex;
        flex-direction: column;
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

      .rail-navigation {
        align-items: center;
        background: var(--surface-shell-background);
        border: 1px solid var(--line-panel);
        border-radius: var(--radius-ui);
        box-shadow: var(--surface-shell-shadow);
        display: grid;
        gap: 0.45rem;
        grid-template-columns: 2rem minmax(0, 1fr) 2rem;
        padding: 0.3rem;
      }

      .rail-bottom-tools {
        display: grid;
        gap: var(--space-3);
        margin-top: auto;
      }

      .rail-navigation-button {
        background: var(--surface-soft-background);
        border: 1px solid var(--line-subtle);
        border-radius: var(--radius-ui);
        color: var(--color-text);
        cursor: pointer;
        font: inherit;
        font-weight: 900;
        min-height: 1.8rem;
      }

      .rail-navigation button:disabled {
        cursor: not-allowed;
        opacity: 0.42;
      }

      .rail-navigation span {
        color: var(--color-text-muted);
        font-size: 0.7rem;
        font-weight: 800;
        text-align: center;
        text-transform: uppercase;
      }

      .brand-card,
      .page-context-card,
      .about-rail-card {
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
        display: block;
        font-size: 0.76rem;
        font-weight: 700;
        line-height: 1.15;
        min-width: min(13rem, 100%);
      }

      .page-context-card {
        display: grid;
        gap: 0.18rem;
        padding: 0.65rem 0.75rem;
      }

      .about-rail-card {
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--color-accent-sky) 15%, var(--surface-shell-background)) 0%,
          var(--surface-shell-background) 100%
        );
        color: inherit;
        display: grid;
        gap: 0.35rem;
        padding: 0.85rem 0.95rem;
        text-decoration: none;
        transition:
          border-color 160ms ease,
          transform 180ms ease;
      }

      .rail-reference-links {
        display: grid;
        gap: var(--space-3);
        margin-top: auto;
      }

      .about-rail-card:hover,
      .about-rail-card.active {
        border-color: var(--line-strong);
        transform: translateY(-0.15rem);
      }

      .about-rail-title,
      .about-rail-copy {
        margin: 0;
      }

      .about-rail-title {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 800;
        line-height: 1.08;
      }

      .about-rail-copy {
        color: var(--color-text-muted);
        font-size: 0.82rem;
        line-height: 1.35;
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

      /* The outlet is an Angular insertion marker, not a page row of its own. */
      .page-scroll > router-outlet {
        display: contents;
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
      }
    `
  ]
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly logger = inject(BrowserLoggerService);
  readonly loc = inject(LocalizationService);
  readonly navigationHistory = inject(NavigationHistoryService);
  readonly pageRail = inject(PageRailService);
  readonly theme = inject(ThemePreferenceService);
  readonly toast = inject(ToastService);
  readonly currentPageTitle = signal("");
  readonly loginState = signal<"idle" | "loading">("idle");
  readonly loginResetToken = signal(0);
  readonly railResetToken = signal(0);
  readonly menuItems = computed(() => {
    const isAdmin = this.auth.user()?.role === "admin";

    return this.baseMenuItems.filter((item) => !item.requiresAdmin || isAdmin);
  });
  private readonly baseMenuItems: readonly ShellMenuItem[] = [
    {
      angle: 225,
      exact: true,
      iconPath: "M4 10.5 12 4 20 10.5V20H14.5V14H9.5V20H4V10.5Z",
      labelKey: "app.home" as const,
      path: "/"
    },
    {
      angle: 195,
      exact: false,
      iconPath:
        "M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.1 6 2.25v4.53c0 3.9-2.44 7.54-6 8.88-3.56-1.34-6-4.98-6-8.88V6.35L12 4.1Zm-1 3.4h2v4h-2v-4Zm0 5h2v2h-2v-2Z",
      labelKey: "common.devAdmin",
      path: "/dev-admin",
      requiresAdmin: true
    },
    {
      angle: 165,
      exact: false,
      iconPath: "M5 5H19V8H5V5ZM5 10.5H19V13.5H5V10.5ZM5 16H19V19H5V16Z",
      labelKey: "common.productLookup",
      path: "/product-lookup"
    },
    {
      angle: 135,
      exact: false,
      iconPath: "M4 5H20V9H4V5ZM6 11H18V14H6V11ZM8 16H16V19H8V16Z",
      labelKey: "common.ingestionManagement",
      path: "/site-admin/ingestion",
      requiresAdmin: true
    }
  ];
  private readonly router = inject(Router);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.navigationHistory.record(event.urlAfterRedirects);
        this.updateCurrentPageTitle(event.urlAfterRedirects);
        this.railResetToken.update((token) => token + 1);
      }
    });

    effect(() => {
      this.loc.language();
      this.updateCurrentPageTitle(this.router.url);
    });
  }

  ngOnInit(): void {
    void this.loadCurrentUserProfile();
    this.updateCurrentPageTitle(this.router.url);

    this.logger.log("info", "Browser app ready", {
      hostname: window.location.hostname,
      pathname: window.location.pathname
    });
  }

  async login(credentials: ShellLoginCredentials): Promise<void> {
    const { email, password } = credentials;
    this.loginState.set("loading");
    try {
      const result = await this.auth.login(email, password);

      if (result.status === "error") {
        this.toast.push(result.message, "error");
        return;
      }

      this.theme.applyUserTheme(this.auth.user()?.profile.theme);
      this.loc.applyUserLanguage(this.auth.user()?.profile.language);
      this.loginResetToken.update((token) => token + 1);
      this.toast.push(
        this.loc.t("app.signedIn", { email: this.auth.user()?.email ?? email }),
        "success"
      );
    } catch {
      this.toast.push(this.loc.t("app.loginFailure"), "error");
    } finally {
      this.loginState.set("idle");
    }
  }

  async register(credentials: ShellLoginCredentials): Promise<void> {
    this.loginState.set("loading");
    try {
      const result = await this.auth.register(credentials.email, credentials.password);

      if (result.status === "error") {
        this.toast.push(result.message, "error");
        return;
      }

      this.theme.applyUserTheme(this.auth.user()?.profile.theme);
      this.loc.applyUserLanguage(this.auth.user()?.profile.language);
      this.loginResetToken.update((token) => token + 1);
      this.toast.push(this.loc.t("app.registrationCompleted"), "success");
    } catch {
      this.toast.push(this.loc.t("app.registrationFailure"), "error");
    } finally {
      this.loginState.set("idle");
    }
  }

  async invitationAccepted(householdId: string): Promise<void> {
    this.toast.push(this.loc.t("app.invitationAccepted"), "success");
    await this.router.navigateByUrl(`/household/${encodeURIComponent(householdId)}`);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.loginResetToken.update((token) => token + 1);
    this.theme.applyUserTheme(undefined);
    this.loc.applyUserLanguage(undefined);
    await this.router.navigateByUrl("/");
    this.toast.push(this.loc.t("app.signedOut"), "success");
  }

  navigateHistory(direction: "back" | "forward"): void {
    const target =
      direction === "back"
        ? this.navigationHistory.backTarget()
        : this.navigationHistory.forwardTarget();
    if (target) void this.router.navigateByUrl(target);
  }

  async setTheme(theme: ThemePreference): Promise<void> {
    if (this.auth.user()) {
      this.theme.setTheme(theme);
      await this.auth.updateThemePreference(theme);
      return;
    }

    this.theme.setAnonymousTheme(theme);
  }

  async setLanguage(language: LanguagePreference): Promise<void> {
    if (this.auth.user()) {
      this.loc.setLanguage(language);
      await this.auth.updateUserPreferences({ language });
      return;
    }

    this.loc.setAnonymousLanguage(language);
  }

  private async loadCurrentUserProfile(): Promise<void> {
    await this.auth.loadCurrentUser();
    const userTheme = this.auth.user()?.profile.theme;
    if (userTheme) {
      this.theme.applyUserTheme(userTheme);
    }
    this.loc.applyUserLanguage(this.auth.user()?.profile.language);
  }

  private updateCurrentPageTitle(url: string): void {
    this.currentPageTitle.set(this.pageTitleForUrl(url));
  }

  private pageTitleForUrl(url: string): string {
    if (url.startsWith("/site-admin/ingestion")) {
      return this.loc.t("common.ingestionManagement");
    }

    if (url.startsWith("/product-lookup")) {
      return this.loc.t("app.productOffers");
    }

    if (url.startsWith("/about")) {
      return this.loc.t("about.pageTitle");
    }

    if (url.startsWith("/manual")) {
      return this.loc.t("manual.pageTitle");
    }

    if (url.startsWith("/dev-admin") || url.startsWith("/health")) {
      return this.loc.t("common.devAdmin");
    }

    return this.loc.t("app.home");
  }
}
