import { createTranslations, localizedPath, type Locale } from '@shared/i18n/config';

export type PageId =
  'home' | 'prices' | 'terms' | 'privacy' | 'status' | 'api' | 'signIn';

const paths: Record<PageId, string> = {
  home: '/',
  prices: '/prices',
  terms: '/terms',
  privacy: '/privacy',
  status: '/status',
  api: '/api/',
  signIn: '/sign-in',
};

export function pageMetadata(page: PageId, locale: Locale) {
  const t = createTranslations(locale).t;
  const title = t(`meta.${page}.title`);
  const description = t(`meta.${page}.description`);
  const url = `https://dropvia.fun${localizedPath(paths[page], locale)}`;

  return [
    { title },
    { name: 'description', content: description },
    { name: 'robots', content: 'noindex, nofollow' },
    { tagName: 'link', rel: 'canonical', href: url },
    ...(['en', 'ru', 'x-default'] as const).map((lang) => ({
      tagName: 'link',
      rel: 'alternate',
      hrefLang: lang,
      href: `https://dropvia.fun${localizedPath(paths[page], lang === 'ru' ? 'ru' : 'en')}`,
    })),
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Dropvia' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:locale', content: locale === 'ru' ? 'ru_RU' : 'en_US' },
    { property: 'og:locale:alternate', content: locale === 'ru' ? 'en_US' : 'ru_RU' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
}
