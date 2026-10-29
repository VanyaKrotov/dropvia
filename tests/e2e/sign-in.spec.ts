import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('header opens localized sign-in with an access-request link and server HTML metadata', async ({
  page,
  request,
}) => {
  let submissions = 0;

  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/sign-in')) {
      submissions++;
    }
  });

  for (const prefix of ['', '/ru']) {
    await page.goto(prefix || '/');
    await page
      .locator('.site-header')
      .getByRole('link', { name: prefix ? 'Войти' : 'Sign in', exact: true })
      .click();
    await expect(page).toHaveURL(`${prefix}/sign-in`);
    await expect(
      page.getByLabel(prefix ? 'Пароль' : 'Password', { exact: true }),
    ).toHaveAttribute('autocomplete', 'current-password');
    await expect(page.locator('input[name="email"]')).toHaveAttribute(
      'autocomplete',
      'username',
    );
    const password = page.locator('input[name="password"]');

    await page
      .getByRole('button', { name: prefix ? 'Войти' : 'Sign in', exact: true })
      .click();
    await expect(page.locator('#sign-in-email-error')).toHaveText(
      prefix ? 'Введите электронную почту.' : 'Enter your email address.',
    );
    await expect(page.locator('#sign-in-password-error')).toHaveText(
      prefix ? 'Введите пароль.' : 'Enter your password.',
    );
    await expect(page.locator('input[name="email"]')).toBeFocused();
    await page.locator('input[name="email"]').fill('bad-email');
    await expect(page.locator('#sign-in-email-error')).toHaveText(
      prefix
        ? 'Введите адрес электронной почты в формате name@example.com.'
        : 'Enter an email address in the format name@example.com.',
    );
    await page.locator('input[name="email"]').fill('validation@example.com');
    await password.fill('1234567');
    await page
      .getByRole('button', { name: prefix ? 'Войти' : 'Sign in', exact: true })
      .click();
    await expect(password).toBeFocused();
    await expect(page.locator('#sign-in-password-error')).toHaveText(
      prefix
        ? 'Пароль должен содержать не менее 8 символов.'
        : 'Your password must contain at least 8 characters.',
    );
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    await expect(password).toHaveAttribute('aria-describedby', 'sign-in-password-error');
    await expect(page.locator('#sign-in-email-error')).toHaveCount(0);
    expect(submissions).toBe(0);
    await page.screenshot({
      path: test.info().outputPath(`${prefix ? 'ru' : 'en'}-password-validation.png`),
      fullPage: true,
    });
    await password.fill('12345678');
    await expect(page.locator('#sign-in-password-error')).toHaveCount(0);
    await expect(password).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('.sign-in-access a')).toHaveAttribute(
      'href',
      `${prefix || '/'}#request-access`,
    );
    const html = await (await request.get(`${prefix}/sign-in`)).text();

    expect(html).toContain('name="password"');
    expect(html).toContain('noindex, nofollow');
    expect(html).toContain(`https://dropvia.fun${prefix}/sign-in`);
    await page
      .getByRole('link', { name: prefix ? 'English' : 'Русский', exact: true })
      .click();
    await expect(page).toHaveURL(prefix ? '/sign-in' : '/ru/sign-in');
    await page.locator('.sign-in-access a').click();
    await expect(page).toHaveURL(prefix ? '/#request-access' : '/ru#request-access');
    await expect(page.locator('#request-access')).toBeInViewport();
  }
});

test('sign-in renders in both themes and handles pending and client-not-found submission', async ({
  page,
}) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|Minified React/i.test(message.text())) {
      errors.push(message.text());
    }
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/ru/sign-in');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`${colorScheme}-sign-in.png`),
      fullPage: true,
    });
  }

  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await page.route('**/sign-in.data*', async (route) => {
    await gate;
    await route.continue();
  });
  await page
    .getByLabel('Электронная почта', { exact: true })
    .fill('browser-test@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('browser-test-password');
  const response = page.waitForResponse(
    (response) =>
      response.url().includes('/ru/sign-in.data') &&
      response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Входим…', exact: true })).toBeDisabled();
  release();
  expect((await response).status()).toBe(400);
  expect((await response).headers()['cache-control']).toBe('no-store');
  await expect(page.getByRole('alert')).toContainText(
    'Клиент с такими данными не найден',
  );
  await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeEnabled();
  expect(await page.context().cookies()).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('dark-sign-in-error.png'),
    fullPage: true,
  });
});

test('sign-in returns the rejection message without credentials and preserves method headers', async ({
  request,
}) => {
  const email = 'http-test@example.com';
  const password = 'http-test-password';
  const invalid = await request.post('/ru/sign-in', {
    form: { email, password: '1234567' },
  });

  expect(invalid.status()).toBe(422);
  expect(await invalid.text()).toContain('Пароль должен содержать не менее 8 символов.');
  const response = await request.post('/ru/sign-in', { form: { email, password } });

  expect(response.status()).toBe(400);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(response.headers()['set-cookie']).toBeUndefined();
  const html = await response.text();

  expect(html).toContain('Клиент с такими данными не найден');
  expect(html).not.toContain(email);
  expect(html).not.toContain(password);
  const method = await request.put('/ru/sign-in', { form: { email, password } });

  expect(method.status()).toBe(405);
  expect(method.headers()['allow']).toBe('GET, HEAD, POST');
});

test('sign-in submits without JavaScript and does not reflect passwords', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/ru/sign-in');
  await page.locator('input[name="email"]').fill('native-test@example.com');
  await page.locator('input[name="password"]').fill('1234567');
  const invalidResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/ru/sign-in'),
  );

  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  expect((await invalidResponse).status()).toBe(422);
  await expect(page.locator('#sign-in-password-error')).toHaveText(
    'Пароль должен содержать не менее 8 символов.',
  );
  await expect(page.locator('input[name="password"]')).toHaveAttribute(
    'aria-describedby',
    'sign-in-password-error',
  );
  await page
    .getByLabel('Электронная почта', { exact: true })
    .fill('native-test@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('native-test-password');
  const response = page.waitForResponse(
    (response) =>
      response.url().endsWith('/ru/sign-in') && response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  expect((await response).status()).toBe(400);
  await expect(page.getByRole('alert')).toContainText(
    'Клиент с такими данными не найден',
  );
  expect(await page.content()).not.toContain('native-test-password');
  await expect(page.locator('input[name="password"]')).toHaveValue('');
  await context.close();
});
