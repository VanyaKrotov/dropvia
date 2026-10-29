import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('acknowledgement animates out and persists across reloads, locales and standalone pages without requests', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const posts: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.method() === 'POST') {
      posts.push(request.url());
    }
  });
  await page.goto('/ru');
  const notice = page.getByRole('complementary', { name: 'Cookie', exact: true });
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCSS('animation-name', 'cookie-notice-in');
  await expect(notice.getByRole('link')).toHaveAttribute('href', '/ru/privacy');
  await notice.getByRole('button', { name: 'Хорошо', exact: true }).click();
  await expect(notice).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem('dropvia:cookie-notice:v1')),
  ).toBe('acknowledged');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.locator('.cookie-notice')).toHaveCount(0);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.cookie-notice')).toHaveCount(0);
  await page.reload();
  for (const path of ['/prices', '/ru/sign-in', '/_data/D01']) {
    await page.goto(path);
    await expect(page.locator('.cookie-notice')).toHaveCount(0);
  }
  expect(await context.cookies()).toEqual([]);
  expect(posts).toEqual([]);
  expect(errors).toEqual([]);
});

test('acknowledgement and clearing storage update another open tab', async ({
  page,
  context,
}) => {
  await page.goto('/');
  const otherPage = await context.newPage();
  await otherPage.goto('/ru/sign-in');
  await expect(otherPage.locator('.cookie-notice')).toBeVisible();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(otherPage.locator('.cookie-notice')).toHaveCount(0);
  await page.evaluate(() => localStorage.clear());
  await expect(otherPage.locator('.cookie-notice')).toBeVisible();
  await page.reload();
  await expect(page.locator('.cookie-notice')).toBeVisible();
});

for (const operation of ['getItem', 'setItem'] as const) {
  test(`blocked storage ${operation} keeps the page usable without requests`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const posts: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.method() === 'POST') {
        posts.push(request.url());
      }
    });
    await page.addInitScript((method) => {
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        value() {
          throw new DOMException('Browser storage is blocked', 'SecurityError');
        },
      });
    }, operation);
    await page.goto('/');
    const notice = page.getByRole('complementary', { name: 'Cookies', exact: true });
    await expect(notice).toBeVisible();
    if (operation === 'setItem') {
      await notice.getByRole('button', { name: 'OK', exact: true }).click();
      await expect(notice.getByRole('status')).toContainText('browser storage');
      await expect(notice.getByRole('button')).toBeEnabled();
    }
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your files.');
    expect(posts).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('an unrecognized stored value does not dismiss the notice', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dropvia:cookie-notice:v1', 'no'));
  await page.goto('/');
  await expect(page.locator('.cookie-notice')).toBeVisible();
});

test('server HTML and pages without JavaScript do not render a browser-only notice', async ({
  browser,
  baseURL,
  request,
}) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(response.headers()['set-cookie']).toBeUndefined();
  expect(await response.text()).not.toContain('cookie-notice panel');
  if (!baseURL) {
    throw new Error('Playwright baseURL must be configured.');
  }
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/ru/prices');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.cookie-notice')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('the notice follows both themes, fits the viewport and respects reduced motion', async ({
  page,
}, testInfo) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/ru/sign-in');
    const notice = page.getByRole('complementary', { name: 'Cookie', exact: true });
    await expect(notice).toBeVisible();
    await expect(notice).toHaveCSS('opacity', '1');
    const box = await notice.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(
      (await new AxeBuilder({ page }).include('.cookie-notice').analyze()).violations,
    ).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`cookie-${colorScheme}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await expect(page.locator('.cookie-notice')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Хорошо', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cookie-notice')).toHaveCount(0);
});
