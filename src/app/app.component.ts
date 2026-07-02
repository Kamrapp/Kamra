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

@Component({
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  selector: "app-root",
  standalone: true,
  template: `
    <main class="shell" aria-label="Kamra app">
      <header class="topbar">
        <a class="brand-link" routerLink="/" (click)="closeMenu()" aria-label="Kamra home">
          <img
            class="brand-mark"
            src="/brand/kamra-basket.png"
            alt=""
            width="72"
            height="72"
          />
          <span class="brand-copy">
            <span class="eyebrow">Kamra</span>
            <span class="brand-title">Pantry foundations, gently stocked.</span>
          </span>
        </a>

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
      </header>

      <section class="page-body" aria-label="Current page">
        <div class="page-scroll">
          <router-outlet />
        </div>
      </section>

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

      <button
        class="menu-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-controls="primary-menu"
        [attr.aria-expanded]="isMenuOpen"
        [class.menu-toggle-open]="isMenuOpen"
        (click)="toggleMenu()"
      >
        <span aria-hidden="true">{{ isMenuOpen ? "›" : "‹" }}</span>
      </button>

      <aside
        id="primary-menu"
        class="side-menu"
        [class.side-menu-open]="isMenuOpen"
        [attr.aria-hidden]="!isMenuOpen"
      >
        <div class="side-menu-header">
          <p class="side-menu-title">Navigation</p>
        </div>

        <nav class="nav-list" aria-label="Primary">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="closeMenu()"
          >
            <span aria-hidden="true">01</span>
            Home
          </a>
          <a routerLink="/health" routerLinkActive="active" (click)="closeMenu()">
            <span aria-hidden="true">02</span>
            Health check
          </a>
          <a routerLink="/products" routerLinkActive="active" (click)="closeMenu()">
            <span aria-hidden="true">03</span>
            Products
          </a>
          <a routerLink="/admin/ingestion" routerLinkActive="active" (click)="closeMenu()">
            <span aria-hidden="true">04</span>
            Crawls
          </a>
        </nav>
      </aside>
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
        gap: var(--space-6);
        grid-template-rows: auto minmax(0, 1fr);
        height: 100dvh;
        margin: 0 auto;
        max-height: 100dvh;
        overflow: clip;
        padding: var(--space-page);
        width: min(100%, 76rem);
      }

      .topbar {
        align-items: center;
        backdrop-filter: blur(14px);
        background: rgb(248 244 241 / 76%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 16%, transparent);
        border-radius: 8px;
        box-shadow: 0 1rem 2.4rem rgb(48 43 50 / 8%);
        display: flex;
        gap: var(--space-4);
        justify-content: space-between;
        min-height: 4.5rem;
        padding: 0.85rem 1rem;
        position: relative;
        z-index: 10;
      }

      .brand-link {
        align-items: center;
        color: inherit;
        display: inline-flex;
        gap: var(--space-3);
        min-width: 0;
        text-decoration: none;
      }

      .brand-mark {
        aspect-ratio: 1;
        filter: drop-shadow(0 0.7rem 1.2rem rgb(105 88 79 / 18%));
        height: clamp(3.5rem, 9vw, 4.5rem);
        width: clamp(3.5rem, 9vw, 4.5rem);
      }

      .brand-copy {
        display: grid;
        gap: 0.1rem;
        min-width: 0;
      }

      .eyebrow {
        color: var(--color-text-muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0;
        line-height: 1.2;
        text-transform: uppercase;
      }

      .brand-title {
        color: var(--color-text);
        font-family: var(--font-display);
        font-size: clamp(1.05rem, 3vw, 1.35rem);
        font-weight: 700;
        line-height: 1.18;
      }

      .login-form,
      .user-chip {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        justify-content: flex-end;
      }

      .login-form input {
        background: color-mix(in srgb, var(--color-surface) 88%, white 12%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 18%, transparent);
        border-radius: 8px;
        color: var(--color-text);
        font: inherit;
        min-height: 2.35rem;
        padding: 0.55rem 0.7rem;
        width: min(12rem, 32vw);
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
        min-height: 2.35rem;
        padding: 0.55rem 0.8rem;
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
        font-size: 0.92rem;
        padding: 0 0.45rem;
      }

      .page-body {
        min-height: 0;
        overflow: hidden;
        position: relative;
      }

      .page-scroll {
        display: grid;
        gap: var(--space-6);
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

      .menu-toggle {
        align-items: center;
        background: color-mix(in srgb, var(--color-surface) 86%, white 14%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 28%, transparent);
        border-radius: 8px 0 0 8px;
        box-shadow: 0 0.55rem 1.4rem rgb(48 43 50 / 10%);
        color: var(--color-text);
        cursor: pointer;
        display: inline-flex;
        height: 3.2rem;
        justify-content: center;
        padding: 0;
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        transition: right 180ms ease;
        width: 2rem;
        z-index: 35;
      }

      .menu-toggle-open {
        right: min(22rem, calc(100vw - 2rem));
      }

      .menu-toggle span {
        font-size: 1.45rem;
        line-height: 1;
      }

      .side-menu {
        background: color-mix(in srgb, var(--color-surface) 94%, white 6%);
        border: 1px solid color-mix(in srgb, var(--color-wood) 24%, transparent);
        border-radius: 8px 0 0 8px;
        box-shadow: -1.6rem 0 3.4rem rgb(48 43 50 / 18%);
        display: grid;
        gap: var(--space-5);
        grid-template-rows: auto 1fr;
        height: min(30rem, 52vh);
        max-width: min(24rem, calc(100vw - 2rem));
        padding: var(--space-5);
        position: fixed;
        right: 0;
        top: 50%;
        transform: translate(105%, -50%);
        transition: transform 180ms ease;
        width: 22rem;
        z-index: 30;
      }

      .side-menu-open {
        transform: translate(0, -50%);
      }

      .side-menu-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      .side-menu-title {
        color: var(--color-text-muted);
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0;
        margin: 0;
        text-transform: uppercase;
      }

      .nav-list {
        display: grid;
        gap: var(--space-2);
        align-content: start;
      }

      .nav-list a {
        align-items: center;
        border-radius: 8px;
        color: var(--color-text);
        display: flex;
        gap: var(--space-3);
        min-height: 3.25rem;
        padding: 0.75rem 0.9rem;
        text-decoration: none;
      }

      .nav-list a:hover,
      .nav-list a.active {
        background: color-mix(in srgb, var(--color-accent-sky) 28%, white 72%);
      }

      .nav-list span {
        color: var(--color-wood-deep);
        font-family: var(--font-mono);
        font-size: 0.76rem;
      }

      @media (max-width: 520px) {
        :host,
        .shell {
          height: 100dvh;
        }

        .topbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .brand-title {
          max-width: 14rem;
        }

        .login-form {
          justify-content: flex-start;
        }

        .login-form input {
          width: min(100%, 16rem);
        }

        .login-message {
          left: var(--space-4);
          max-width: none;
          right: var(--space-4);
        }
      }
    `
  ]
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly loginMessage = signal("");
  readonly loginMessageTone = signal<"error" | "success">("success");
  readonly loginState = signal<"idle" | "loading">("idle");
  isMenuOpen = false;
  loginEmail = "";
  loginPassword = "";
  private readonly router = inject(Router);
  private loginMessageTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeMenu();
      }
    });
  }

  ngOnInit(): void {
    void this.auth.loadCurrentUser();

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
}
