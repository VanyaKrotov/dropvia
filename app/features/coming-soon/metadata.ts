import type { MetaDescriptor } from 'react-router';
import type { Locale } from '../../lib/i18n';
import { content } from './content';

export function pageMetadata(locale: Locale): MetaDescriptor[] {
  const copy = content[locale];
  const canonical = locale === 'en' ? 'https://dropvia.fun/' : 'https://dropvia.fun/ru';

  return [
    { title: copy.title },
    { name: 'description', content: copy.description },
    { name: 'robots', content: 'noindex, nofollow' },
    { tagName: 'link', rel: 'canonical', href: canonical },
    { tagName: 'link', rel: 'alternate', hrefLang: 'en', href: 'https://dropvia.fun/' },
    { tagName: 'link', rel: 'alternate', hrefLang: 'ru', href: 'https://dropvia.fun/ru' },
    {
      tagName: 'link',
      rel: 'alternate',
      hrefLang: 'x-default',
      href: 'https://dropvia.fun/',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: locale === 'en' ? 'en_US' : 'ru_RU' },
    { property: 'og:locale:alternate', content: locale === 'en' ? 'ru_RU' : 'en_US' },
    { property: 'og:site_name', content: 'Dropvia' },
    { property: 'og:title', content: copy.title },
    { property: 'og:description', content: copy.description },
    { property: 'og:url', content: canonical },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: copy.title },
    { name: 'twitter:description', content: copy.description },
  ];
}
