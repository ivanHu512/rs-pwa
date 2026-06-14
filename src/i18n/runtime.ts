import { getCookie, setCookie } from "@/lib/cookie";
import { LANGUAGE_COOKIE_KEY } from "@/lib/constant";
import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  getSupportedLocale,
  normalizeLocale,
  type AppLocale,
} from "./language";

export function detectInitialLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const cookieLocale = getCookie(LANGUAGE_COOKIE_KEY);
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const browserLocales = window.navigator.languages?.length
    ? window.navigator.languages
    : [window.navigator.language];

  for (const locale of browserLocales) {
    const supportedLocale = getSupportedLocale(locale);
    if (supportedLocale) {
      return supportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

export function detectCurrentLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const cookieLocale = getCookie(LANGUAGE_COOKIE_KEY);
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  return detectInitialLocale();
}

export function persistLocale(locale: AppLocale) {
  if (typeof window === "undefined") return;

  setCookie(LANGUAGE_COOKIE_KEY, locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = getLocaleDirection();
}
