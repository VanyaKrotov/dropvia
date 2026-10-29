import { expect, test } from '@playwright/test';

test('native landing submissions preserve cache and method response headers', async ({
  request,
}) => {
  const form = {
    name: 'Audit Reader',
    email: 'audit@example.com',
    needs: 'Keep project files.',
    consent: 'on',
  };

  for (const path of ['/', '/ru']) {
    const response = await request.post(`${path}?index`, { form });

    expect(response.status()).toBe(201);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['content-type']).toContain('text/html');
    const rejected = await request.put(`${path}?index`, { form });

    expect(rejected.status()).toBe(405);
    expect(rejected.headers()['allow']).toBe('GET, HEAD, POST');
    expect(rejected.headers()['cache-control']).toBe('no-store');
  }
});
