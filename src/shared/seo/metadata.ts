import { createTranslations, localizedPath, type Locale } from '@shared/i18n/config';
import socialImage from '@shared/seo/social-images.json';

export type PageId =
  'home' | 'prices' | 'terms' | 'privacy' | 'status' | 'api' | 'signIn';

export const pagePaths: Record<PageId, string> = {
  home: '/',
  prices: '/prices',
  terms: '/terms',
  privacy: '/privacy',
  status: '/status',
  api: '/api/',
  signIn: '/sign-in',
};

type SeoPage = PageId | 'fileServer' | 'notFound' | 'error';
type MetaTag = { name: string; content: string } | { property: string; content: string };

export function pageSeo(page: SeoPage, locale: Locale, code = '') {
  const t = createTranslations(locale).t;
  const title = `${t(`meta.${page}.title`, { code }).trim()} | Dropvia`;
  const description = t(`meta.${page}.description`, { code });
  const imageUrl = `https://dropvia.fun${socialImage.path}`;
  const imageAlt = t('meta.imageAlt');
  const tags: MetaTag[] = [
    { name: 'description', content: description },
    { name: 'robots', content: 'noindex, nofollow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Dropvia' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:locale', content: locale === 'ru' ? 'ru_RU' : 'en_US' },
    { property: 'og:locale:alternate', content: locale === 'ru' ? 'en_US' : 'ru_RU' },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:secure_url', content: imageUrl },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: String(socialImage.width) },
    { property: 'og:image:height', content: String(socialImage.height) },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: imageAlt },
  ];

  return { title, description, tags };
}

export function pageMetadata(page: PageId, locale: Locale) {
  const seo = pageSeo(page, locale);
  const url = `https://dropvia.fun${localizedPath(pagePaths[page], locale)}`;

  return [
    { title: seo.title },
    ...seo.tags,
    { tagName: 'link', rel: 'canonical', href: url },
    ...(['en', 'ru', 'x-default'] as const).map((lang) => ({
      tagName: 'link',
      rel: 'alternate',
      hrefLang: lang,
      href: `https://dropvia.fun${localizedPath(pagePaths[page], lang === 'ru' ? 'ru' : 'en')}`,
    })),
    { property: 'og:url', content: url },
  ];
}
