import { routing } from "@/i18n/routing";
export const genAlternatesLanguage = () => {
  const languages = routing.locales.reduce(
    (acc, locale) => {
      acc[locale] = locale === "en" ? "/" : `/${locale}`;
      return acc;
    },
    {} as Record<string, string>,
  );

  return languages;
};
