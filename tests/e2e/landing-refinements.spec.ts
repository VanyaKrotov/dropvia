import { expect, test } from '@playwright/test';

test('new sections and complete request form render on the server in both languages', async ({
  request,
}) => {
  for (const [path, title] of [
    ['/', 'Good files'],
    ['/ru', 'Файлы нужны'],
  ] as const) {
    const html = await (await request.get(path)).text();

    expect(html).toContain(title);

    for (const name of ['name', 'organization', 'needs', 'email']) {
      expect(html).toContain(`name="${name}"`);
    }

    expect(html).not.toContain('Заявка на приглашение не оформляет подписку.');
  }
});

test('request includes all fields and has a plain text submit button', async ({
  page,
}) => {
  await page.goto('/ru');
  await page.getByLabel('Имя', { exact: true }).fill('Алексей Иванов');
  await page.getByLabel('Электронная почта', { exact: true }).fill('alex@example.com');
  await page.getByLabel(/Продукт или компания/).fill('Студия');
  await page
    .getByLabel('Для каких потребностей', { exact: true })
    .fill('Хранить и передавать файлы проектов.');
  await page.getByLabel(/Я принимаю/).check();
  const button = page.getByRole('button', { name: 'Оставить заявку', exact: true });

  await expect(button.locator('svg')).toHaveCount(0);
  const sent = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/v1/access-requests') && request.method() === 'POST',
  );

  await button.click();
  expect((await sent).postDataJSON()).toEqual({
    name: 'Алексей Иванов',
    email: 'alex@example.com',
    organization: 'Студия',
    needs: 'Хранить и передавать файлы проектов.',
    consent: true,
  });
  await expect(page.locator('.success-message')).toContainText('Заявка принята.');
});

test('code windows highlight and copy the original source, including after changing language', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.clock.install({ time: new Date('2026-10-28T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-28T12:00:01Z'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const teaser = page.locator('.code-window');
  const source = await teaser.locator('code').textContent();

  await expect(teaser.locator('.syntax-keyword').first()).toHaveText('GET');
  const copy = teaser.getByRole('button');

  await expect(copy).toHaveText('');
  await expect(copy).toHaveCSS('border-radius', '50%');
  const bounds = await copy.boundingBox();

  expect(bounds?.width).toBe(bounds?.height);
  await copy.click();
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await navigator.clipboard.readText()).replace(/\r\n/g, '\n'),
      ),
    )
    .toBe(source);
  await expect(copy).toHaveAccessibleName('Copied');
  await expect(copy).toHaveAttribute('data-copied', 'true');
  await page.clock.fastForward(4999);
  await expect(copy).toHaveAccessibleName('Copied');
  await page.clock.fastForward(1);
  await expect(copy).toHaveAccessibleName('Copy example');
  await page.goto('/api/');
  await page.getByRole('tab', { name: 'JavaScript' }).click();
  const example = page.locator('.code-window').first();

  await example.getByRole('button', { name: 'Copy example' }).click();
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await navigator.clipboard.readText()).replace(/\r\n/g, '\n'),
      ),
    )
    .toBe(await example.locator('code').textContent());
  await expect(page.locator('.code-window')).toHaveCount(15);
});

test('FAQ animates both directions, reverses rapidly and supports keyboard and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const item = page.locator('.accordion-item').first();
  const summary = item.locator('summary');
  const content = item.locator('.accordion-content');

  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(item).toHaveAttribute('open', '');
  await expect
    .poll(() =>
      content.evaluate((element) => {
        const height = element.getBoundingClientRect().height;

        return height > 0 && height < element.scrollHeight;
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      content.evaluate(
        (element) =>
          element.style.height === '' &&
          Math.abs(element.getBoundingClientRect().height - element.scrollHeight) < 1,
      ),
    )
    .toBe(true);
  await summary.click();
  await expect(item).toHaveAttribute('data-closing', 'true');
  await expect
    .poll(() =>
      content.evaluate((element) => {
        const height = element.getBoundingClientRect().height;

        return height > 0 && height < element.scrollHeight;
      }),
    )
    .toBe(true);
  await summary.click();
  await expect(item).toHaveAttribute('data-closing', 'false');
  await expect(item).toHaveAttribute('open', '');
  await summary.click();
  await expect(item).not.toHaveAttribute('open');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await summary.click();
  await expect(content).toBeVisible();
  expect(await content.evaluate((element) => element.getAnimations().length)).toBe(0);
  await summary.click();
  await expect(item).not.toHaveAttribute('open');
});
