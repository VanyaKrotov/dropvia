import { expect, test } from '@playwright/test';

test('HTTP response contains real content and metadata before any client JavaScript', async ({
  request,
}) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/html');
  const html = await response.text();
  expect(html).toContain('Upload, share and download files.');
  expect(html).toContain('Preparing the first version');
  expect(html).toMatch(/<title>Dropvia[^<]+<\/title>/);
  expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="https:\/\/dropvia.fun\/"/);
  expect(html).toMatch(/<meta[^>]+name="description"[^>]+content="Dropvia/);
  expect(html).toMatch(/<meta[^>]+property="og:title"/);
  expect(html).toMatch(/<meta[^>]+name="twitter:card"[^>]+content="summary"/);
  expect(html).toMatch(/<meta[^>]+name="robots"[^>]+content="noindex, nofollow"/);
});

test('page and disclosure work with JavaScript disabled', async ({
  browser,
  baseURL,
}) => {
  if (!baseURL)
    throw new Error('Playwright baseURL must point to the production test server');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Dropvia' })).toBeVisible();
    await page.getByText('When can I start using it?').click();
    await expect(page.getByText(/A launch date has not been announced/)).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await page.getByRole('link', { name: 'Русский', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(
      page.getByRole('heading', { name: 'Готовим первую версию' }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test('unknown URLs return 404 without a homepage canonical', async ({ request }) => {
  const response = await request.get('/this-page-does-not-exist');
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toContain('Page not found');
  expect(html).toContain('<title>Page not found — Dropvia</title>');
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
  expect(html).toContain('<title>Страница не найдена — Dropvia</title>');
  expect(html).toContain('href="/ru"');
  expect(html).not.toContain('Page not found');
});

test('robots allows reading noindex and does not advertise an empty sitemap', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toContain('Allow: /');
  expect(await robots.text()).not.toContain('Sitemap:');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(204);
  expect(await sitemap.text()).toBe('');
});
