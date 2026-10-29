import { describe, expect, it } from 'vitest';
import { submitSignIn } from '@features/sign-in/api/submit.server';

function request(value: unknown, headers: Record<string, string> = {}) {
  return new Request('https://dropvia.fun/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(value),
  });
}

describe('sign-in submission boundary', () => {
  it('validates required fields and password length from 8 to 1024 characters', async () => {
    for (const input of [
      null,
      {},
      { email: 'bad', password: 'password' },
      { email: 'a@example.com', password: '' },
      { email: 'a@example.com', password: 'x'.repeat(1025) },
    ]) {
      expect((await submitSignIn(request(input))).status).toBe(422);
    }

    for (const password of [' ', '1234567']) {
      expect(await submitSignIn(request({ email: 'a@example.com', password }))).toEqual({
        status: 422,
        error: 'invalid',
        fieldErrors: { password: 'passwordTooShort' },
      });
    }

    for (const password of ['12345678', 'x'.repeat(1024)]) {
      expect(await submitSignIn(request({ email: 'a@example.com', password }))).toEqual({
        status: 400,
        error: 'clientNotFound',
      });
    }
  });
  it('returns field-specific validation errors without reflecting submitted values', async () => {
    expect(await submitSignIn(request({ email: '', password: '' }))).toEqual({
      status: 422,
      error: 'invalid',
      fieldErrors: { email: 'emailRequired', password: 'passwordRequired' },
    });
    expect(
      await submitSignIn(request({ email: 'bad', password: 'x'.repeat(1025) })),
    ).toEqual({
      status: 422,
      error: 'invalid',
      fieldErrors: { email: 'emailInvalid', password: 'passwordTooLong' },
    });
  });
  it('does not claim successful authentication or reflect credentials', async () => {
    const email = 'boundary-test@example.com';
    const password = 'unit-test-password';
    const result = await submitSignIn(request({ email, password }));

    expect(result).toEqual({ status: 400, error: 'clientNotFound' });
    expect(JSON.stringify(result)).not.toContain(email);
    expect(JSON.stringify(result)).not.toContain(password);
  });
  it('rejects cross-site submissions, unsupported methods and large bodies', async () => {
    expect(
      (await submitSignIn(request({}, { Origin: 'https://foreign.example' }))).status,
    ).toBe(403);
    expect((await submitSignIn(new Request('https://dropvia.fun/sign-in'))).status).toBe(
      405,
    );
    expect((await submitSignIn(request({ password: 'x'.repeat(20_000) }))).status).toBe(
      413,
    );
    const unsupported = new Request('https://dropvia.fun/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'text',
    });

    expect((await submitSignIn(unsupported)).status).toBe(415);
  });
  it('supports the native form encoding and rejects malformed JSON', async () => {
    const form = new Request('https://dropvia.fun/sign-in', {
      method: 'POST',
      body: new URLSearchParams({ email: 'a@example.com', password: 'unit-test' }),
    });

    expect((await submitSignIn(form)).status).toBe(400);
    const malformed = new Request('https://dropvia.fun/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });

    expect((await submitSignIn(malformed)).status).toBe(400);
  });
});
