import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

function expectStableOrExpired(previous: string, next: string) {
  if (next !== previous) {
    expect(Date.parse(next) - Date.parse(previous)).toBeGreaterThanOrEqual(60_000);
  }
}

test('file servers have public unlisted SSR pages and share a stable status snapshot', async ({
  request,
}) => {
  const first = await (await request.get('/api/v1/status')).json();

  for (const prefix of ['', '/ru']) {
    for (const id of ['D01', 'D02']) {
      const response = await request.get(`${prefix}/_data/${id}`);

      expect(response.status()).toBe(200);
      expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
      const html = await response.text();

      expect(html).toContain(prefix ? 'Файловый сервер Dropvia' : 'Dropvia file server');
      expect(html).toContain(id);
      const timestamp = html.match(/<time[^>]+datetime="([^"]+)"/i)?.[1];

      expect(timestamp).toBeDefined();
      expectStableOrExpired(first.checkedAt, timestamp!);
      expect(html).toContain('noindex, nofollow');
    }

    for (const path of ['/', '/prices', '/api/', '/status']) {
      const html = await (await request.get(`${prefix}${path}`)).text();

      expect(html).not.toMatch(/href="[^"]*\/_data\//);
    }
  }

  const last = await (await request.get('/api/v1/status')).json();

  expectStableOrExpired(first.checkedAt, last.checkedAt);

  if (last.checkedAt === first.checkedAt) {
    expect(last).toEqual(first);
  }

  expect((await request.get('/_data/D99')).status()).toBe(404);
  expect((await request.get('/_data/invalid')).status()).toBe(404);
  expect((await request.get('/fr/_data/D01')).status()).toBe(404);
});

test('technical node page works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/ru/_data/D01');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Файловый сервер Dropvia',
  );
  await expect(
    page.getByRole('link', { name: 'Основной сервис', exact: true }),
  ).toHaveAttribute('href', '/ru');
  await expect(page.locator('.file-server-brand .wordmark')).toHaveAttribute(
    'href',
    (await page
      .getByRole('link', { name: 'Основной сервис', exact: true })
      .getAttribute('href')) ?? '',
  );
  await expect(page.getByTestId('file-server-health')).toBeVisible();
  await expect(page.locator('.site-footer')).toBeVisible();
  await expect(page.locator('.site-footer a[href="/ru/privacy"]')).toHaveCount(1);
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL('/_data/D01');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.file-server-brand .wordmark')).toHaveAttribute(
    'href',
    (await page
      .getByRole('link', { name: 'Main service', exact: true })
      .getAttribute('href')) ?? '',
  );
  await context.close();
});

test('node language switch preserves the server, query and fragment', async ({
  page,
}) => {
  await page.goto('/_data/D02?source=technical#node-heading');
  await page.getByRole('link', { name: 'Русский', exact: true }).click();
  await expect(page).toHaveURL('/ru/_data/D02?source=technical#node-heading');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('.file-server-code')).toHaveText('D02');
  await expect(page.locator('.site-footer a[href="/ru/api/"]')).toHaveCount(1);
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL('/_data/D02?source=technical#node-heading');
  await expect(page.locator('.site-footer a[href="/api/"]')).toHaveCount(1);
});

test('node page renders in both themes, refreshes and retains its last status on error', async ({
  page,
}) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();

  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto('/ru/_data/D01');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Файловый сервер Dropvia',
    );
    const before = await page.getByTestId('file-server-health').textContent();
    const previous = await page.locator('time').getAttribute('datetime');

    await page.reload();
    const next = await page.locator('time').getAttribute('datetime');

    expectStableOrExpired(previous!, next!);

    if (previous === next) {
      await expect(page.getByTestId('file-server-health')).toHaveText(before!);
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath(`${theme}-node.png`),
      fullPage: true,
    });
  }

  expect(errors).toEqual([]);
  const snapshot = await (await page.request.get('/api/v1/status')).json();

  await page.route('**/api/v1/status', (route) =>
    route.fulfill({
      json: {
        ...snapshot,
        services: snapshot.services.map((service: { id: string }) =>
          service.id === 'download-01'
            ? { ...service, state: 'degraded', latencyMs: 450 }
            : service,
        ),
      },
    }),
  );
  await page.clock.fastForward(31_000);
  await expect(page.getByTestId('file-server-health')).toContainText(
    'Работает с задержками',
  );
  await expect(page.getByTestId('file-server-health')).toContainText('450 ms');
  await page.screenshot({
    path: test.info().outputPath('degraded-node.png'),
    fullPage: true,
  });
  await page.unroute('**/api/v1/status');
  await page.route('**/api/v1/status', (route) =>
    route.fulfill({ status: 503, body: '{}' }),
  );
  await page.clock.fastForward(31_000);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('file-server-health')).toContainText('450 ms');
});
