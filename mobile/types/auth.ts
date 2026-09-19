import type { ApiUser, ApiWorkspace } from '@/types/api';

export const AUTH_STATUSES = [
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
