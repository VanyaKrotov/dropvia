import { describe, expect, it } from 'vitest';
import { submitAccessRequest } from '@features/request-access/api/submit.server';

const valid = {
  email: ' reader@example.com ',
  name: 'Alex Morgan',
  organization: 'Studio North',
  needs: 'Keep project documents and share files with clients.',
  consent: true,
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://dropvia.fun/api/v1/access-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('access request boundary', () => {
  it('acknowledges a valid request without reflecting personal data', async () => {
    const response = await submitAccessRequest(request(valid));

    expect(response.status).toBe(201);
    expect(await response.text()).not.toContain('reader@example.com');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('accepts case-insensitive media types with parameters', async () => {
    const response = await submitAccessRequest(
      request(valid, {
        'Content-Type': 'Application/JSON ; charset=utf-8',
      }),
    );

    expect(response.status).toBe(201);
  });
  it.each([
    { ...valid, name: '   ' },
    { ...valid, name: 'a'.repeat(101) },
    { ...valid, needs: '' },
    { ...valid, needs: 'a'.repeat(1001) },
    { ...valid, organization: 'a'.repeat(161) },
    { ...valid, organization: {} },
    { ...valid, needs: ['files'] },
    { email: 'x', consent: true },
    { email: 'a@b.com', consent: false },
    { email: ['a@b.com'], consent: true },
    null,
  ])('rejects malformed fields', async (value) => {
    expect((await submitAccessRequest(request(value))).status).toBe(422);
  });
  it('rejects foreign origins before parsing', async () => {
    expect(
      (await submitAccessRequest(request({}, { Origin: 'https://other.example' })))
        .status,
    ).toBe(403);
  });
  it('bounds bodies even without Content-Length', async () => {
    expect(
      (await submitAccessRequest(request({ email: 'a'.repeat(20000) }))).status,
    ).toBe(413);
  });
  it('distinguishes malformed JSON and unsupported content', async () => {
    const malformed = new Request('https://dropvia.fun/api/v1/access-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });

    expect((await submitAccessRequest(malformed)).status).toBe(400);
    expect(
      (await submitAccessRequest(request({}, { 'Content-Type': 'text/plain' }))).status,
    ).toBe(415);
  });
  it('accepts the native no-JavaScript form encoding', async () => {
    const form = new Request('https://dropvia.fun/', {
      method: 'POST',
      body: new URLSearchParams({
        email: 'reader@example.com',
        name: 'Алексей',
        organization: '',
        needs: 'Хранить файлы. '.repeat(70).slice(0, 1000),
        consent: 'on',
      }),
    });

    expect((await submitAccessRequest(form)).status).toBe(201);
  });
  it('allows personal requests without an organization', async () => {
    expect(
      (await submitAccessRequest(request({ ...valid, organization: undefined }))).status,
    ).toBe(201);
  });
});
