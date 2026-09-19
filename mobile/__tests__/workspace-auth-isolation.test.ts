import { AuthService } from '@/lib/auth/session';
import { ApiClient } from '@/lib/api/client';
import { createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { LAST_WORKSPACE_PREF_KEY, SECURE_TOKEN_KEY, workspaceKey } from '@/lib/storage/keys';
import { assertNoCrossWorkspaceLeak } from '@/lib/workspace/isolation';
import { emptyResponse, fixtures, jsonResponse } from '@/testing/fixtures';

const workspaceTwoMe = {
  data: {
    user: { id: 2, name: 'Other', email: 'other@clinic.dz', role: 'member' },
    workspace: { id: 2, name: 'Other Clinic', slug: 'other-clinic', timezone: 'UTC' },
    permissions: ['crm.view'],
  },
};

describe('workspace isolation on auth', () => {
  it('clears workspace A caches when /me later returns workspace B', async () => {
    const secure = createMemorySecureStore();
    const prefs = createMemoryPrefsStore();
    let mePayload: unknown = fixtures.meSuccess;
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      fetchImpl: async (input) => {
        const url = String(input);
        if (url.endsWith('/auth/token')) {
          return jsonResponse(200, fixtures.authTokenSuccess);
        }
        if (url.endsWith('/me')) {
          return jsonResponse(200, mePayload);
        }
        return emptyResponse(204);
      },
      getToken: () => secure.getItem(SECURE_TOKEN_KEY),
    });
    const auth = new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' });

    await auth.login('owner@clinic.dz', 'secret');
    await prefs.setItem(workspaceKey(1, 'contacts'), 'workspace-a');
    expect(await prefs.getItem(workspaceKey(1, 'contacts'))).toBe('workspace-a');

    mePayload = workspaceTwoMe;
    await auth.restore();

    expect(await prefs.getItem(LAST_WORKSPACE_PREF_KEY)).toBe('2');
    expect(await prefs.getItem(workspaceKey(1, 'contacts'))).toBeNull();
    expect(await prefs.getItem(workspaceKey(1, 'identity'))).toBeNull();
    expect(await prefs.getItem(workspaceKey(2, 'identity'))).toContain('Other Clinic');
    assertNoCrossWorkspaceLeak(await prefs.getAllKeys(), 2);
  });

  it('logout wipes every ws:{id}: key', async () => {
    const secure = createMemorySecureStore();
    const prefs = createMemoryPrefsStore();
    const client = new ApiClient({
      baseUrl: 'https://example.test/api/v1',
      fetchImpl: async () => emptyResponse(204),
      getToken: () => secure.getItem(SECURE_TOKEN_KEY),
    });
    const auth = new AuthService({ client, secure, prefs, deviceName: 'EvoCRM Test' });
    await prefs.setItem(workspaceKey(1, 'contacts'), 'a');
    await prefs.setItem(workspaceKey(9, 'inbox'), 'b');
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    await auth.logout();
    expect(await prefs.getAllKeys()).toEqual([]);
  });
});
