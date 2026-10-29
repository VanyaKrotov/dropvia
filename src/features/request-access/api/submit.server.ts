import { apiError, methodNotAllowed, readBoundedBody } from '@shared/server/http';
import { isAccessRequest } from '@features/request-access/model/request';

export async function submitAccessRequest(request: Request) {
  if (request.method !== 'POST') {
    return methodNotAllowed('POST');
  }

  const origin = request.headers.get('origin');

  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return apiError(
      403,
      'ORIGIN_NOT_ALLOWED',
      'Use the form on dropvia.fun to request access.',
    );
  }

  let value: unknown;

  try {
    const body = await readBoundedBody(request, 16_384);
    const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();

    if (type === 'application/json') {
      value = JSON.parse(body) as unknown;
    } else if (type === 'application/x-www-form-urlencoded') {
      const form = new URLSearchParams(body);

      value = {
        name: form.get('name'),
        email: form.get('email'),
        organization: form.get('organization') ?? '',
        needs: form.get('needs'),
        consent: form.get('consent') === 'on',
      };
    } else {
      return apiError(
        415,
        'UNSUPPORTED_MEDIA_TYPE',
        'Send JSON or URL-encoded form data.',
      );
    }
  } catch (error) {
    if (error instanceof Response && error.status === 413) {
      return apiError(413, 'BODY_TOO_LARGE', 'The request exceeds 16384 bytes.');
    }

    return apiError(400, 'INVALID_BODY', 'The request body could not be read.');
  }

  if (!isAccessRequest(value)) {
    return apiError(
      422,
      'VALIDATION_ERROR',
      'Provide your name, a valid email, your needs and consent. Check the field length limits.',
    );
  }

  // Contract-only acknowledgement: deliberately no persistence, logs or outgoing mail.
  return Response.json(
    { id: crypto.randomUUID(), status: 'received' },
    {
      status: 201,
      headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    },
  );
}
