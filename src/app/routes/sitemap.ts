import { localizedPath } from '@shared/i18n/config';
import { pagePaths } from '@shared/seo/metadata';

export function loader() {
  const entries = Object.entries(pagePaths)
    .filter(([page]) => page !== 'status')
    .flatMap(([, path]) =>
      (['en', 'ru'] as const).map(
        (locale) =>
          `  <url><loc>https://dropvia.fun${localizedPath(path, locale)}</loc></url>`,
      ),
    );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
