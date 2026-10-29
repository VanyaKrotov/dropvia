import { createCookie, redirect } from 'react-router';
import { readBoundedBody } from '@shared/server/http';

const noticeCookie = createCookie('dropvia_cookie_notice', {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 31_536_000,
});

export async function isCookieNoticeAcknowledged(request: Request): Promise<boolean> {
  try {
    const value: unknown = await noticeCookie.parse(request.headers.get('cookie'));
    return value === 'acknowledged-v1';
  } catch {
    return false;
  }
}

export async function acknowledgeCookieNotice(request: Request): Promise<Response> {
  const reject = (status: number) =>
    Response.json(
      { acknowledged: false },
      {
        status,
        headers: {
          'Cache-Control': 'no-store',
          ...(status === 405 ? { Allow: 'POST' } : {}),
        },
      },
    );

  if (request.method !== 'POST') {
    return reject(405);
  }
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== url.origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return reject(403);
  }
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/x-www-form-urlencoded'
  ) {
    return reject(415);
  }

  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await readBoundedBody(request));
  } catch (error) {
    return reject(error instanceof Response && error.status === 413 ? 413 : 400);
  }
  const returnTo = form.get('returnTo');
  if (
    form.get('acknowledge') !== 'yes' ||
    !returnTo ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.includes('\\') ||
    [...returnTo].some(
      (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  ) {
    return reject(400);
  }

  const headers = {
    'Cache-Control': 'no-store',
    'Set-Cookie': await noticeCookie.serialize('acknowledged-v1', {
      secure: url.protocol === 'https:',
    }),
  };
  if (request.headers.get('sec-fetch-dest') === 'document') {
    return redirect(returnTo, { status: 303, headers });
  }
  return Response.json({ acknowledged: true }, { headers });
}
