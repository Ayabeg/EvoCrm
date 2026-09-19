import { AuthService } from '@/lib/auth/session';
import { ApiClient } from '@/lib/api/client';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { LAST_WORKSPACE_PREF_KEY, SECURE_TOKEN_KEY, workspaceKey } from '@/lib/storage/keys';
import { fixtures, jsonResponse } from '@/testing/fixtures';

function harness(fetchImpl: typeof fetch, extras: { online?: boolean } = {}) {
  const secure = createMemorySecureStore();
  const prefs = createMemoryPrefsStore();
  const client = new ApiClient({
    baseUrl: 'https://example.test/api/v1',
    fetchImpl,
    isOnline: () => extras.online ?? true,
    getToken: () => secure.getItem(SECURE_TOKEN_KEY),
  });
  return {
    secure,
    prefs,
    auth: new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' }),
  };
}

describe('logout', () => {
  it('still signs out locally when revoke is offline', async () => {
    const { auth, secure, prefs } = harness(jest.fn() as unknown as typeof fetch, { online: false });
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    await prefs.setItem(LAST_WORKSPACE_PREF_KEY, '1');
    await prefs.setItem(workspaceKey(1, 'contacts'), 'cached');

    const result = await auth.logout();
    expect(result.remoteRevoked).toBe(false);
    expect(result.session.status).toBe('unauthenticated');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
    expect(await prefs.getItem(workspaceKey(1, 'contacts'))).toBeNull();
  });

  it('does not claim remote revoke when DELETE returns 500', async () => {
    const { auth, secure } = harness(async () => jsonResponse(500, fixtures.error500));
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const result = await auth.logout();
    expect(result.remoteRevoked).toBe(false);
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('does not claim remote revoke when DELETE returns 401', async () => {
    const { auth, secure } = harness(async () => jsonResponse(401, fixtures.error401));
    await secure.setItem(SECURE_TOKEN_KEY, '1|stale');
    const result = await auth.logout();
    expect(result.remoteRevoked).toBe(false);
    expect(result.session.status).toBe('unauthenticated');
  });
});
