import { Component, effect, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { AuthenticatedUser } from "../auth.service";
import { LocalizationService, type LanguagePreference } from "./localization.service";
import type { ThemePreference } from "./theme-preference.service";

export interface ShellLoginCredentials {
  email: string;
  password: string;
}

@Component({
  imports: [FormsModule],
  selector: "app-shell-account-panel",
  standalone: true,
  template: `<section class="auth-card" [attr.aria-label]="loc.t('app.account')">
  @if (user(); as signedInUser) {
    <div class="user-chip">
      <span>{{ signedInUser.email }}</span>
      <button type="button" (click)="logoutRequested.emit()">{{ loc.t("app.logout") }}</button>
    </div>
  } @else {
    <form class="login-form" (ngSubmit)="submitLogin()">
      <input
        autocomplete="username"
        name="email"
        [placeholder]="loc.t('app.email')"
        type="email"
        [(ngModel)]="loginEmail"
        [disabled]="loginLoading()"
      />
      <input
        autocomplete="current-password"
        name="password"
        [placeholder]="loc.t('app.password')"
        type="password"
        [(ngModel)]="loginPassword"
        [disabled]="loginLoading()"
      />
      <button type="submit" [disabled]="loginLoading()">
        {{ loginLoading() ? loc.t("app.loadingLogin") : loc.t("app.login") }}
      </button>
    </form>
  }

  <label class="preference-field">
    <span>{{ loc.t("app.theme") }}</span>
    <select name="theme" [ngModel]="theme()" (ngModelChange)="setTheme($event)">
      <option value="light">{{ loc.t("app.light") }}</option>
      <option value="dark">{{ loc.t("app.dark") }}</option>
    </select>
  </label>

  <label class="preference-field">
    <span>{{ loc.t("app.language.label") }}</span>
    <select name="language" [ngModel]="language()" (ngModelChange)="setLanguage($event)">
      <option value="en">{{ loc.t("app.language.english") }}</option>
      <option value="hu">{{ loc.t("app.language.hungarian") }}</option>
    </select>
  </label>
</section>
`,
  styles: [
    `:host {
  display: block;
}

.auth-card {
  padding: 0.45rem;
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

@media (max-width: 1180px) {
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
}

@media (max-width: 520px) {
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
}
`
  ],
})
export class ShellAccountPanelComponent {
  readonly loc = inject(LocalizationService);
  readonly user = input<AuthenticatedUser | null>(null);
  readonly loginLoading = input(false);
  readonly theme = input.required<ThemePreference>();
  readonly language = input.required<LanguagePreference>();
  readonly loginResetToken = input(0);

  readonly loginRequested = output<ShellLoginCredentials>();
  readonly logoutRequested = output<void>();
  readonly themeChanged = output<ThemePreference>();
  readonly languageChanged = output<LanguagePreference>();

  loginEmail = "";
  loginPassword = "";

  private readonly resetPassword = effect(() => {
    this.loginResetToken();
    this.loginPassword = "";
  });

  submitLogin(): void {
    this.loginRequested.emit({
      email: this.loginEmail,
      password: this.loginPassword
    });
  }

  setLanguage(value: string): void {
    if (value === "en" || value === "hu") {
      this.languageChanged.emit(value);
    }
  }

  setTheme(value: string): void {
    if (value === "light" || value === "dark") {
      this.themeChanged.emit(value);
    }
  }
}
