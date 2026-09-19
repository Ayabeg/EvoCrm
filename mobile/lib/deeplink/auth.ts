import type { AuthStatus } from '@/types/auth';
import { canOpenAuthenticatedDeepLink } from '@/lib/auth/guards';
import { parseDeepLink } from '@/lib/deeplink/routes';

/** Every record deep link is behind the authenticated shell. No Deal UI when unauthenticated. */
export function shouldOpenDeepLink(status: AuthStatus, url: string): boolean {
  const route = parseDeepLink(url);
  if (!route) {
    return false;
  }
  return canOpenAuthenticatedDeepLink(status);
}
