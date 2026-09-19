import { AuthService, reduceAuthStatus } from '@/lib/auth/session';
import { ApiClient } from '@/lib/api/client';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { SECURE_TOKEN_KEY } from '@/lib/storage/keys';
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
    auth: new AuthService({ client, secure, prefs, deviceName: 'test' }),
  };
}

describe('auth state machine', () => {
  it('covers the foundation statuses', () => {
    expect(reduceAuthStatus('unknown', 'restore_missing')).toBe('unauthenticated');
    expect(reduceAuthStatus('unauthenticated', 'login_start')).toBe('authenticating');
    expect(reduceAuthStatus('authenticating', 'login_success')).toBe('authenticated');
    expect(reduceAuthStatus('authenticated', 'expired')).toBe('expired');
    expect(reduceAuthStatus('expired', 'logout')).toBe('unauthenticated');
  });

  it('logs in with token + me fixtures and stores the token in secure storage', async () => {
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
    const { auth, secure } = service(fetchImpl as unknown as typeof fetch);

    const session = await auth.login('owner@clinic.dz', 'secret');
    expect(session.status).toBe('authenticated');
    expect(session.workspace?.id).toBe(1);
    expect(session.permissions).toEqual(['crm.view', 'crm.edit', 'desk.manage']);
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('marks restore as expired when /me returns 401', async () => {
    const { auth, secure } = service(async () => jsonResponse(401, fixtures.error401));
    await secure.setItem(SECURE_TOKEN_KEY, '1|stale');
    const session = await auth.restore();
    expect(session.status).toBe('expired');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('logout clears credentials even if revoke is 204', async () => {
    const fetchImpl = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/token') && !url.includes('?')) {
        return emptyResponse(204);
      }
      return jsonResponse(200, fixtures.meSuccess);
    });
    const { auth, secure } = service(fetchImpl as unknown as typeof fetch);
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const session = await auth.logout();
    expect(session.status).toBe('unauthenticated');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });
});
