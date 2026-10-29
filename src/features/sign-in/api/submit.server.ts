import { readBoundedBody } from '@shared/server/http';
import {
  validateSignInCredentials,
  type SignInError,
  type SignInFieldErrors,
} from '@features/sign-in/model/credentials';

interface SignInResult {
  status: 400 | 403 | 405 | 413 | 415 | 422;
  error: SignInError;
  fieldErrors?: SignInFieldErrors;
}

export async function submitSignIn(request: Request): Promise<SignInResult> {
  if (request.method !== 'POST') {
    return { status: 405, error: 'method' };
  }

  const origin = request.headers.get('origin');

  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return { status: 403, error: 'forbidden' };
  }

  const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();

  if (type !== 'application/json' && type !== 'application/x-www-form-urlencoded') {
    return { status: 415, error: 'unsupported' };
  }

  let value: unknown;

  try {
    const body = await readBoundedBody(request, 16_384);

    if (type === 'application/json') {
      value = JSON.parse(body) as unknown;
    } else {
      const form = new URLSearchParams(body);

      value = { email: form.get('email'), password: form.get('password') };
    }
  } catch (error) {
    return error instanceof Response && error.status === 413
      ? { status: 413, error: 'tooLarge' }
      : { status: 400, error: 'invalid' };
  }

  const fieldErrors = validateSignInCredentials(value);

  if (fieldErrors.email || fieldErrors.password) {
    return { status: 422, error: 'invalid', fieldErrors };
  }

  // The current same-server authentication stub always rejects valid submissions.
  // Credentials are transient: never return, log, cache or persist them here.
  return { status: 400, error: 'clientNotFound' };
}
