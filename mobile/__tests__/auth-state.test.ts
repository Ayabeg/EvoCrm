import { AuthService, reduceAuthStatus } from '@/lib/auth/session';
import { ApiClient } from '@/lib/api/client';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { LAST_WORKSPACE_PREF_KEY, SECURE_TOKEN_KEY, workspaceKey } from '@/lib/storage/keys';
import { emptyResponse, fixtures, jsonResponse } from '@/testing/fixtures';

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
    prefs,
    auth: new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' }),
  };
}

describe('auth state machine', () => {
  it('covers M07 statuses including boot and session expired', () => {
    expect(reduceAuthStatus('unknown', 'boot')).toBe('booting');
    expect(reduceAuthStatus('booting', 'restore_missing')).toBe('unauthenticated');
    expect(reduceAuthStatus('unauthenticated', 'login_start')).toBe('authenticating');
    expect(reduceAuthStatus('authenticating', 'login_success')).toBe('authenticated');
    expect(reduceAuthStatus('authenticated', 'expired')).toBe('expired');
    expect(reduceAuthStatus('expired', 'logout')).toBe('unauthenticated');
    expect(reduceAuthStatus('booting', 'restore_offline_uncached')).toBe('booting');
    expect(reduceAuthStatus('booting', 'restore_offline_cached')).toBe('authenticated');
  });

  it('logs in with token + me fixtures and stores only the token in SecureStore', async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/token')) {
        return jsonResponse(200, fixtures.authTokenSuccess);
      }
      if (url.endsWith('/me')) {
        return jsonResponse(200, fixtures.meSuccess);
      }
      throw new Error(`unexpected ${url}`);
    });
    const { auth, secure, prefs } = service(fetchImpl as unknown as typeof fetch);

    const session = await auth.login('owner@clinic.dz', 'secret');
    expect(session.status).toBe('authenticated');
    expect(session.workspace?.id).toBe(1);
    expect(session.permissions).toEqual(['crm.view', 'crm.edit', 'desk.manage']);
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
    expect(await prefs.getItem(LAST_WORKSPACE_PREF_KEY)).toBe('1');
    expect(await prefs.getItem(workspaceKey(1, 'identity'))).toContain('owner@clinic.dz');
  });

  it('does not enter the shell when the token succeeds but /me fails', async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/token')) {
        return jsonResponse(200, fixtures.authTokenSuccess);
      }
      return jsonResponse(500, fixtures.error500);
    });
    const { auth, secure } = service(fetchImpl as unknown as typeof fetch);

    await expect(auth.login('owner@clinic.dz', 'secret')).rejects.toMatchObject({ kind: 'server' });
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('marks restore as expired when /me returns 401 and clears the token', async () => {
    const { auth, secure } = service(async () => jsonResponse(401, fixtures.error401));
    await secure.setItem(SECURE_TOKEN_KEY, '1|stale');
    const result = await auth.restore();
    expect(result.session.status).toBe('expired');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('keeps a valid token when restore is offline and a workspace snapshot exists', async () => {
    const secure = createMemorySecureStore();
    const prefs = createMemoryPrefsStore();
    const offlineClient = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      isOnline: () => false,
      getToken: () => secure.getItem(SECURE_TOKEN_KEY),
    });
    const offlineAuth = new AuthService({
      client: offlineClient,
      secure,
      prefs,
      deviceName: 'EvoCRM Test',
    });

    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    await prefs.setItem(LAST_WORKSPACE_PREF_KEY, '1');
    await prefs.setItem(workspaceKey(1, 'identity'), JSON.stringify(fixtures.meSuccess.data));

    const result = await offlineAuth.restore();
    expect(result.session.status).toBe('authenticated');
    expect(result.session.workspace?.id).toBe(1);
    expect(result.error?.kind).toBe('offline');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('does not treat offline restore without a snapshot as an invalid session', async () => {
    const secure = createMemorySecureStore();
    const prefs = createMemoryPrefsStore();
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      isOnline: () => false,
      getToken: () => secure.getItem(SECURE_TOKEN_KEY),
    });
    const auth = new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' });
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');

    const result = await auth.restore();
    expect(result.session.status).toBe('booting');
    expect(result.error?.kind).toBe('offline');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('logout clears credentials even if revoke is 204', async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/token')) {
        return emptyResponse(204);
      }
      return jsonResponse(200, fixtures.meSuccess);
    });
    const { auth, secure, prefs } = service(fetchImpl as unknown as typeof fetch);
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    await prefs.setItem(LAST_WORKSPACE_PREF_KEY, '1');
    await prefs.setItem(workspaceKey(1, 'identity'), JSON.stringify(fixtures.meSuccess.data));

    const result = await auth.logout();
    expect(result.session.status).toBe('unauthenticated');
    expect(result.remoteRevoked).toBe(true);
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
    expect(await prefs.getItem(LAST_WORKSPACE_PREF_KEY)).toBeNull();
    expect(await prefs.getItem(workspaceKey(1, 'identity'))).toBeNull();
  });
});
