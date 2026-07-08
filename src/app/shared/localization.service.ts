import { DOCUMENT } from "@angular/common";
import { effect, inject, Injectable, signal } from "@angular/core";

import enTranslations from "../i18n/en.json";
import huTranslations from "../i18n/hu.json";

export type LanguagePreference = "en" | "hu";

export interface LanguageOption {
  code: LanguagePreference;
  label: string;
}

type TranslationTree = typeof enTranslations;
type TranslationParams = Record<string, number | string>;
type LeafPath<T> = T extends string
  ? never
  : {
      [K in Extract<keyof T, string>]: T[K] extends string
        ? K
        : `${K}.${LeafPath<T[K]>}`;
    }[Extract<keyof T, string>];

export type TranslationKey = LeafPath<TranslationTree>;

const languageCookieName = "kamra_language";
const cookieMaxAgeSeconds = 60 * 60 * 24 * 365;
const defaultLanguagePreference: LanguagePreference = "en";

const translations = {
  en: enTranslations,
  hu: huTranslations
} satisfies Record<LanguagePreference, TranslationTree>;

@Injectable({
  providedIn: "root"
})
export class LocalizationService {
  readonly language = signal<LanguagePreference>(defaultLanguagePreference);
  readonly languageOptions: readonly LanguageOption[] = [
    { code: "en", label: enTranslations.app.language.english },
    { code: "hu", label: huTranslations.app.language.hungarian }
  ];
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.language.set(this.readCookieLanguage());

    effect(() => {
      this.document.documentElement.lang = this.language();
    });
  }

  applyUserLanguage(language: LanguagePreference | undefined): void {
    if (language) {
      this.language.set(language);
      return;
    }

    this.language.set(this.readCookieLanguage());
  }

  setAnonymousLanguage(language: LanguagePreference): void {
    this.language.set(language);
    this.writeLanguageCookie(language);
  }

  setLanguage(language: LanguagePreference): void {
    this.language.set(language);
  }

  t(key: TranslationKey, params: TranslationParams = {}): string {
    const translated = readTranslation(translations[this.language()], key)
      ?? readTranslation(translations.en, key)
      ?? key;

    return Object.entries(params).reduce(
      (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
      translated
    );
  }

  private readCookieLanguage(): LanguagePreference {
    const language = this.readCookieValue(languageCookieName);
    return isLanguagePreference(language)
      ? language
      : defaultLanguagePreference;
  }

  private readCookieValue(name: string): string | null {
    const cookies = this.document.cookie
      .split(";")
      .map((cookie) => cookie.trim());
    const prefix = `${name}=`;
    const match = cookies.find((cookie) => cookie.startsWith(prefix));

    return match
      ? decodeURIComponent(match.slice(prefix.length))
      : null;
  }

  private writeLanguageCookie(language: LanguagePreference): void {
    this.document.cookie = `${languageCookieName}=${encodeURIComponent(language)}; Max-Age=${cookieMaxAgeSeconds}; Path=/; SameSite=Lax`;
  }
}

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === "en" || value === "hu";
}

function readTranslation(tree: TranslationTree, key: TranslationKey): string | null {
  let current: unknown = tree;

  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string"
    ? current
    : null;
}
