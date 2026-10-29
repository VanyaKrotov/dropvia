import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { endpoints, requestExample, responseExample } from '@pages/api/examples';

describe('documented file contract', () => {
  it('uses the configured file server and API key in the JavaScript client', async () => {
    const metadata = endpoints.find((endpoint) => endpoint.key === 'metadata')!;

    for (const serverUrl of [
      'https://storage.example.test',
      'https://storage.example.test/',
    ]) {
      const fetch = vi.fn(async () => Response.json({}));
      const result: unknown = runInNewContext(
        `(async () => { ${requestExample(metadata, 'JavaScript')} })()`,
        {
          process: {
            env: { DROPVIA_SERVER_URL: serverUrl, DROPVIA_API_KEY: 'local-test-key' },
          },
          fetch,
          URL,
        },
      );

      await result;
      expect(fetch).toHaveBeenCalledWith(
        new URL(`/api/v1/files/67e55044-10b1-426f-9247-bb680e5fe0c8`, serverUrl),
        { method: 'GET', headers: { Authorization: 'Bearer local-test-key' } },
      );
    }
  });
  it('keeps a fixed server address out of requests and response representations', () => {
    for (const endpoint of endpoints) {
      for (const language of ['cURL', 'JavaScript', 'Python'] as const) {
        const request = requestExample(endpoint, language);

        expect(request).toContain('DROPVIA_SERVER_URL');
        expect(request).not.toMatch(/https?:\/\//);

        if (!['health', 'access'].includes(endpoint.key)) {
          expect(request).toContain('DROPVIA_API_KEY');
        }
      }

      for (const response of endpoint.responses) {
        expect(responseExample(endpoint, response.status)).not.toMatch(/https?:\/\//);
      }
    }
  });
  it('returns a created FileResource on upload and the same representation for metadata', () => {
    const upload = endpoints.find((endpoint) => endpoint.key === 'upload')!;
    const metadata = endpoints.find((endpoint) => endpoint.key === 'metadata')!;

    expect(upload.status).toBe(201);
    expect(metadata.status).toBe(200);
    const file: unknown = JSON.parse(responseExample(upload));

    expect(file).toMatchObject({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      name: expect.any(String),
      path: expect.any(String),
      size: expect.any(Number),
      mimeType: expect.any(String),
      publicUrl: null,
      downloadUrl: expect.any(String),
      createdAt: expect.stringMatching(/Z$/),
      modifiedAt: expect.stringMatching(/Z$/),
    });
    expect(JSON.parse(responseExample(metadata))).toEqual(file);
  });
  it('documents binary downloads and an empty deletion response', () => {
    const download = endpoints.find((endpoint) => endpoint.key === 'download')!;
    const remove = endpoints.find((endpoint) => endpoint.key === 'remove')!;

    expect(download.status).toBe(200);
    expect(responseExample(download)).toMatch(/binary/i);
    expect(remove.status).toBe(204);
    expect(responseExample(remove)).toBe('');
    expect(requestExample(remove, 'JavaScript')).not.toContain('response.json()');
    expect(requestExample(remove, 'Python')).not.toContain('response.json()');
  });
});
