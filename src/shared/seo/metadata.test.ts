import { describe, expect, it } from 'vitest';
import { pageMetadata, pageSeo, type PageId } from '@shared/seo/metadata';

const pages: PageId[] = ['home', 'prices', 'terms', 'privacy', 'status', 'api', 'signIn'];

describe('localized page metadata', () => {
  it.each(['en', 'ru'] as const)(
    'provides meaningful titles, descriptions and the shared social cover: %s',
    (locale) => {
      const titles = new Set<string>();
      const descriptions = new Set<string>();

      for (const page of pages) {
        const metadata = pageMetadata(page, locale);
        const title = metadata.flatMap((tag) => ('title' in tag ? [tag.title] : []))[0];
        const description = metadata.flatMap((tag) =>
          'name' in tag && tag.name === 'description' ? [tag.content] : [],
        )[0];
        expect(title).toMatch(/^.+ \| Dropvia$/);
        expect(title?.match(/Dropvia/g)).toHaveLength(1);
        expect(description?.length).toBeGreaterThan(70);
        titles.add(title ?? '');
        descriptions.add(description ?? '');
        const image = metadata.flatMap((tag) =>
          'property' in tag && tag.property === 'og:image' ? [tag.content] : [],
        )[0];
        expect(image).toBe('https://dropvia.fun/images/og/dropvia.png');
        expect(metadata).toContainEqual({
          name: 'twitter:card',
          content: 'summary_large_image',
        });
        expect(metadata).toContainEqual({ name: 'twitter:image', content: image });
        expect(metadata).toContainEqual({ name: 'robots', content: 'noindex, nofollow' });
      }

      expect(titles.size).toBe(pages.length);
      expect(descriptions.size).toBe(pages.length);
    },
  );

  it.each(['en', 'ru'] as const)(
    'describes file nodes and errors without discovery links: %s',
    (locale) => {
      const node = pageSeo('fileServer', locale, 'D02');

      expect(node.title).toMatch(/D02 \| Dropvia$/);
      expect(node.description).toContain('D02');

      for (const page of ['fileServer', 'notFound', 'error'] as const) {
        const seo = pageSeo(page, locale, 'D01');

        expect(seo.title).toMatch(/^.+ \| Dropvia$/);
        expect(seo.description.length).toBeGreaterThan(70);
        expect(seo.tags).toContainEqual({ name: 'robots', content: 'noindex, nofollow' });
        expect(
          seo.tags.some((tag) => 'property' in tag && tag.property === 'og:url'),
        ).toBe(false);
        expect(seo.tags.some((tag) => 'rel' in tag)).toBe(false);
      }
    },
  );
});
