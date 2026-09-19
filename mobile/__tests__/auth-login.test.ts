import { AuthService } from '@/lib/auth/session';
import { ApiClient } from '@/lib/api/client';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { SECURE_TOKEN_KEY } from '@/lib/storage/keys';
import { hasLoginFieldErrors, validateLoginFields } from '@/lib/auth/login-validation';
import { fixtures, jsonResponse } from '@/testing/fixtures';

function service(fetchImpl: typeof fetch) {
  const secure = createMemorySecureStore();
  const prefs = createMemoryPrefsStore();
  const client = new ApiClient({
    baseUrl: 'https://example.test/api/v1',
    fetchImpl,
    getToken: () => secure.getItem(SECURE_TOKEN_KEY),
  });
  return {
    secure,
    auth: new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' }),
  };
}

describe('login contract', () => {
  it('requires email and password only on the client', () => {
    expect(hasLoginFieldErrors(validateLoginFields('', ''))).toBe(true);
    expect(validateLoginFields('', 'secret').email).toBe('Email is required.');
    expect(validateLoginFields('not-an-email', 'secret').email).toBe('Enter a valid email address.');
    expect(validateLoginFields('owner@clinic.dz', '').password).toBe('Password is required.');
    expect(hasLoginFieldErrors(validateLoginFields('owner@clinic.dz', 'secret'))).toBe(false);
  });

  it('maps incorrect credentials as 422 validation and stores no token', async () => {
    const { auth, secure } = service(async () => jsonResponse(422, fixtures.error422));
    await expect(auth.login('owner@clinic.dz', 'wrong')).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: { email: ['The provided credentials are incorrect.'] },
    });
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('maps unverified email as 403 and does not log out a missing session', async () => {
    const { auth, secure } = service(async () => jsonResponse(403, fixtures.error403Unverified));
    await expect(auth.login('owner@clinic.dz', 'secret')).rejects.toMatchObject({
      kind: 'forbidden',
      message: 'Email is not verified.',
    });
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('maps 429 without treating it as an expired session', async () => {
    const { auth, secure } = service(async () => jsonResponse(429, fixtures.error429));
    await expect(auth.login('owner@clinic.dz', 'secret')).rejects.toMatchObject({
      kind: 'rate_limited',
    });
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('maps timeout without destroying a later stored token path', async () => {
    const { auth, secure } = service(
      () =>
        new Promise((_, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        }),
    );
    await expect(auth.login('owner@clinic.dz', 'secret')).rejects.toMatchObject({ kind: 'timeout' });
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('wipes a just-issued token when /me returns 401', async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/token')) {
        return jsonResponse(200, fixtures.authTokenSuccess);
      }
      return jsonResponse(401, fixtures.error401);
    });
    const { auth, secure } = service(fetchImpl as unknown as typeof fetch);
    await expect(auth.login('owner@clinic.dz', 'secret')).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('keeps the token and stays out of the shell when /me returns 403', async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/token')) {
        return jsonResponse(200, fixtures.authTokenSuccess);
      }
      return jsonResponse(403, fixtures.error403);
    });
    const { auth, secure } = service(fetchImpl as unknown as typeof fetch);
    await expect(auth.login('owner@clinic.dz', 'secret')).rejects.toMatchObject({
      kind: 'forbidden',
    });
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });
});
