import { computed, inject, Injectable, signal } from "@angular/core";

import { buildApiUrl } from "./api-url";
import { readApiErrorMessage } from "./shared/api-errors";
import {
  isLanguagePreference,
  LocalizationService,
  type LanguagePreference,
  type TranslationKey
} from "./shared/localization.service";
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

export type RegisterResult = LoginResult;

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
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  async loadCurrentUser(): Promise<void> {
    if (!this.token()) {
      this.user.set(null);
      return;
    }

    let response: Response;
    try {
      response = await fetch(buildApiUrl("/api/admin/me"), {
        headers: {
          accept: "application/json",
          ...this.getAuthorizationHeaders()
        },
        method: "GET"
      });
    } catch {
      this.clearToken();
      return;
    }

    if (!response.ok) {
      this.clearToken();
      return;
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!isCurrentUserResponse(payload)) {
      this.clearToken();
      return;
    }
    this.user.set(this.normalizeUser(payload.user));
  }

  async login(email: string, password: string): Promise<LoginResult> {
    let response: Response;
    try {
      response = await fetch(buildApiUrl("/api/login"), {
        body: JSON.stringify({ email, password }),
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        method: "POST"
      });
    } catch {
      return {
        message: this.loc.t("app.loginRequestFailed"),
        status: "error"
      };
    }

    if (!response.ok) {
      return {
        message:
          response.status === 401
            ? this.loc.t("app.loginInvalid")
            : response.status === 503
              ? this.loc.t("app.loginNotConfigured")
              : await readApiErrorMessage(response, this.loc.t("app.loginFailure"), (messageKey) =>
                  this.loc.t(messageKey as TranslationKey)
                ),
        status: "error"
      };
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!isLoginResponse(payload)) {
      return {
        message: this.loc.t("app.loginFailure"),
        status: "error"
      };
    }
    this.storeToken(payload.token);
    this.user.set(this.normalizeUser(payload.user));

    return { status: "ok" };
  }

  async register(email: string, password: string): Promise<RegisterResult> {
    let response: Response;
    try {
      response = await fetch(buildApiUrl("/api/register"), {
        body: JSON.stringify({ email, password }),
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        method: "POST"
      });
    } catch {
      return {
        message: this.loc.t("app.registrationRequestFailed"),
        status: "error"
      };
    }

    if (!response.ok) {
      return {
        message: await readApiErrorMessage(
          response,
          response.status === 503
            ? this.loc.t("app.registrationNotConfigured")
            : this.loc.t("app.registrationFailure"),
          (messageKey) => this.loc.t(messageKey as TranslationKey)
        ),
        status: "error"
      };
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!isLoginResponse(payload)) {
      return {
        message: this.loc.t("app.registrationFailure"),
        status: "error"
      };
    }
    this.storeToken(payload.token);
    this.user.set(this.normalizeUser(payload.user));

    return { status: "ok" };
  }

  async logout(): Promise<void> {
    await fetch(buildApiUrl("/api/logout"), {
      headers: this.getAuthorizationHeaders(),
      method: "POST"
    }).catch(() => undefined);
    this.clearToken();
  }

  async updateUserPreferences(preferences: {
    language?: LanguagePreference;
    theme?: ThemePreference;
  }): Promise<void> {
    let response: Response;
    try {
      response = await fetch(buildApiUrl("/api/admin/preferences"), {
        body: JSON.stringify(preferences),
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...this.getAuthorizationHeaders()
        },
        method: "PATCH"
      });
    } catch {
      return;
    }

    if (!response.ok) {
      return;
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    if (isUserPreferencesResponse(payload)) this.user.set(this.normalizeUser(payload.user));
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
        language: isLanguagePreference(user.profile?.language) ? user.profile.language : undefined,
        theme: isThemePreference(user.profile?.theme) ? user.profile.theme : undefined
      },
      role: user.role
    };
  }
}

function isCurrentUserResponse(value: unknown): value is CurrentUserResponse {
  return isRecord(value) && isAuthenticatedUser(value["user"]);
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return (
    isRecord(value) &&
    typeof value["token"] === "string" &&
    value["token"].length > 0 &&
    value["tokenType"] === "Bearer" &&
    isAuthenticatedUser(value["user"])
  );
}

function isUserPreferencesResponse(value: unknown): value is UserPreferencesResponse {
  return isRecord(value) && isAuthenticatedUser(value["user"]);
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  return (
    isRecord(value) &&
    typeof value["email"] === "string" &&
    (value["role"] === "admin" || value["role"] === "user") &&
    isRecord(value["profile"])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
