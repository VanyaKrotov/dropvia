import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('acknowledgement animates out and persists across reloads, locales and standalone pages', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/ru');
  const notice = page.getByRole('complementary', { name: 'Cookie', exact: true });
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCSS('animation-name', 'cookie-notice-in');
  expect(
    (await context.cookies()).find((cookie) => cookie.name === 'dropvia_cookie_notice'),
  ).toBeUndefined();
  await expect(notice.getByRole('link')).toHaveAttribute('href', '/ru/privacy');
  await notice.getByRole('button', { name: 'Хорошо', exact: true }).click();
  await expect(notice).toHaveCount(0);
  const cookie = (await context.cookies()).find(
    (item) => item.name === 'dropvia_cookie_notice',
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Lax');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page.locator('.cookie-notice')).toHaveCount(0);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.cookie-notice')).toHaveCount(0);
  await page.reload();
  await expect(notice).toHaveCount(0);
  for (const path of ['/prices', '/ru/sign-in', '/_data/D01']) {
    await page.goto(path);
    await expect(page.locator('.cookie-notice')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('a failed acknowledgement keeps the notice visible and allows retry', async ({
  page,
}) => {
  await page.goto('/');
  await page.route('**/cookie-notice*', (route) =>
    route.continue({ postData: 'acknowledge=no&returnTo=%2F' }),
  );
  const notice = page.getByRole('complementary', { name: 'Cookies', exact: true });
  const button = notice.getByRole('button', { name: 'OK', exact: true });
  await button.click();
  await expect(notice.getByRole('status')).toContainText('Could not save your choice');
  await expect(button).toBeEnabled();
  await page.unroute('**/cookie-notice*');
  await button.click();
  await expect(notice).toHaveCount(0);
});

test('acknowledgement finishing after a client navigation closes the new page notice', async ({
  page,
}) => {
  await page.goto('/');
  await page.route('**/cookie-notice', async (route) => {
    await page.waitForURL('**/sign-in');
    await route.continue();
  });
  const request = page.waitForRequest('**/cookie-notice');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await request;
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/sign-in');
  await expect(page.locator('.cookie-notice')).toHaveCount(0);
});

for (const failure of ['network', 'proxy'] as const) {
  test(`${failure} failures stay inside the notice and allow retry`, async ({ page }) => {
    await page.goto('/');
    await page.route('**/cookie-notice*', (route) =>
      failure === 'network'
        ? route.abort('failed')
        : route.fulfill({
            status: 502,
            contentType: 'text/html',
            body: '<html>Bad gateway</html>',
          }),
    );
    const notice = page.getByRole('complementary', { name: 'Cookies', exact: true });
    await notice.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(notice.getByRole('status')).toContainText('Could not save your choice');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your files.');
    await page.unroute('**/cookie-notice*');
    await notice.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(notice).toHaveCount(0);
  });
}

test('the notice and its confirmation work without JavaScript', async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error('Playwright baseURL must be configured.');
  }
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/ru/prices');
    const notice = page.getByRole('complementary', { name: 'Cookie', exact: true });
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Хорошо', exact: true }).click();
    await expect(page).toHaveURL('/ru/prices');
    await expect(notice).toHaveCount(0);
    await page.reload();
    await expect(notice).toHaveCount(0);
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

test('server HTML excludes an acknowledged notice before hydration', async ({
  request,
}) => {
  const first = await request.get('/');
  expect(first.headers()['cache-control']).toContain('no-store');
  expect(first.headers()['vary']?.toLowerCase()).toContain('cookie');
  expect(await first.text()).toContain('cookie-notice panel');
  const russian = await request.get('/ru');
  expect(russian.headers()['cache-control']).toContain('no-store');
  expect(russian.headers()['vary']?.toLowerCase()).toContain('cookie');
  const response = await request.post('/cookie-notice', {
    form: { acknowledge: 'yes', returnTo: '/' },
  });
  expect(response.status()).toBe(200);
  const second = await request.get('/');
  expect(second.headers()['cache-control']).toContain('no-store');
  expect(second.headers()['vary']?.toLowerCase()).toContain('cookie');
  expect(await second.text()).not.toContain('cookie-notice panel');
  const method = await request.get('/cookie-notice');
  expect(method.status()).toBe(405);
  expect(method.headers()['allow']).toBe('POST');
});
