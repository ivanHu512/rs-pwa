import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { syncMiniUserInfo } from "@/lib/syncMiniUserInfo";
import { I18nContext } from "./context";
import i18n from "./instance";
import {
  getLocaleDirection,
  languages,
  normalizeLocale,
  type AppLocale,
} from "./language";
import { persistLocale, detectCurrentLocale } from "./runtime";
import type { TranslateValues } from "./translate";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    detectCurrentLocale(),
  );

  const isFirstMount = useRef(true);

  useEffect(() => {
    persistLocale(locale);
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }

    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // 切换语言后，重新请求 user info 接口，并刷新页面以确保整个页面状态更新
    syncMiniUserInfo().catch((error) => {
      console.error(
        "[i18n] syncMiniUserInfo failed after locale change",
        error,
      );
    });
  }, [locale]);

  useEffect(() => {
    const handleLanguageChanged = (nextLocale: string) => {
      setLocaleState(normalizeLocale(nextLocale));
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const setLocale = (nextLocale: AppLocale) => {
    setLocaleState(normalizeLocale(nextLocale));
  };

  const t = (key: string, values?: TranslateValues, fallback?: string) => {
    const result = i18n.t(key, {
      ...(values ?? {}),
      lng: locale,
      defaultValue: fallback ?? key,
    });
    return typeof result === "string" ? result : String(result);
  };

  const value = useMemo(
    () => ({
      dir: getLocaleDirection(),
      locale,
      languages,
      setLocale,
      t,
    }),
    [locale],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
}
