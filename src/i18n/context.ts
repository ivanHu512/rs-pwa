import { createContext, useContext } from "react";
import type { AppLocale } from "./language";

type TranslateValues = Record<string, string | number>;

export interface I18nContextValue {
  dir: "ltr" | "rtl";
  locale: AppLocale;
  languages: ReadonlyArray<{ locale: AppLocale; label: string; name: string }>;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, values?: TranslateValues, fallback?: string) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
