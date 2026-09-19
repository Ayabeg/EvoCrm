import { ApiClient } from '@/lib/api/client';
import { AuthService } from '@/lib/auth/session';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { SECURE_TOKEN_KEY } from '@/lib/storage/keys';
import { fixtures, jsonResponse } from '@/testing/fixtures';

describe('centralized 401', () => {
  it('notifies the handler on authenticated 401 and expires the session', async () => {
    const secure = createMemorySecureStore();
    const prefs = createMemoryPrefsStore();
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    const handler = jest.fn();
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      fetchImpl: async () => jsonResponse(401, fixtures.error401),
      getToken: () => secure.getItem(SECURE_TOKEN_KEY),
      onUnauthorized: handler,
    });
    const auth = new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' });

    const result = await client.call('contactsIndex');
    expect(result.ok).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
    const expired = await auth.expireFromUnauthorized();
    expect(expired.status).toBe('expired');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBeNull();
  });

  it('does not notify on POST /auth/token because that route is unauthenticated', async () => {
    const handler = jest.fn();
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      fetchImpl: async () => jsonResponse(401, fixtures.error401),
      onUnauthorized: handler,
    });
    await client.call('authToken', {}, { body: { email: 'a@b.c', password: 'x', device_name: 't' } });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not treat 403 as a session expiry', async () => {
    const handler = jest.fn();
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      fetchImpl: async () => jsonResponse(403, fixtures.error403),
      getToken: () => '1|fixture-token-not-a-secret',
      onUnauthorized: handler,
    });
    const result = await client.call('contactsStore', {}, { body: { first_name: 'Blocked' } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('forbidden');
    }
    expect(handler).not.toHaveBeenCalled();
  });
});
