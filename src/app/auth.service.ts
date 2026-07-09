import { computed, inject, Injectable, signal } from "@angular/core";

import { readApiErrorMessage } from "./shared/api-errors";
import { isLanguagePreference, LocalizationService, type LanguagePreference } from "./shared/localization.service";
import { isThemePreference, type ThemePreference } from "./shared/theme-preference.service";

export type UserRole = "admin" | "user";

interface LoginResponse {
  token: string;
  tokenType: "Bearer";
  user: AuthenticatedUser;
}

interface CurrentUserResponse {
  user: AuthenticatedUser;
}

interface UserPreferencesResponse {
  user: AuthenticatedUser;
}

export interface AuthenticatedUser {
  email: string;
  profile: {
    language?: LanguagePreference;
    theme?: ThemePreference;
  };
  role: UserRole;
}

export type LoginResult =
  | {
      status: "ok";
    }
  | {
      message: string;
      status: "error";
    };

const userTokenStorageKey = "kamra_user_token";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private readonly loc = inject(LocalizationService);
  readonly token = signal<string | null>(this.readStoredToken());
  readonly user = signal<AuthenticatedUser | null>(null);
  readonly isAuthenticated = computed(() => Boolean(this.token() && this.user()));

  getAuthorizationHeaders(): Record<string, string> {
    const token = this.token();
    return token
      ? { authorization: `Bearer ${token}` }
      : {};
  }

  async loadCurrentUser(): Promise<void> {
    if (!this.token()) {
      this.user.set(null);
      return;
    }

    const response = await fetch("/api/admin/me", {
      headers: {
        accept: "application/json",
        ...this.getAuthorizationHeaders()
      },
      method: "GET"
    });

    if (!response.ok) {
      this.clearToken();
      return;
    }

    const payload = (await response.json()) as CurrentUserResponse;
    this.user.set(this.normalizeUser(payload.user));
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const response = await fetch("/api/login", {
      body: JSON.stringify({ email, password }),
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      return {
        message: response.status === 401
          ? this.loc.t("app.loginInvalid")
          : await readApiErrorMessage(response, this.loc.t("app.loginFailure")),
        status: "error"
      };
    }

    const payload = (await response.json()) as LoginResponse;
    this.storeToken(payload.token);
    this.user.set(this.normalizeUser(payload.user));

    return { status: "ok" };
  }

  async logout(): Promise<void> {
    await fetch("/api/logout", {
      headers: this.getAuthorizationHeaders(),
      method: "POST"
    }).catch(() => undefined);
    this.clearToken();
  }

  async updateUserPreferences(preferences: { language?: LanguagePreference; theme?: ThemePreference }): Promise<void> {
    const response = await fetch("/api/admin/preferences", {
      body: JSON.stringify(preferences),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.getAuthorizationHeaders()
      },
      method: "PATCH"
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as UserPreferencesResponse;
    this.user.set(this.normalizeUser(payload.user));
  }

  async updateThemePreference(theme: ThemePreference): Promise<void> {
    await this.updateUserPreferences({ theme });
  }

  private clearToken(): void {
    this.token.set(null);
    this.user.set(null);
    window.localStorage.removeItem(userTokenStorageKey);
  }

  private readStoredToken(): string | null {
    return window.localStorage.getItem(userTokenStorageKey);
  }

  private storeToken(token: string): void {
    window.localStorage.setItem(userTokenStorageKey, token);
    this.token.set(token);
  }

  private normalizeUser(user: AuthenticatedUser): AuthenticatedUser {
    return {
      email: user.email,
      profile: {
        language: isLanguagePreference(user.profile?.language)
          ? user.profile.language
          : undefined,
        theme: isThemePreference(user.profile?.theme)
          ? user.profile.theme
          : undefined
      },
      role: user.role
    };
  }
}
