import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('direct fragment URLs hydrate cleanly and keep the fragment when switching language', async ({
  page,
}) => {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto('/api/?source=reference#health');
  await page.getByRole('tab', { name: 'Python' }).click();
  await page.getByRole('link', { name: 'Русский', exact: true }).click();
  await expect(page).toHaveURL('/ru/api/?source=reference#health');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  expect(errors).toEqual([]);
});

test('resource contracts restrict files and validate invitation requests', async ({
  request,
}) => {
  expect((await request.post('/api/v1/upload')).status()).toBe(403);
  expect((await request.post('/api/v1/upload/abc')).status()).toBe(403);
  expect((await request.get('/api/v1/download/abc')).status()).toBe(404);
  expect((await request.get('/api/v1/files/abc')).status()).toBe(404);
  expect((await request.delete('/api/v1/files/abc')).status()).toBe(403);
  expect((await request.post('/api/v1/shares/abc')).status()).toBe(403);
  expect((await request.get('/api/v1/access-requests')).status()).toBe(405);

  for (const path of ['/api/v1/status', '/api/v1/download/abc', '/api/v1/files/abc']) {
    const unsupported = await request.fetch(path, { method: 'OPTIONS' });

    expect(unsupported.status(), path).toBe(405);
    expect(unsupported.headers()['allow']).toContain('GET');
  }

  expect(
    (await request.post('/api/v1/access-requests', { data: { email: 'bad' } })).status(),
  ).toBe(422);
  expect(
    (
      await request.post('/api/v1/access-requests', {
        data: {
          name: 'Alex Morgan',
          email: 'reader@example.com',
          needs: 'Store everyday files',
          consent: true,
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await request.post('/api/v1/access-requests', {
        headers: { Origin: 'https://foreign.example' },
        data: {
          name: 'Alex Morgan',
          email: 'reader@example.com',
          needs: 'Store everyday files',
          consent: true,
        },
      })
    ).status(),
  ).toBe(403);
  const status = await request.get('/api/v1/status');

  expect(status.status()).toBe(200);
  expect(await status.json()).toMatchObject({
    services: expect.any(Array),
    checkedAt: expect.any(String),
  });
});

test('all public pages contain translated content in server HTML', async ({
  request,
}) => {
  for (const [path, title] of [
    ['/', 'Your files'],
    ['/prices', 'Plans'],
    ['/terms', 'Terms'],
    ['/privacy', 'Privacy'],
    ['/status', 'Service status'],
    ['/api/', 'API reference'],
    ['/ru', 'Ваши файлы'],
    ['/ru/prices', 'Тарифы'],
    ['/ru/privacy', 'Конфиденциальность'],
    ['/ru/status', 'Статус сервисов'],
  ] as const) {
    const response = await request.get(path);

    expect(response.status(), path).toBe(200);
    const html = await response.text();

    expect(html, path).toContain(title);
    expect(html).toContain('rel="canonical"');
    expect(html).toContain(path.startsWith('/ru') ? 'lang="ru"' : 'lang="en"');
  }
});

test('invitation form shows pending and successful acknowledgement', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Request access', exact: true }).first().click();
  await expect(page).toHaveURL(/#request-access$/);
  await page.getByLabel('Name', { exact: true }).fill('Alex Morgan');
  await page
    .getByLabel('What would you use Dropvia for?', { exact: true })
    .fill('Keep project files.');
  await page.getByLabel('Email address', { exact: true }).fill('reader@example.com');
  await page.getByLabel(/agree to/).check();
  await page.getByRole('button', { name: 'Request access' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Your request is in' }),
  ).toBeVisible();

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.locator('#request-access').screenshot({
      path: testInfo.outputPath(`success-${colorScheme}.png`),
      animations: 'disabled',
      scale: 'css',
      style: '.site-header { visibility: hidden; }',
    });
  }
});

test('language links preserve the page and API examples switch formats', async ({
  page,
}) => {
  await page.goto('/api/');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('fetch(');
  await page.getByRole('link', { name: 'Русский', exact: true }).first().click();
  await expect(page).toHaveURL('/ru/api/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('API');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('status refreshes on demand and reports polling failures without losing data', async ({
  page,
}) => {
  await page.goto('/status');
  await expect(page.getByText('File server D01', { exact: true })).toBeVisible();
  await page.route('**/api/v1/status', (route) =>
    route.fulfill({ status: 503, body: '{}' }),
  );
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to refresh');
  await expect(page.getByText('File server D01', { exact: true })).toBeVisible();
});

test('status uses its SSR snapshot then polls and stops after leaving the page', async ({
  page,
}) => {
  let requests = 0;

  page.on('request', (request) => {
    if (request.url().endsWith('/api/v1/status')) {
      requests++;
    }
  });
  await page.clock.install();
  await page.goto('/status');
  await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeVisible();
  expect(requests).toBe(0);
  await page.clock.fastForward(31_000);
  await expect.poll(() => requests).toBe(1);
  await page.getByRole('link', { name: 'Dropvia · Home' }).click();
  await expect(page).toHaveURL('/');
  await page.clock.fastForward(31_000);
  expect(requests).toBe(1);
});

test('failed invitation submissions preserve the input and let the user retry', async ({
  page,
}) => {
  await page.goto('/ru');
  await page.route('**/api/v1/access-requests', (route) =>
    route.fulfill({ status: 503, body: '{}' }),
  );
  await page.getByLabel('Электронная почта', { exact: true }).fill('reader@example.com');
  await page.getByLabel('Имя', { exact: true }).fill('Алексей');
  await page
    .getByLabel('Для каких потребностей', { exact: true })
    .fill('Хранить файлы проектов.');
  await page.getByLabel(/Я принимаю/).check();
  await page.getByRole('button', { name: 'Оставить заявку' }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось отправить');
  await expect(page.getByLabel('Электронная почта', { exact: true })).toHaveValue(
    'reader@example.com',
  );
  await page.unroute('**/api/v1/access-requests');
  await page.getByRole('button', { name: 'Оставить заявку' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Заявка принята.' }),
  ).toContainText('Заявка принята.');
});

test('leaving the status page cancels an in-flight refresh', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route('**/api/v1/status', async (route) => {
    await gate;
    await route.fulfill({ status: 503, body: '{}' });
  });
  await page.goto('/status');
  const started = page.waitForRequest((request) =>
    request.url().endsWith('/api/v1/status'),
  );

  try {
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    const request = await started;

    await expect(page.locator('.status-summary button')).toBeDisabled();
    await expect(page.locator('.status-summary button')).toHaveText('Refresh');

    const failed = page.waitForEvent(
      'requestfailed',
      (candidate) => candidate === request,
    );

    await page.getByRole('link', { name: 'Dropvia · Home' }).click();
    expect((await failed).failure()?.errorText).toContain('ERR_ABORTED');
    await expect(page).toHaveURL('/');
  } finally {
    // The browser has already aborted this intercepted request. Remove its
    // handler before releasing the artificial response to avoid a teardown race.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    release();
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`public screens work in ${theme} theme without overflow or accessibility violations`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });

    for (const path of [
      '/',
      '/prices',
      '/status',
      '/api/',
      '/terms',
      '/privacy',
      '/ru',
      '/ru/prices',
      '/ru/status',
      '/ru/api/',
      '/ru/terms',
      '/ru/privacy',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        path,
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations, `${theme} ${path}`).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`${theme}-${path.replaceAll('/', '') || 'home'}.png`),
        fullPage: true,
        scale: 'css',
      });
      await page.screenshot({
        path: testInfo.outputPath(
          `${theme}-${path.replaceAll('/', '') || 'home'}-viewport.png`,
        ),
        scale: 'css',
      });

      if (path === '/' || path === '/ru') {
        await page.locator('#request-access').scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath(`${theme}-${path === '/' ? 'en' : 'ru'}-form.png`),
          scale: 'css',
        });
      }
    }

    expect(errors).toEqual([]);
  });
}
