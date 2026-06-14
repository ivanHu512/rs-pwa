import i18n from "./instance";
import { normalizeLocale, type AppLocale } from "./language";
import { detectCurrentLocale } from "./runtime";

export type TranslateValues = Record<string, string | number>;

export function translateByLocale(
  locale: AppLocale,
  key: string,
  values?: TranslateValues,
  fallback?: string,
) {
  const result = i18n.t(key, {
    ...(values ?? {}),
    lng: normalizeLocale(locale),
    defaultValue: fallback ?? key,
  });
  return typeof result === "string" ? result : String(result);
}

export function tStatic(
  key: string,
  values?: TranslateValues,
  fallback?: string,
) {
  const locale = detectCurrentLocale();
  return translateByLocale(locale, key, values, fallback);
}
