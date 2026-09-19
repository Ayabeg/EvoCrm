import { AuthService } from '@/lib/auth/session';
import { ApiClient } from '@/lib/api/client';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { LAST_WORKSPACE_PREF_KEY, SECURE_TOKEN_KEY, workspaceKey } from '@/lib/storage/keys';
import { fixtures, jsonResponse } from '@/testing/fixtures';

describe('SecureStore token isolation', () => {
  it('never writes the bearer token to prefs / AsyncStorage', async () => {
    const secure = createMemorySecureStore();
    const prefs = createMemoryPrefsStore();
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      fetchImpl: async (input) => {
        const url = String(input);
        if (url.endsWith('/auth/token')) {
          return jsonResponse(200, fixtures.authTokenSuccess);
        }
        return jsonResponse(200, fixtures.meSuccess);
      },
      getToken: () => secure.getItem(SECURE_TOKEN_KEY),
    });
    const auth = new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' });
    await auth.login('owner@clinic.dz', 'secret');

    const prefKeys = await prefs.getAllKeys();
    const prefValues = await Promise.all(prefKeys.map((key) => prefs.getItem(key)));
    expect(prefKeys.every((key) => !/token|sanctum|password|secret/i.test(key))).toBe(true);
    expect(prefValues.every((value) => !value?.includes('1|fixture-token-not-a-secret'))).toBe(true);
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
    expect(await prefs.getItem(LAST_WORKSPACE_PREF_KEY)).toBe('1');
    expect(await prefs.getItem(workspaceKey(1, 'identity'))).not.toContain('1|fixture');
  });
});
