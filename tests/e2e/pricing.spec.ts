import { expect, test } from '@playwright/test';

test('landing and pricing publish the same approved euro plans in both languages', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const path of ['/', '/prices', '/ru', '/ru/prices']) {
    const response = await request.get(path);

    expect(response.status()).toBe(200);
    const html = await response.text();

    for (const name of ['Plus', 'Standard', 'Advanced']) {
      expect(html).toContain(name);
    }

    expect(html).toContain('€');
    expect(html).toContain(path.startsWith('/ru') ? 'От 15 ТБ' : 'From 15 TB');
    await page.goto(path);
    const plans = page.locator('.pricing-plans');

    await expect(plans.locator('article')).toHaveCount(3);

    for (const [id, name, price] of [
      ['plus', 'Plus', /9[.,]99/],
      ['standard', 'Standard', /12/],
      ['advanced', 'Advanced', /18/],
    ] as const) {
      const plan = plans.locator(`[data-plan="${id}"]`);

      await expect(plan.getByRole('heading', { name, exact: true })).toBeVisible();
      await expect(plan.locator('.plan-price')).toContainText(price);
      await expect(plan.locator('.plan-price')).toContainText('€');
      await expect(plan.locator('a.button')).toHaveAttribute(
        'href',
        path.startsWith('/ru') ? '/ru#request-access' : '/#request-access',
      );
    }

    const text = await plans.innerText();

    expect(text).not.toMatch(
      /PDF|AI agents|AI integration|key management|password protection|file forwarding|(?:^|[\s(])ИИ(?:[\s-]|$)|ключами|паролем|Пересылка/i,
    );
  }
});

test('pricing comparison includes team capacities, recovery, administration and Advanced options', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/ru/prices');
  const plans = page.locator('.pricing-plans');

  await expect(plans.locator('[data-plan="plus"]')).toContainText('2 ТБ');
  await expect(plans.locator('[data-plan="plus"]')).toContainText('30 дней');
  await expect(plans.locator('[data-plan="standard"]')).toContainText('От 3 ТБ');
  await expect(plans.locator('[data-plan="standard"]')).toContainText('180 дней');
  await expect(plans.locator('[data-plan="advanced"]')).toContainText('От 15 ТБ');
  await expect(plans.locator('[data-plan="advanced"]')).toContainText(
    'От 3 пользователей',
  );
  await expect(plans.locator('[data-plan="advanced"]')).toContainText('1 год');
  const table = page.getByRole('table');

  for (const option of [
    'Брендированный доступ',
    'Папки рабочей группы',
    'Управление доступом',
    'Группы и роли',
    'Администрирование',
    'Сквозное шифрование',
    'Контроль соблюдения требований',
    'Единый вход',
  ]) {
    await expect(
      table.getByRole('rowheader', { name: option, exact: true }),
    ).toBeVisible();
  }

  await expect(
    table.getByRole('row', { name: /Сквозное шифрование/ }).getByRole('cell'),
  ).toContainText(['Не включено', 'Не включено', 'Включено']);
  await expect(
    table.getByRole('row', { name: /Единый вход/ }).getByRole('cell'),
  ).toContainText(['Не включено', 'Не включено', 'Включено']);

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await plans.screenshot({
      path: testInfo.outputPath(`plans-${colorScheme}.png`),
      scale: 'css',
      style: '.site-header { visibility: hidden; }',
    });
  }
});
