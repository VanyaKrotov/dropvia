import { describe, expect, it } from 'vitest';
import { apiError } from '@shared/server/http';

describe('HTTP error response headers', () => {
  const inputs: HeadersInit[] = [
    { Allow: 'GET, HEAD' },
    new Headers({ Allow: 'GET, HEAD' }),
    [['Allow', 'GET, HEAD']],
  ];

  it.each(inputs.map((headers) => ({ headers })))(
    'preserves HeadersInit representations and default response controls: %j',
    ({ headers }) => {
      const response = apiError(
        405,
        'METHOD_NOT_ALLOWED',
        'Unsupported method.',
        headers,
      );

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, HEAD');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Content-Type')).toContain('application/json');
    },
  );
});
