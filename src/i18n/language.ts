export const DEFAULT_LOCALE = "en";

export const languageSelectorLocales = [
  "en",
  "ja",
  "pt",
  "th",
  "es",
  "de",
  "fr",
  "pl",
  "ro"
] as const;

export type AppLocale = (typeof languageSelectorLocales)[number];

export const supportedLocales = languageSelectorLocales;

export const languages = [
  { locale: "en", label: "English", name: "English" },
  { locale: "ja", label: "Japanese", name: "日本語" },
  { locale: "pt", label: "Portuguese", name: "Português" },
  { locale: "th", label: "Thai", name: "ภาษาไทย" },
  { locale: "es", label: "Spanish", name: "Español" },
  { locale: "de", label: "German", name: "Deutsch" },
  { locale: "fr", label: "French", name: "Français" },
  { locale: "pl", label: "Polish", name: "Polski" },
  { locale: "ro", label: "Romanian", name: "Română" },
] as const satisfies ReadonlyArray<{
  locale: AppLocale;
  label: string;
  name: string;
}>;

export function getSupportedLocale(locale?: string | null): AppLocale | null {
  if (!locale) return null;

  const normalized = locale.trim().replace(/_/g, "-").toLowerCase();
  const canonical =
    normalized === "id" || normalized.startsWith("id-")
      ? `in${normalized.slice(2)}`
      : normalized;

  if (languageSelectorLocales.includes(canonical as AppLocale)) {
    return canonical as AppLocale;
  }

  const baseLocale = canonical.split("-")[0];
  if (languageSelectorLocales.includes(baseLocale as AppLocale)) {
    return baseLocale as AppLocale;
  }

  return null;
}

export function normalizeLocale(locale?: string | null): AppLocale {
  return getSupportedLocale(locale) ?? DEFAULT_LOCALE;
}

export function getLocaleDirection(): "ltr" | "rtl" {
  return "ltr";
}
