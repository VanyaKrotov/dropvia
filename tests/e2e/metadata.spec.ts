import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

for (const locale of ['en', 'ru'] as const) {
  test(`SSR metadata and shared social image are complete without JavaScript: ${locale}`, async ({
    page,
    request,
  }) => {
    const prefix = locale === 'ru' ? '/ru' : '';
    const paths = ['/', '/prices', '/terms', '/privacy', '/status', '/api/', '/sign-in'];
    const checkedImages = new Set<string>();
    const routes = [
      ...paths.map((path) => ({
        path: prefix + (path === '/' ? '' : path) || '/',
        status: 200,
        canonical: true,
      })),
      { path: `${prefix}/_data/D01`, status: 200, canonical: false },
      { path: `${prefix}/_data/D02`, status: 200, canonical: false },
      { path: `${prefix}/missing-page`, status: 404, canonical: false },
      { path: `${prefix}/_data/unknown`, status: 404, canonical: false },
    ];

    for (const route of routes) {
      await test.step(route.path, async () => {
        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

        expect(response?.status()).toBe(route.status);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('head title')).toHaveCount(1);
        const title = await page.title();

        expect(title).toMatch(/^.+ \| Dropvia$/);
        expect(title.match(/Dropvia/g)).toHaveLength(1);
        await expect(page.locator('meta[name="description"]')).toHaveCount(1);
        const description = await page
          .locator('meta[name="description"]')
          .getAttribute('content');

        expect(description?.length).toBeGreaterThan(70);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          'content',
          title,
        );
        await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
          'content',
          title,
        );
        await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
          'content',
          description ?? '',
        );
        await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
          'content',
          description ?? '',
        );
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          'noindex, nofollow',
        );
        await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
          'content',
          'summary_large_image',
        );
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(
          route.canonical ? 1 : 0,
        );
        await expect(page.locator('link[hreflang]')).toHaveCount(route.canonical ? 3 : 0);
        const image = await page
          .locator('meta[property="og:image"]')
          .getAttribute('content');

        expect(image).toMatch(/^https:\/\/dropvia\.fun\/images\/og\/dropvia\.png$/);
        await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
          'content',
          image ?? '',
        );
        await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute(
          'content',
          'image/png',
        );
        const alt = await page
          .locator('meta[property="og:image:alt"]')
          .getAttribute('content');

        expect(alt).toContain('Dropvia');
        await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
          'content',
          alt ?? '',
        );

        if (!image || checkedImages.has(image)) {
          return;
        }

        const asset = await request.get(new URL(image).pathname);

        expect(asset.status()).toBe(200);
        expect(asset.headers()['content-type']).toContain('image/png');
        const bytes = await asset.body();

        expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
          'content',
          String(bytes.readUInt32BE(16)),
        );
        await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
          'content',
          String(bytes.readUInt32BE(20)),
        );
        checkedImages.add(image);
        await asset.dispose();
      });
    }
  });
}

test('invalid language does not retain the matched page metadata', async ({ page }) => {
  const response = await page.goto('/fr/prices');

  expect(response?.status()).toBe(404);
  await expect(page.locator('head title')).toHaveCount(1);
  await expect(page).toHaveTitle('Page not found | Dropvia');
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://dropvia.fun/images/og/dropvia.png',
  );
});
