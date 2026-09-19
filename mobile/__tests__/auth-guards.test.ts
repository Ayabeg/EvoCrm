import {
  canAccessAuthScreens,
  canAccessProtectedApp,
  canOpenAuthenticatedDeepLink,
  isBootingStatus,
} from '@/lib/auth/guards';
import { shouldOpenDeepLink } from '@/lib/deeplink/auth';

describe('routing guards', () => {
  it('keeps bootstrap off login and off the authenticated shell', () => {
    expect(isBootingStatus('booting')).toBe(true);
    expect(isBootingStatus('unknown')).toBe(true);
    expect(canAccessProtectedApp('booting')).toBe(false);
    expect(canAccessAuthScreens('booting')).toBe(false);
    expect(canAccessAuthScreens('unknown')).toBe(false);
  });

  it('sends unauthenticated and expired users to auth, not tabs', () => {
    expect(canAccessAuthScreens('unauthenticated')).toBe(true);
    expect(canAccessAuthScreens('expired')).toBe(true);
    expect(canAccessAuthScreens('authenticating')).toBe(true);
    expect(canAccessProtectedApp('unauthenticated')).toBe(false);
    expect(canAccessProtectedApp('expired')).toBe(false);
  });

  it('opens the shell only when authenticated', () => {
    expect(canAccessProtectedApp('authenticated')).toBe(true);
    expect(canAccessAuthScreens('authenticated')).toBe(false);
  });

  it('blocks Deal and other record deep links until authenticated', () => {
    expect(canOpenAuthenticatedDeepLink('booting')).toBe(false);
    expect(canOpenAuthenticatedDeepLink('unauthenticated')).toBe(false);
    expect(canOpenAuthenticatedDeepLink('expired')).toBe(false);
    expect(shouldOpenDeepLink('unauthenticated', 'evocrm://deal/44')).toBe(false);
    expect(shouldOpenDeepLink('booting', 'evocrm://deal/44')).toBe(false);
    expect(shouldOpenDeepLink('authenticated', 'evocrm://deal/44')).toBe(true);
    expect(shouldOpenDeepLink('authenticated', 'evocrm://not-a-route')).toBe(false);
  });
});
