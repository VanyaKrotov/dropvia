import { expect, test } from '@playwright/test';

test('landing follows the researched section hierarchy in SSR HTML', async ({
  request,
}) => {
  const html = await (await request.get('/')).text();
  const sections = [
    'product',
    'integration',
    'experience',
    'platform',
    'everyday',
    'service-overview',
    'landing-plans',
    'landing-faq',
    'request-access',
  ];
  let previous = -1;

  for (const id of sections) {
    const index = html.indexOf(`id="${id}"`);

    expect(index, id).toBeGreaterThan(previous);
    previous = index;
  }

  expect(html).not.toContain('99.99%');
});

test('file story tabs support keyboard selection without performing file operations', async ({
  page,
}) => {
  const fileRequests: string[] = [];

  page.on('request', (request) => {
    if (/\/api\/v1\/(upload|download|shares)/.test(request.url())) {
      fileRequests.push(request.url());
    }
  });
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: 'Explore the file experience' });
  const keep = tabs.getByRole('tab', { name: /A place to keep it/ });

  await keep.focus();
  await page.keyboard.press('ArrowDown');
  const share = tabs.getByRole('tab', { name: /A way to pass it on/ });

  await expect(share).toBeFocused();
  await expect(share).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#experience-preview')).toHaveAttribute(
    'data-active',
    'share',
  );
  await expect(page.locator('.experience-scene[data-scene="share"]')).toBeVisible();
  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: /Ready when you return/ })).toBeFocused();
  await expect(page.locator('.experience-scene[data-scene="retrieve"]')).toBeVisible();
  expect(fileRequests).toEqual([]);
});

test('supporting visuals reveal on scroll and stay visible with reduced motion', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const visual = page.locator('#platform [data-reveal]').first();

  await visual.scrollIntoViewIfNeeded();
  await expect(visual).toHaveAttribute('data-revealed', 'true');
  await expect(visual).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const node of await page.locator('[data-reveal]').all()) {
    await expect(node).toHaveCSS('opacity', '1');
  }

  await expect(page.locator('.file-scene')).toBeVisible();
  const detail = page.locator('.browser-detail img');

  await detail.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      detail.evaluate(
        (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page
    .locator('#experience')
    .screenshot({ path: testInfo.outputPath('experience.png'), scale: 'css' });
  await page
    .locator('#platform')
    .screenshot({ path: testInfo.outputPath('platform.png'), scale: 'css' });
  const help = page.locator('#service-overview');

  await expect(help.locator('a[href="/status"]')).toBeVisible();
  await expect(help.locator('a[href="mailto:support@dropvia.fun"]')).toBeVisible();

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await help.screenshot({
      path: testInfo.outputPath(`status-support-${colorScheme}.png`),
      scale: 'css',
    });
  }
});
