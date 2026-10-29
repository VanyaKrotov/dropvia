import { expect, test } from '@playwright/test';

test('header marks only the current page active in both languages', async ({ page }) => {
  for (const prefix of ['/ru', '']) {
    const home = prefix || '/';
    const cases = [
      [`${prefix}/prices`, `${prefix}/prices`],
      [`${prefix}/api/`, null],
      [`${prefix}/status`, `${prefix}/status`],
      [home, `${home}#product`],
      [`${home}#product`, `${home}#product`],
      [`${prefix}/terms`, null],
      [`${prefix}/privacy`, null],
    ] as const;

    for (const [path, expectedHref] of cases) {
      await page.goto(path);
      const active = page.locator('.primary-nav a[aria-current="page"]');

      await expect(active, path).toHaveCount(expectedHref === null ? 0 : 1);

      if (expectedHref !== null) {
        await expect(active).toHaveAttribute('href', expectedHref);
      }
    }
  }
});
