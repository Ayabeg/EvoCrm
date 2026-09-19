import { assertNonSensitiveKey, createMemoryPrefsStore } from '@/lib/storage/prefs';
import { createMemorySecureStore } from '@/lib/storage/secure';
import { SECURE_TOKEN_KEY } from '@/lib/storage/keys';

describe('storage separation', () => {
  it('keeps tokens in the secure store', async () => {
    const secure = createMemorySecureStore();
    await secure.setItem(SECURE_TOKEN_KEY, '1|fixture-token-not-a-secret');
    expect(await secure.getItem(SECURE_TOKEN_KEY)).toBe('1|fixture-token-not-a-secret');
  });

  it('rejects sensitive keys in non-secure prefs', async () => {
    const prefs = createMemoryPrefsStore();
    expect(() => assertNonSensitiveKey('auth.sanctum_token')).toThrow(/sensitive/);
    await expect(prefs.setItem('device_push_token', 'abc')).rejects.toThrow(/sensitive/);
    await prefs.setItem('last_tab', 'home');
    expect(await prefs.getItem('last_tab')).toBe('home');
  });
});
