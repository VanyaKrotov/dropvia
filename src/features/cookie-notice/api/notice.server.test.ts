import { describe, expect, it } from 'vitest';
import {
  acknowledgeCookieNotice,
  isCookieNoticeAcknowledged,
} from '@features/cookie-notice/api/notice.server';

function submission(body = 'acknowledge=yes&returnTo=%2Fru%2Fprices', headers = {}) {
  return new Request('https://dropvia.fun/cookie-notice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body,
  });
}

describe('cookie notice acknowledgement', () => {
  it('does not acknowledge a new visitor or malformed cookie values', async () => {
    for (const cookie of [
      '',
      'dropvia_cookie_notice=invalid',
      'dropvia_cookie_notice=%',
    ]) {
      const request = new Request('https://dropvia.fun/', {
        headers: { Cookie: cookie },
      });
      expect(await isCookieNoticeAcknowledged(request)).toBe(false);
    }
  });

  it('remembers explicit acknowledgement with a first-party cookie for one year', async () => {
    const response = await acknowledgeCookieNotice(submission());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ acknowledged: true });
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('dropvia_cookie_notice=');
    expect(cookie).toContain('Max-Age=31536000');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).not.toContain('Domain=');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(
      await isCookieNoticeAcknowledged(
        new Request('https://dropvia.fun/ru', {
          headers: { Cookie: cookie.split(';')[0] ?? '' },
        }),
      ),
    ).toBe(true);
  });

  it('redirects native submissions to the original internal page', async () => {
    const response = await acknowledgeCookieNotice(
      submission(undefined, {
        'Sec-Fetch-Dest': 'document',
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/ru/prices');
    expect(response.headers.get('set-cookie')).not.toBeNull();
  });

  it('does not issue a Secure-only cookie on a plain HTTP server', async () => {
    const response = await acknowledgeCookieNotice(
      new Request('http://127.0.0.1/cookie-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'acknowledge=yes&returnTo=%2F',
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).not.toContain('Secure');
  });

  it('rejects cross-origin, invalid and oversized requests without setting a cookie', async () => {
    const requests = [
      [submission(undefined, { Origin: 'https://other.invalid' }), 403],
      [submission(undefined, { 'Sec-Fetch-Site': 'cross-site' }), 403],
      [submission('acknowledge=no&returnTo=%2F'), 400],
      [submission('acknowledge=yes&returnTo=%2F%2Fevil.invalid'), 400],
      [submission('acknowledge=yes&returnTo=%2F%5Cevil.invalid'), 400],
      [submission('acknowledge=yes&returnTo=%2F%00'), 400],
      [submission('acknowledge=yes&returnTo=%2F%0D%0A'), 400],
      [submission('acknowledge=yes&returnTo=https%3A%2F%2Fevil.invalid'), 400],
      [submission('x'.repeat(4097)), 413],
      [submission('{}', { 'Content-Type': 'application/json' }), 415],
      [new Request('https://dropvia.fun/cookie-notice'), 405],
    ] as const;
    for (const [request, status] of requests) {
      const response = await acknowledgeCookieNotice(request);
      expect(response.status).toBe(status);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
  });
});
