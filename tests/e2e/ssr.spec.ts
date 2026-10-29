import { expect, test } from '@playwright/test';

test('HTTP response contains real content and metadata before any client JavaScript', async ({
  request,
}) => {
  const response = await request.get('/');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/html');
  const html = await response.text();

  expect(html).toContain('Your files.');
  expect(html).toContain('Request access');
  expect(html).toContain('<title>File storage and sharing | Dropvia</title>');
  expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="https:\/\/dropvia.fun\/"/);
  expect(html).toMatch(/<meta[^>]+name="description"[^>]+content="Store and share/);
  expect(html).toMatch(/<meta[^>]+property="og:title"/);
  expect(html).toMatch(/<meta[^>]+name="twitter:card"[^>]+content="summary_large_image"/);
  expect(html).toMatch(/<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/);
});

test('page and disclosure work with JavaScript disabled', async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error('Playwright baseURL must point to the production test server');
  }

  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();

  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your files.');
    const image = page.locator('.file-scene img:visible').first();

    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect(image).toHaveCSS('opacity', '1');
    await page.getByText('Can I upload files right now?', { exact: true }).click();
    await expect(page.getByText(/File operations require approved access/)).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await page.getByRole('link', { name: 'Русский', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page
      .getByLabel('Электронная почта', { exact: true })
      .fill('reader@example.com');
    await page.getByLabel('Имя', { exact: true }).fill('Алексей');
    await page
      .getByLabel('Для каких потребностей', { exact: true })
      .fill('Хранить файлы проектов.');
    await page.getByLabel(/Я принимаю/).check();
    const responsePromise = page.waitForResponse(
      (response) => response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: 'Оставить заявку' }).click();
    expect((await responsePromise).status()).toBe(201);
    await expect(
      page.getByRole('status').filter({ hasText: 'Заявка принята.' }),
    ).toContainText('Заявка принята.');
  } finally {
    await context.close();
  }
});

test('unknown URLs return 404 without a homepage canonical', async ({ request }) => {
  const response = await request.get('/this-page-does-not-exist');

  expect(response.status()).toBe(404);
  const html = await response.text();

  expect(html).toContain('Page not found');
  expect(html).toContain('<title>Page not found | Dropvia</title>');
  expect(html).not.toContain('rel="canonical"');
  expect(html).not.toContain('node_modules');
});

test('Russian errors retain the URL language and a populated title', async ({
  request,
}) => {
  const response = await request.get('/ru/missing');

  expect(response.status()).toBe(404);
  const html = await response.text();

  expect(html).toContain('lang="ru"');
  expect(html).toContain('<title>Страница не найдена | Dropvia</title>');
  expect(html).toContain('href="/ru"');
  expect(html).not.toContain('Page not found');
});

test('robots advertises a sitemap of canonical public pages excluding status and file nodes', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');

  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toContain('Allow: /');
  expect(await robots.text()).toContain('Sitemap: https://dropvia.fun/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');

  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const xml = await sitemap.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);

  expect(urls).toHaveLength(12);
  expect(new Set(urls).size).toBe(12);
  expect(xml).not.toContain('/status');
  expect(xml).not.toContain('/_data');
  expect(xml).not.toContain('/api/v1');

  for (const url of urls) {
    if (!url) {
      throw new Error('A sitemap entry must contain an absolute URL');
    }

    expect(new URL(url).origin).toBe('https://dropvia.fun');
    const response = await request.get(new URL(url).pathname, { maxRedirects: 0 });

    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1]).toBe(url);
    expect(html).toContain('content="noindex, nofollow"');
  }
});
