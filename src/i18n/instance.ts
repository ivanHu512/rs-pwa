import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  supportedLocales,
  type AppLocale,
} from "./language";
import { detectInitialLocale } from "./runtime";

type MessageTree = Record<string, string>;

const localeModules = import.meta.glob("../locales/*.json", {
  eager: true,
}) as Record<string, { default: MessageTree }>;

const isTruthy = <T>(value: T | null): value is T => {
  return value !== null;
}

const resources = Object.fromEntries(
  Object.entries(localeModules)
    .map(([path, module]) => {
      const locale = path.match(/\/([^/]+)\.json$/)?.[1];
      if (!locale || !supportedLocales.includes(locale as AppLocale)) {
        return null;
      }
      return [locale as AppLocale, { translation: module.default }] as const;
    })
    .filter(isTruthy),
) as Record<AppLocale, { translation: MessageTree }>;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectInitialLocale(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: supportedLocales,
    defaultNS: "translation",
    ns: ["translation"],
    interpolation: {
      escapeValue: false,
    },
  });
}

i18n.on("languageChanged", (nextLocale) => {
  const normalizedLocale = normalizeLocale(nextLocale);
  if (normalizedLocale !== nextLocale) {
    void i18n.changeLanguage(normalizedLocale);
  }
});

export default i18n;
