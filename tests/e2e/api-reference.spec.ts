import { expect, test } from '@playwright/test';

test('API reference shows file models and selectable REST responses with sticky navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const prefix of ['', '/ru']) {
    await page.goto(`${prefix}/api/`);
    await expect(
      page.locator('.primary-nav').getByRole('link', { name: 'API', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator('.site-footer').getByRole('link', { name: 'API', exact: true }),
    ).toHaveAttribute('href', `${prefix}/api/`);
    await expect(page.locator('.api-version')).toHaveText('API v1');
    const model = page.locator('#file-model');

    for (const field of [
      'publicUrl',
      'name',
      'id',
      'path',
      'size',
      'createdAt',
      'modifiedAt',
    ]) {
      await expect(model).toContainText(field);
    }

    const upload = page.locator('#upload');

    await upload.getByRole('combobox').selectOption('201');
    await expect(upload.locator('.code-window').last()).toContainText('201 Created');
    await expect(upload.locator('.code-window').last()).toContainText('publicUrl');
    await upload.getByRole('combobox').selectOption('403');
    await expect(upload.locator('.code-window').last()).toContainText(
      'ACCESS_RESTRICTED',
    );
    const metadataLink = page.locator('.api-index a[href="#metadata"]');

    await metadataLink.click();
    const header = await page.locator('.site-header').boundingBox();
    const nav = await page.locator('.api-index').boundingBox();

    expect(header).not.toBeNull();
    expect(nav).not.toBeNull();
    expect(nav!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
    expect(nav!.y).toBeLessThanOrEqual(header!.y + header!.height + 26);
    await expect(page.locator('#metadata')).toBeVisible();

    if ((page.viewportSize()?.width ?? 0) < 768) {
      const heading = await page.locator('#metadata h2').boundingBox();

      expect(heading!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
    }

    await page.screenshot({
      path: test.info().outputPath(`${prefix ? 'ru' : 'en'}-api-sticky.png`),
    });
  }
});
