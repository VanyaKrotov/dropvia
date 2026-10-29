export function apiError(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
) {
  const responseHeaders = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });

  new Headers(headers).forEach((value, key) => responseHeaders.set(key, value));

  return Response.json(
    { error: { code, message }, requestId: crypto.randomUUID() },
    {
      status,
      headers: responseHeaders,
    },
  );
}

export function methodNotAllowed(allow: string) {
  return apiError(405, 'METHOD_NOT_ALLOWED', 'This HTTP method is not supported.', {
    Allow: allow,
  });
}

export async function readBoundedBody(request: Request, limit = 4096): Promise<string> {
  const length = request.headers.get('content-length');

  if (length !== null && Number(length) > limit) {
    throw new Response(null, { status: 413 });
  }

  if (!request.body) {
    return '';
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      size += result.value.byteLength;

      if (size > limit) {
        await reader.cancel();
        throw new Response(null, { status: 413 });
      }

      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
