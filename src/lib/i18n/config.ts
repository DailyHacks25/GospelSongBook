/** Locale configuration for the bilingual UI. */

import { LANGUAGES, type Language, type Locale } from "@/lib/types";

export type { Locale };

export const LOCALES: readonly Locale[] = LANGUAGES;
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  hi: "हिंदी",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeFromParam(param: string | undefined): Locale {
  return isLocale(param) ? param : DEFAULT_LOCALE;
}

/** HTML `lang` attribute value. */
export function htmlLang(locale: Locale): string {
  return locale === "hi" ? "hi" : "en";
}

export function localeName(locale: Language): string {
  return LOCALE_NAMES[locale];
}
