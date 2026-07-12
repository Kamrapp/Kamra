import { DOCUMENT } from "@angular/common";
import { effect, inject, Injectable, signal } from "@angular/core";

export type ThemePreference = "dark" | "light";

const themeCookieName = "kamra_theme";
const cookieMaxAgeSeconds = 60 * 60 * 24 * 365;
const defaultThemePreference: ThemePreference = "light";

@Injectable({
  providedIn: "root"
})
export class ThemePreferenceService {
  readonly theme = signal<ThemePreference>(defaultThemePreference);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.theme.set(this.readCookieTheme());

    effect(() => {
      const theme = this.theme();
      this.document.documentElement.dataset["theme"] = theme;
      this.document.documentElement.style.colorScheme = theme;
    });
  }

  applyUserTheme(theme: ThemePreference | undefined): void {
    if (theme) {
      this.theme.set(theme);
      return;
    }

    this.theme.set(this.readCookieTheme());
  }

  setAnonymousTheme(theme: ThemePreference): void {
    this.theme.set(theme);
    this.writeThemeCookie(theme);
  }

  setTheme(theme: ThemePreference): void {
    this.theme.set(theme);
  }

  private readCookieTheme(): ThemePreference {
    const theme = this.readCookieValue(themeCookieName);
    return isThemePreference(theme) ? theme : defaultThemePreference;
  }

  private readCookieValue(name: string): string | null {
    const cookies = this.document.cookie.split(";").map((cookie) => cookie.trim());
    const prefix = `${name}=`;
    const match = cookies.find((cookie) => cookie.startsWith(prefix));

    return match ? decodeURIComponent(match.slice(prefix.length)) : null;
  }

  private writeThemeCookie(theme: ThemePreference): void {
    this.document.cookie = `${themeCookieName}=${encodeURIComponent(theme)}; Max-Age=${cookieMaxAgeSeconds}; Path=/; SameSite=Lax`;
  }
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "dark" || value === "light";
}
