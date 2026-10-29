import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Safari window and iPhone browser share a baseline', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/');
  const phone = page.locator('.iphone-preview');

  await expect(phone).toBeVisible();
  await expect(phone.locator('.mobile-safari-address')).toContainText('dropvia.fun');
  const phoneBox = await phone.boundingBox();

  if (!phoneBox) {
    throw new Error('iPhone preview must have bounds');
  }

  expect(phoneBox.height / phoneBox.width).toBeCloseTo(844 / 390, 2);

  if ((page.viewportSize()?.width ?? 0) >= 768) {
    const desktop = page.locator('.desktop-preview');

    await expect(desktop).toBeVisible();
    await expect(desktop.locator('.safari-address')).toContainText('dropvia.fun');
    const desktopBox = await desktop.boundingBox();

    if (!desktopBox) {
      throw new Error('Safari preview must have bounds');
    }

    expect(
      Math.abs(desktopBox.y + desktopBox.height - phoneBox.y - phoneBox.height),
    ).toBeLessThan(1);
    const overlap = desktopBox.x + desktopBox.width - phoneBox.x;

    expect(overlap / phoneBox.width).toBeCloseTo(0.15, 2);
  }

  await page.locator('.file-scene').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath('safari-and-iphone.png'),
    scale: 'css',
  });
});

test('dashboard screenshots reveal after loading and also animate from browser cache', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let releaseImages = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseImages = resolve;
  });

  await page.route('**/images/dashboard/*.webp', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const frame = page.locator('[data-preview-frame]:visible').first();

  releaseImages();
  await expect
    .poll(() => frame.evaluate((element) => element.getAnimations().length))
    .toBeGreaterThan(0);
  await expect(frame).toHaveCSS('opacity', '1');
  await page.unroute('**/images/dashboard/*.webp');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect
    .poll(() => frame.evaluate((element) => element.getAnimations().length))
    .toBeGreaterThan(0);
  await expect(frame).toHaveCSS('opacity', '1');
});

test('generated dashboard images match language, theme and viewport without repeated access badges', async ({
  page,
}, testInfo) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/ru');
    const image = page.locator('.file-scene img:visible').first();

    await expect(image).toBeVisible();
    const device = (page.viewportSize()?.width ?? 0) < 768 ? 'mobile' : 'desktop';

    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement, prefix: string) => ({
            loaded: element.complete && element.naturalWidth > 0,
            source: element.currentSrc.includes(prefix),
          }),
          `${device}-${colorScheme}-ru-`,
        ),
      )
      .toEqual({ loaded: true, source: true });
    await expect(page.getByText('Доступ по приглашению', { exact: true })).toHaveCount(0);
    await expect(
      page.getByText('Регистрация открыта только по приглашениям.', { exact: true }),
    ).toHaveCount(0);
    await expect(image).toHaveCSS('opacity', '1');
    await image.scrollIntoViewIfNeeded();
    const scrolled = await page.evaluate(() => window.scrollY > 9);

    await expect(page.locator('.site-header')).toHaveAttribute(
      'data-scrolled',
      String(scrolled),
    );
    await page.screenshot({
      path: testInfo.outputPath(`dashboard-${colorScheme}.png`),
      scale: 'css',
    });
  }
});

test('header stays in place, frosts only after scrolling and clears again at the top', async ({
  page,
}, testInfo) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    const header = page.locator('.site-header');
    const initialHeight = (await header.boundingBox())?.height;

    await expect(header).toHaveAttribute('data-scrolled', 'false');
    await expect(header).toHaveCSS('backdrop-filter', 'none');
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(header).toHaveAttribute('data-scrolled', 'true');
    await expect(header).toHaveCSS('backdrop-filter', 'blur(12px)');
    const scrolledBox = await header.boundingBox();

    expect(scrolledBox?.y).toBe(0);
    expect(scrolledBox?.height).toBe(initialHeight);
    await page.screenshot({
      path: testInfo.outputPath(`sticky-${colorScheme}.png`),
      scale: 'css',
    });
    await page.getByRole('link', { name: 'Request access', exact: true }).first().click();
    await expect(page).toHaveURL(/#request-access$/);
    await expect
      .poll(async () => {
        const target = await page.locator('#request-access').boundingBox();
        const bounds = await header.boundingBox();

        return Boolean(target && bounds && target.y >= bounds.y + bounds.height);
      })
      .toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).toHaveAttribute('data-scrolled', 'false');
    await expect(header).toHaveCSS('backdrop-filter', 'none');
  }
});

test('readable layout, native disclosure, and no hydration errors', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your files.');
  await page.screenshot({ path: testInfo.outputPath('default.png'), fullPage: true });
  await page.getByRole('link', { name: 'Explore Dropvia' }).click();
  await expect(page).toHaveURL(/#product$/);
  const summary = page.locator('summary').first();

  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/File operations require approved access/)).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true });
});

test('passes automated accessibility checks and provides visible keyboard focus', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });

  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await expect(skip).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect
    .poll(() =>
      page.locator('.file-scene img:visible').evaluateAll((images) =>
        images.every((image) => {
          if (
            !(image instanceof HTMLImageElement) ||
            !image.complete ||
            !image.naturalWidth
          ) {
            return false;
          }

          const frame = image.closest('[data-preview-frame]');

          return (
            frame !== null &&
            getComputedStyle(frame).opacity === '1' &&
            frame.getAnimations().length === 0
          );
        }),
      ),
    )
    .toBe(true);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('reflows at 320px and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await expect(page.getByRole('link', { name: 'Explore Dropvia' })).toHaveCSS(
    'transition-duration',
    '0s',
  );
});
