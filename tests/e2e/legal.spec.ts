import { expect, test } from '@playwright/test';

test('localized legal headings fit their container at narrow widths', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/ru/privacy');
    const heading = page.getByRole('heading', { level: 1 });
    const bounds = await heading.evaluate((element) => {
      const range = document.createRange();

      range.selectNodeContents(element);
      const container = element.getBoundingClientRect();

      return Array.from(range.getClientRects(), (line) => ({
        left: line.left,
        right: line.right,
        containerLeft: container.left,
        containerRight: container.right,
      }));
    });

    for (const line of bounds) {
      expect(line.left).toBeGreaterThanOrEqual(line.containerLeft - 1);
      expect(line.right).toBeLessThanOrEqual(line.containerRight + 1);
    }

    await page.screenshot({
      path: test.info().outputPath(`privacy-${width}.png`),
      fullPage: true,
      scale: 'css',
    });
  }
});
