import { expect, test } from '@playwright/test';

test('English is the default and both languages have real navigable URLs', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', { name: 'Preparing the first version' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Русский', exact: true }).click();
  await expect(page).toHaveURL('/ru');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(
    page.getByRole('heading', { name: 'Готовим первую версию' }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('russian.png'), fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL('/');
});

test('Russian is server-rendered with its own canonical and language alternates', async ({
  request,
}) => {
  const response = await request.get('/ru');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('Загрузка, передача и скачивание файлов.');
  expect(html).toContain('lang="ru"');
  expect(html).toMatch(/rel="canonical"[^>]+href="https:\/\/dropvia.fun\/ru"/);
  expect(html).toMatch(/hrefLang="en"|hreflang="en"/);
  expect(html).toMatch(/hrefLang="ru"|hreflang="ru"/);
});
