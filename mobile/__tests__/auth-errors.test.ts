import { AuthService } from '@/lib/auth/session';
import { ApiClient } from '@/lib/api/client';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { LAST_WORKSPACE_PREF_KEY, SECURE_TOKEN_KEY, workspaceKey } from '@/lib/storage/keys';
import { fixtures, jsonResponse } from '@/testing/fixtures';

function restoreService(status: number, body: unknown) {
  const secure = createMemorySecureStore();
  const prefs = createMemoryPrefsStore();
  const client = new ApiClient({
    baseUrl: 'https://example.test/api/v1',
    fetchImpl: async () => jsonResponse(status, body),
    getToken: () => secure.getItem(SECURE_TOKEN_KEY),
  });
  return {
    secure,
    prefs,
    auth: new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' }),
  };
}

describe('auth HTTP distinctions', () => {
  it('401 on /me during restore expires and wipes', async () => {
    const { auth, secure } = restoreService(401, fixtures.error401);
    await secure.setItem(SECURE_TOKEN_KEY, '1|stale');
    const result = await auth.restore();
    expect(result.session.status).toBe('expired');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('403 on /me during restore does not logout or wipe', async () => {
    const { auth, secure } = restoreService(403, fixtures.error403);
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const result = await auth.restore();
    expect(result.session.status).toBe('unauthenticated');
    expect(result.error?.kind).toBe('forbidden');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('404 on /me during restore does not wipe the token', async () => {
    const { auth, secure } = restoreService(404, fixtures.error404);
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const result = await auth.restore();
    expect(result.session.status).toBe('unauthenticated');
    expect(result.error?.kind).toBe('not_found');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('422 on /me during restore does not wipe the token', async () => {
    const { auth, secure } = restoreService(422, fixtures.error422);
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const result = await auth.restore();
    expect(result.error?.kind).toBe('validation');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('429 on /me during restore keeps credentials and uses cache when present', async () => {
    const { auth, secure, prefs } = restoreService(429, fixtures.error429);
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    await prefs.setItem(LAST_WORKSPACE_PREF_KEY, '1');
    await prefs.setItem(workspaceKey(1, 'identity'), JSON.stringify(fixtures.meSuccess.data));
    const result = await auth.restore();
    expect(result.session.status).toBe('authenticated');
    expect(result.error?.kind).toBe('rate_limited');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('500 on /me during restore keeps credentials', async () => {
    const { auth, secure } = restoreService(500, fixtures.error500);
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const result = await auth.restore();
    expect(result.session.status).toBe('booting');
    expect(result.error?.kind).toBe('server');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('timeout on /me during restore keeps credentials', async () => {
    const secure = createMemorySecureStore();
    const prefs = createMemoryPrefsStore();
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      timeoutMs: 20,
      getToken: () => secure.getItem(SECURE_TOKEN_KEY),
      fetchImpl: () =>
        new Promise((_, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        }),
    });
    const auth = new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' });
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const result = await auth.restore();
    expect(result.error?.kind).toBe('timeout');
    expect(result.session.status).toBe('booting');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });
});
