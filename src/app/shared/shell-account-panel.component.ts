import { Component, effect, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { AuthenticatedUser } from "../auth.service";
import { HouseholdInvitationService } from "../household/household-invitation.service";
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
  template: `
    <section class="auth-card" [attr.aria-label]="loc.t('app.account')">
      @if (user(); as signedInUser) {
        <div class="user-chip">
          <span>{{ signedInUser.email }}</span>
          <button class="ui-button ui-button-sm" type="button" (click)="logoutRequested.emit()">
            {{ loc.t("app.logout") }}
          </button>
        </div>
        @if (invitationService.pendingInvitations().length > 0) {
          <div class="pending-invitations">
            <strong>{{ loc.t("app.pendingInvitations") }}</strong>
            @for (invitation of invitationService.pendingInvitations(); track invitation.id) {
              <div class="pending-invitation">
                <span>
                  {{
                    loc.t("app.invitationForHousehold", {
                      household: invitation.householdName ?? invitation.householdId
                    })
                  }}
                </span>
                <span class="invitation-actions">
                  <button
                    class="ui-button ui-button-primary ui-button-sm invitation-action-button"
                    type="button"
                    [disabled]="acceptingInvitationId === invitation.id"
                    (click)="acceptInvitation(invitation.id)"
                    [attr.aria-label]="loc.t('app.acceptInvitation')"
                    [attr.title]="loc.t('app.acceptInvitation')"
                  >
                    <span aria-hidden="true">
                      {{ acceptingInvitationId === invitation.id ? "…" : "✓" }}
                    </span>
                  </button>
                  <button
                    class="ui-button ui-button-danger ui-button-sm invitation-action-button"
                    type="button"
                    [disabled]="acceptingInvitationId === invitation.id"
                    (click)="rejectInvitation(invitation.id)"
                    [attr.aria-label]="loc.t('app.rejectInvitation')"
                    [attr.title]="loc.t('app.rejectInvitation')"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </span>
              </div>
            }
          </div>
        }
      } @else {
        @if (registerMode) {
          <p class="auth-hint">{{ loc.t("app.registrationHint") }}</p>
        }
        <form class="login-form" (ngSubmit)="submitAuth()">
          <input
            class="ui-form-control"
            autocomplete="username"
            name="email"
            [placeholder]="loc.t('app.email')"
            type="email"
            [(ngModel)]="loginEmail"
            [disabled]="loginLoading()"
          />
          <input
            class="ui-form-control"
            [autocomplete]="registerMode ? 'new-password' : 'current-password'"
            name="password"
            [placeholder]="loc.t('app.password')"
            type="password"
            [(ngModel)]="loginPassword"
            [disabled]="loginLoading()"
          />
          <button class="ui-button ui-button-sm" type="submit" [disabled]="loginLoading()">
            @if (loginLoading()) {
              <span class="auth-spinner" aria-hidden="true"></span>
            }
            <span>
              {{
                loginLoading()
                  ? registerMode
                    ? loc.t("app.registering")
                    : loc.t("app.loadingLogin")
                  : registerMode
                    ? loc.t("app.register")
                    : loc.t("app.login")
              }}
            </span>
          </button>
        </form>
        @if (loginLoading()) {
          <p class="auth-wakeup-note" role="status">{{ loc.t("app.loginWakeupNotice") }}</p>
        }
        <button
          class="auth-mode-button"
          type="button"
          [disabled]="loginLoading()"
          (click)="toggleRegisterMode()"
        >
          {{ registerMode ? loc.t("app.switchToLogin") : loc.t("app.switchToRegistration") }}
        </button>
      }

      <label class="preference-field">
        <span>{{ loc.t("app.theme") }}</span>
        <select
          class="ui-form-control"
          name="theme"
          [ngModel]="theme()"
          (ngModelChange)="setTheme($event)"
        >
          <option value="light">{{ loc.t("app.light") }}</option>
          <option value="dark">{{ loc.t("app.dark") }}</option>
        </select>
      </label>

      <label class="preference-field">
        <span>{{ loc.t("app.language.label") }}</span>
        <select
          class="ui-form-control"
          name="language"
          [ngModel]="language()"
          (ngModelChange)="setLanguage($event)"
        >
          <option value="en">{{ loc.t("app.language.english") }}</option>
          <option value="hu">{{ loc.t("app.language.hungarian") }}</option>
        </select>
      </label>
    </section>
  `,
  styles: [
    `
      :host {
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

      .auth-hint {
        color: var(--color-text-muted);
        font-size: 0.76rem;
        line-height: 1.3;
        margin: 0 0 var(--space-2);
      }

      .login-form .ui-form-control,
      .preference-field .ui-form-control {
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

      .login-form .ui-button {
        align-items: center;
        display: inline-flex;
        gap: 0.45rem;
        justify-content: center;
      }

      .login-form .ui-button:disabled {
        cursor: progress;
        opacity: 0.72;
      }

      .auth-spinner {
        animation: auth-spin 0.8s linear infinite;
        border: 0.16rem solid color-mix(in srgb, currentColor 30%, transparent);
        border-radius: 50%;
        border-top-color: currentColor;
        flex: 0 0 auto;
        height: 0.9rem;
        width: 0.9rem;
      }

      .auth-wakeup-note {
        color: var(--color-text-muted);
        font-size: 0.76rem;
        line-height: 1.35;
        margin: var(--space-2) 0 0;
      }

      @keyframes auth-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .auth-spinner {
          animation: none;
        }
      }

      .auth-mode-button {
        background: transparent;
        border: 0;
        color: var(--color-text-muted);
        cursor: pointer;
        font: inherit;
        font-size: 0.72rem;
        margin-top: var(--space-2);
        padding: 0.2rem 0;
        text-decoration: underline;
      }

      .auth-mode-button:disabled {
        cursor: progress;
        opacity: 0.58;
      }

      .pending-invitations {
        border-top: 1px solid var(--line-subtle);
        display: grid;
        gap: 0.35rem;
        margin-top: var(--space-2);
        padding-top: var(--space-2);
      }

      .pending-invitations > strong {
        color: var(--color-text-muted);
        font-size: 0.7rem;
        text-transform: uppercase;
      }

      .pending-invitation {
        align-items: center;
        display: grid;
        gap: 0.4rem;
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .pending-invitation span {
        color: var(--color-text);
        font-size: 0.78rem;
      }

      .invitation-actions {
        align-items: center;
        display: inline-flex;
        gap: var(--space-1);
        justify-content: flex-end;
      }

      .invitation-action-button {
        align-items: center;
        display: inline-flex;
        font-size: 0.9rem;
        height: 1.8rem;
        justify-content: center;
        min-width: 1.8rem;
        padding: 0;
        width: 1.8rem;
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

        .login-form .ui-form-control,
        .preference-field .ui-form-control {
          width: min(11rem, 28vw);
        }
      }

      @media (max-width: 520px) {
        .login-form .ui-form-control,
        .preference-field .ui-form-control {
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
  ]
})
export class ShellAccountPanelComponent {
  readonly loc = inject(LocalizationService);
  readonly invitationService = inject(HouseholdInvitationService);
  readonly user = input<AuthenticatedUser | null>(null);
  readonly loginLoading = input(false);
  readonly theme = input.required<ThemePreference>();
  readonly language = input.required<LanguagePreference>();
  readonly loginResetToken = input(0);

  readonly loginRequested = output<ShellLoginCredentials>();
  readonly registerRequested = output<ShellLoginCredentials>();
  readonly invitationAccepted = output<string>();
  readonly logoutRequested = output<void>();
  readonly themeChanged = output<ThemePreference>();
  readonly languageChanged = output<LanguagePreference>();

  loginEmail = "";
  loginPassword = "";
  registerMode = false;
  acceptingInvitationId = "";

  private readonly resetPassword = effect(() => {
    this.loginResetToken();
    this.loginPassword = "";
    this.registerMode = false;
  });
  private readonly loadInvitations = effect(() => {
    const user = this.user();
    if (user) {
      void this.invitationService.loadPending();
    } else {
      this.invitationService.clear();
    }
  });

  submitAuth(): void {
    const credentials = {
      email: this.loginEmail,
      password: this.loginPassword
    };
    if (this.registerMode) {
      this.registerRequested.emit(credentials);
      return;
    }
    this.loginRequested.emit(credentials);
  }

  toggleRegisterMode(): void {
    this.registerMode = !this.registerMode;
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    this.acceptingInvitationId = invitationId;
    const result = await this.invitationService.accept(invitationId);
    this.acceptingInvitationId = "";
    if (result.status === "ok") this.invitationAccepted.emit(result.invitation.householdId);
  }

  async rejectInvitation(invitationId: string): Promise<void> {
    this.acceptingInvitationId = invitationId;
    await this.invitationService.reject(invitationId);
    this.acceptingInvitationId = "";
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
