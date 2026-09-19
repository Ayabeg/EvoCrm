import type { ApiError } from '@/lib/api/errors';
import type { ApiUser, ApiWorkspace } from '@/types/api';

/**
 * Product auth states (M07).
 * BOOTING / UNKNOWN / UNAUTHENTICATED / AUTHENTICATING / AUTHENTICATED / SESSION_EXPIRED
 * Stored as lowercase machine names. `expired` is SESSION_EXPIRED.
 */
export const AUTH_STATUSES = [
  'booting',
  'unknown',
  'unauthenticated',
  'authenticating',
  'authenticated',
  'expired',
] as const;

export type AuthStatus = (typeof AUTH_STATUSES)[number];

export type AuthSession = {
  status: AuthStatus;
  user: ApiUser | null;
  workspace: ApiWorkspace | null;
  permissions: string[];
};

export const EMPTY_SESSION: AuthSession = {
  status: 'unauthenticated',
  user: null,
  workspace: null,
  permissions: [],
};

export type SessionResult = {
  session: AuthSession;
  error: ApiError | null;
};

export type LogoutResult = {
  session: AuthSession;
  /** True only when DELETE /api/v1/auth/token returned 204. */
  remoteRevoked: boolean;
};

