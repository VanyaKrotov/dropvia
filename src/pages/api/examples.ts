import type { FileResource } from '@entities/file/model';
import type { StatusSnapshot } from '@entities/service-health/model';

export type ExampleLanguage = 'cURL' | 'JavaScript' | 'Python';

type Method = 'GET' | 'POST' | 'DELETE';

type EndpointKey =
  'upload' | 'download' | 'metadata' | 'remove' | 'share' | 'health' | 'access';

export interface ApiResponse {
  status: number;
  reason: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface Endpoint {
  key: EndpointKey;
  method: Method;
  path: string;
  status: number;
  responses: readonly [ApiResponse, ...ApiResponse[]];
}

export const sampleFile: FileResource = {
  id: '67e55044-10b1-426f-9247-bb680e5fe0c8',
  name: 'brief.pdf',
  path: '/projects/brief.pdf',
  size: 1048576,
  mimeType: 'application/pdf',
  publicUrl: null,
  downloadUrl: '/api/v1/download/67e55044-10b1-426f-9247-bb680e5fe0c8',
  createdAt: '2026-10-28T12:00:00.000Z',
  modifiedAt: '2026-10-28T12:00:00.000Z',
};
const id = sampleFile.id;
const requestId = 'a8d66708-61ad-4dc2-a181-a0cb8dc6ad0c';
const shareId = 'cc7ea167-2445-427b-b62c-c97b29085154';
const publicUrl = `/s/${shareId}`;
const accessPayload = {
  name: 'Alex Morgan',
  email: 'you@example.com',
  organization: 'Studio North',
  needs: 'Keep project files and share finished work.',
  consent: true,
};
const snapshot: StatusSnapshot = {
  checkedAt: '2026-10-28T12:00:00.000Z',
  services: [
    { id: 'api', state: 'operational', latencyMs: 42 },
    { id: 'authentication', state: 'operational', latencyMs: 38 },
    { id: 'download-01', state: 'operational', latencyMs: 59 },
    { id: 'download-02', state: 'operational', latencyMs: 46 },
  ],
};
const errorCatalog = {
  400: ['Bad Request', 'INVALID_BODY', 'Malformed request body or invalid file UUID.'],
  401: ['Unauthorized', 'UNAUTHORIZED', 'A valid Bearer token is required.'],
  403: [
    'Forbidden',
    'ACCESS_RESTRICTED',
    'Permission to perform this operation is required.',
  ],
  404: ['Not Found', 'FILE_NOT_FOUND', 'The file was not found or is not accessible.'],
  405: ['Method Not Allowed', 'METHOD_NOT_ALLOWED', 'This HTTP method is not supported.'],
  409: [
    'Conflict',
    'RESOURCE_CONFLICT',
    'The operation conflicts with the current resource state.',
  ],
  413: [
    'Content Too Large',
    'BODY_TOO_LARGE',
    'Request body exceeds the permitted size.',
  ],
  415: [
    'Unsupported Media Type',
    'UNSUPPORTED_MEDIA_TYPE',
    'The request Content-Type is not supported.',
  ],
  416: [
    'Range Not Satisfiable',
    'INVALID_RANGE',
    'The requested byte range cannot be satisfied.',
  ],
  422: [
    'Unprocessable Content',
    'VALIDATION_ERROR',
    'One or more request fields failed validation.',
  ],
  429: [
    'Too Many Requests',
    'RATE_LIMITED',
    'Request rate limit exceeded. See Retry-After.',
  ],
  500: ['Internal Server Error', 'INTERNAL_ERROR', 'An internal server error occurred.'],
  503: [
    'Service Unavailable',
    'SERVICE_UNAVAILABLE',
    'Service temporarily unavailable. See Retry-After.',
  ],
} as const;
export const errorStatuses = Object.keys(errorCatalog).map(Number);

function json(
  status: number,
  reason: string,
  body: unknown,
  headers: Record<string, string> = {},
): ApiResponse {
  return {
    status,
    reason,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers,
    },
    body,
  };
}

function operation(
  key: EndpointKey,
  method: Method,
  path: string,
  responses: readonly [ApiResponse, ...ApiResponse[]],
  errors: (keyof typeof errorCatalog)[],
): Endpoint {
  const failed = errors.map((status): ApiResponse => {
    const [reason, code, message] = errorCatalog[status];
    const headers: Record<string, string> = {};

    if (status === 401) {
      headers['WWW-Authenticate'] = 'Bearer realm="dropvia"';
    }

    if (status === 405) {
      headers.Allow =
        key === 'metadata' || key === 'remove'
          ? 'GET, HEAD, DELETE'
          : method === 'GET'
            ? 'GET, HEAD'
            : method;
    }

    if (status === 416) {
      headers['Content-Range'] = `bytes */${sampleFile.size}`;
    }

    if (status === 429 || status === 503) {
      headers['Retry-After'] = '30';
    }

    return json(
      status,
      reason,
      {
        error: {
          code: key === 'access' && status === 403 ? 'ORIGIN_NOT_ALLOWED' : code,
          message:
            key === 'access' && status === 403
              ? 'The request origin is not allowed.'
              : message,
        },
        requestId,
      },
      headers,
    );
  });

  return {
    key,
    method,
    path,
    status: responses[0].status,
    responses: [responses[0], ...responses.slice(1), ...failed],
  };
}

const fileHeaders = {
  'Content-Type': sampleFile.mimeType,
  'Content-Disposition': 'attachment; filename="brief.pdf"',
  'Accept-Ranges': 'bytes',
  'Cache-Control': 'private, no-store',
};
export const endpoints: readonly Endpoint[] = [
  operation(
    'upload',
    'POST',
    '/upload/{uuid?}',
    [json(201, 'Created', sampleFile, { Location: `/api/v1/files/${id}` })],
    [400, 401, 403, 405, 409, 413, 415, 422, 429, 500, 503],
  ),
  operation(
    'download',
    'GET',
    '/download/{uuid}',
    [
      {
        status: 200,
        reason: 'OK',
        headers: { ...fileHeaders, 'Content-Length': String(sampleFile.size) },
        body: '[Binary file content]',
      },
      {
        status: 206,
        reason: 'Partial Content',
        headers: {
          ...fileHeaders,
          'Content-Length': '1024',
          'Content-Range': `bytes 0-1023/${sampleFile.size}`,
        },
        body: '[First 1024 bytes of the file]',
      },
    ],
    [400, 401, 403, 404, 405, 416, 429, 500, 503],
  ),
  operation(
    'metadata',
    'GET',
    '/files/{uuid}',
    [
      json(200, 'OK', sampleFile, {
        ETag: '"file-v1"',
        'Cache-Control': 'private, no-cache',
      }),
      {
        status: 304,
        reason: 'Not Modified',
        headers: { ETag: '"file-v1"', 'Cache-Control': 'private, no-cache' },
      },
    ],
    [400, 401, 403, 404, 405, 429, 500, 503],
  ),
  operation(
    'remove',
    'DELETE',
    '/files/{uuid}',
    [{ status: 204, reason: 'No Content', headers: { 'Cache-Control': 'no-store' } }],
    [400, 401, 403, 404, 405, 409, 429, 500, 503],
  ),
  operation(
    'share',
    'POST',
    '/shares/{uuid}',
    [
      json(
        201,
        'Created',
        {
          id: shareId,
          fileId: id,
          publicUrl,
          createdAt: sampleFile.createdAt,
          file: { ...sampleFile, publicUrl },
        },
        { Location: publicUrl },
      ),
    ],
    [400, 401, 403, 404, 405, 409, 429, 500, 503],
  ),
  operation(
    'health',
    'GET',
    '/status',
    [json(200, 'OK', snapshot)],
    [405, 429, 500, 503],
  ),
  operation(
    'access',
    'POST',
    '/access-requests',
    [json(201, 'Created', { id: requestId, status: 'received' })],
    [400, 403, 405, 413, 415, 422, 429, 500, 503],
  ),
];

export function responseExample(endpoint: Endpoint, status = endpoint.status): string {
  const response = endpoint.responses.find((item) => item.status === status);

  if (!response) {
    throw new Error(`Undocumented status ${status}`);
  }

  return response.body === undefined
    ? ''
    : typeof response.body === 'string'
      ? response.body
      : JSON.stringify(response.body, null, 2);
}

export function responseHttpExample(
  endpoint: Endpoint,
  status = endpoint.status,
): string {
  const response = endpoint.responses.find((item) => item.status === status);

  if (!response) {
    throw new Error(`Undocumented status ${status}`);
  }

  const head = [
    `HTTP/1.1 ${response.status} ${response.reason}`,
    ...Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`),
  ].join('\n');
  const body = responseExample(endpoint, status);

  return body ? `${head}\n\n${body}` : head;
}

export function requestExample(endpoint: Endpoint, language: ExampleLanguage): string {
  const path = `/api/v1${endpoint.path.replace('{uuid?}', id).replace('{uuid}', id)}`;
  const secured = !['access', 'health'].includes(endpoint.key);

  if (language === 'cURL') {
    const url = `\${DROPVIA_SERVER_URL%/}${path}`;
    const auth = secured ? ` \\\n  -H "Authorization: Bearer $DROPVIA_API_KEY"` : '';

    if (endpoint.key === 'upload') {
      return `curl --fail-with-body -X POST "${url}"${auth} \\\n  -F 'file=@./brief.pdf' \\\n  -F 'path=/projects/brief.pdf'\n\n# Raw binary upload\ncurl --fail-with-body -X POST "${url}?name=brief.pdf&path=%2Fprojects%2Fbrief.pdf"${auth} \\\n  -H 'Content-Type: application/pdf' \\\n  --data-binary '@./brief.pdf'`;
    }

    if (endpoint.key === 'download') {
      return `curl --fail "${url}"${auth} \\\n  -H 'Accept: application/pdf, application/octet-stream' \\\n  --output brief.pdf\n\n# Optional partial download: add -H 'Range: bytes=0-1023'.`;
    }

    return `curl --fail-with-body -X ${endpoint.method} "${url}"${auth}${endpoint.key === 'access' ? ` \\\n  -H 'Content-Type: application/json' \\\n  --data '${JSON.stringify(accessPayload)}'` : ''}${endpoint.key === 'metadata' ? `\n\n# To check a cached version, add -H 'If-None-Match: "file-v1"'.` : ''}`;
  }

  if (language === 'JavaScript') {
    let imports = '';
    let body = '';
    const options = [`method: '${endpoint.method}'`];
    const setup = `const serverUrl = process.env.DROPVIA_SERVER_URL;\nif (!serverUrl) throw new Error('Set DROPVIA_SERVER_URL');\n${secured ? "const apiKey = process.env.DROPVIA_API_KEY;\nif (!apiKey) throw new Error('Set DROPVIA_API_KEY');\n" : ''}\n`;
    const auth = 'Authorization: `Bearer ${apiKey}`';

    if (endpoint.key === 'upload') {
      imports = `import { openAsBlob } from 'node:fs';\n\n`;
      body = `const body = new FormData();\nbody.append('file', await openAsBlob('./brief.pdf', { type: 'application/pdf' }), 'brief.pdf');\nbody.append('path', '/projects/brief.pdf');\n`;
      options.push(`headers: { ${auth} }`, 'body');
    } else {
      if (endpoint.key === 'download') {
        imports = `import { createWriteStream } from 'node:fs';\nimport { Readable } from 'node:stream';\nimport { pipeline } from 'node:stream/promises';\n\n`;
      }

      if (secured) {
        options.push(`headers: { ${auth} }`);
      }

      if (endpoint.key === 'access') {
        options.push(
          `headers: { 'Content-Type': 'application/json' }`,
          `body: JSON.stringify(${JSON.stringify(accessPayload, null, 2)})`,
        );
      }
    }

    const finish =
      endpoint.key === 'remove'
        ? `// 204 No Content: do not read a JSON body.`
        : endpoint.key === 'download'
          ? `if (!response.body) throw new Error('Empty file stream');\nawait pipeline(Readable.fromWeb(response.body), createWriteStream('./brief.pdf'));`
          : `const data = await response.json();`;

    return `${imports}${setup}${body}const response = await fetch(new URL('${path}', serverUrl), {\n  ${options.join(',\n  ')}\n});\nif (!response.ok) throw new Error(await response.text());\n${finish}`;
  }

  const url = `f'{server_url}${path}'`;
  const auth = secured
    ? `headers={'Authorization': f'Bearer {os.environ["DROPVIA_API_KEY"]}'},\n    `
    : '';
  const prefix = `import requests\nimport os\n\nserver_url = os.environ['DROPVIA_SERVER_URL'].rstrip('/')\n\n`;

  if (endpoint.key === 'upload') {
    return `${prefix}with open('brief.pdf', 'rb') as file:\n    response = requests.post(\n        ${url},\n        headers={'Authorization': f'Bearer {os.environ["DROPVIA_API_KEY"]}'},\n        files={'file': ('brief.pdf', file, 'application/pdf')},\n        data={'path': '/projects/brief.pdf'}, timeout=30\n    )\nresponse.raise_for_status()\ndata = response.json()`;
  }

  if (endpoint.key === 'download') {
    return `${prefix}with requests.get(\n    ${url},\n    ${auth}stream=True, timeout=30\n) as response:\n    response.raise_for_status()\n    with open('brief.pdf', 'wb') as file:\n        for chunk in response.iter_content(chunk_size=65536):\n            file.write(chunk)`;
  }

  const finish =
    endpoint.key === 'remove'
      ? '# 204 No Content: no JSON body.'
      : 'data = response.json()';
  const payload =
    endpoint.key === 'access'
      ? `json={'name': 'Alex Morgan', 'email': 'you@example.com',\n          'organization': 'Studio North', 'needs': 'Keep project files', 'consent': True},\n    `
      : '';

  return `${prefix}response = requests.${endpoint.method.toLowerCase()}(\n    ${url},\n    ${auth}${payload}timeout=30\n)\nresponse.raise_for_status()\n${finish}`;
}
