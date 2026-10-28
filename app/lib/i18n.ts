export type Locale = 'en' | 'ru';

export function localeFromPath(pathname: string): Locale {
  return pathname === '/ru' || pathname.startsWith('/ru/') ? 'ru' : 'en';
}
