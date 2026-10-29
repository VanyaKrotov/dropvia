import { createInstance } from 'i18next';
import { en } from '@shared/i18n/en';
import { ru } from '@shared/i18n/ru';

export type Locale = 'en' | 'ru';

export function localeFromPath(path: string): Locale {
  return /^\/ru(?:\/|$)/.test(path) ? 'ru' : 'en';
}

export function localizedPath(path: string, locale: Locale) {
  return locale === 'ru' ? `/ru${path === '/' ? '' : path}` : path;
}

export function unlocalizedPath(path: string) {
  return path.replace(/^\/ru(?=\/|$)/, '') || '/';
}

// Each mounted provider/server render owns its instance; no mutable process-wide language.
export function createTranslations(locale: Locale) {
  const instance = createInstance();

  void instance.init({
    lng: locale,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru'],
    resources: { en: { translation: en }, ru: { translation: ru } },
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  return instance;
}
