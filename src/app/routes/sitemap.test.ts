import { describe, expect, it } from 'vitest';
import { loader as sitemapLoader } from '@app/routes/sitemap';
import { loader as robotsLoader } from '@app/routes/robots';

describe('public sitemap', () => {
  it('serves valid XML with every public page in both languages except status', async () => {
    const response = sitemapLoader();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');

    expect(xml.querySelector('parsererror')).toBeNull();
    expect(xml.documentElement.localName).toBe('urlset');
    expect(xml.documentElement.namespaceURI).toBe(
      'http://www.sitemaps.org/schemas/sitemap/0.9',
    );
    const urls = Array.from(
      xml.querySelectorAll('url > loc'),
      (node) => node.textContent,
    );

    expect(urls.sort()).toEqual(
      [
        'https://dropvia.fun/',
        'https://dropvia.fun/api/',
        'https://dropvia.fun/prices',
        'https://dropvia.fun/privacy',
        'https://dropvia.fun/ru',
        'https://dropvia.fun/ru/api/',
        'https://dropvia.fun/ru/prices',
        'https://dropvia.fun/ru/privacy',
        'https://dropvia.fun/ru/sign-in',
        'https://dropvia.fun/ru/terms',
        'https://dropvia.fun/sign-in',
        'https://dropvia.fun/terms',
      ].sort(),
    );
    expect(xml.querySelectorAll('lastmod, priority, changefreq')).toHaveLength(0);
  });

  it('advertises the production sitemap without blocking access to noindex metadata', async () => {
    const response = robotsLoader();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain('Allow: /');
    expect(text).toContain('Sitemap: https://dropvia.fun/sitemap.xml');
  });
});
