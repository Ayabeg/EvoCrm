import type { AuthStatus } from '@/types/auth';

export function isBootingStatus(status: AuthStatus): boolean {
  return status === 'booting' || status === 'unknown';
}

export function isAuthenticatedStatus(status: AuthStatus): boolean {
  return status === 'authenticated';
}

/** Protected app + record deep links. Booting must not flash login or tabs. */
export function canAccessProtectedApp(status: AuthStatus): boolean {
  return status === 'authenticated';
}

/** Login / expired chrome. Never while bootstrap is unresolved. */
export function canAccessAuthScreens(status: AuthStatus): boolean {
  return !isBootingStatus(status) && status !== 'authenticated';
}

/** Deep links never open Deal/CRM chrome for unauthenticated or booting sessions. */
export function canOpenAuthenticatedDeepLink(status: AuthStatus): boolean {
  return status === 'authenticated';
}
