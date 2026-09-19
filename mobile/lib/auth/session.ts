import type { AuthTokenResponse, MeResponse } from '@/types/api';
import {
  EMPTY_SESSION,
  type AuthSession,
  type AuthStatus,
  type LogoutResult,
  type SessionResult,
} from '@/types/auth';
import { parsePermissions } from '@/lib/permissions/parse';
import { SECURE_TOKEN_KEY } from '@/lib/storage/keys';
import type { SecureCredentialStore } from '@/lib/storage/secure';
import type { NonSensitiveStore } from '@/lib/storage/prefs';
import type { ApiClient } from '@/lib/api/client';
import { isApiError, type ApiError } from '@/lib/api/errors';
import {
  clearIdentityAndWorkspaceState,
  persistIdentitySnapshot,
  readIdentitySnapshot,
} from '@/lib/auth/identity-cache';

export type AuthServiceDeps = {
  client: ApiClient;
  secure: SecureCredentialStore;
  prefs: NonSensitiveStore;
  deviceName: string;
};

export type AuthTransition =
  | 'boot'
  | 'restore_missing'
  | 'restore_valid'
  | 'restore_offline_cached'
  | 'restore_offline_uncached'
  | 'login_start'
  | 'login_success'
  | 'login_failure'
  | 'expired'
  | 'logout';

export function reduceAuthStatus(current: AuthStatus, event: AuthTransition): AuthStatus {
  switch (event) {
    case 'boot':
      return current === 'unknown' || current === 'booting' ? 'booting' : current;
    case 'restore_missing':
      return 'unauthenticated';
    case 'restore_valid':
    case 'restore_offline_cached':
    case 'login_success':
      return 'authenticated';
    case 'restore_offline_uncached':
      return 'booting';
    case 'login_start':
      return 'authenticating';
    case 'login_failure':
      return 'unauthenticated';
    case 'expired':
      return 'expired';
    case 'logout':
      return 'unauthenticated';
    default:
      return current;
  }
}

export function isTransientNetworkError(error: ApiError): boolean {
  return (
    error.kind === 'offline' ||
    error.kind === 'timeout' ||
    error.kind === 'server' ||
    error.kind === 'parse_failure' ||
    error.kind === 'rate_limited'
  );
}

export class AuthService {
  private logoutInFlight = false;

  constructor(private readonly deps: AuthServiceDeps) {}

  async restore(): Promise<SessionResult> {
    const token = await this.deps.secure.getItem(SECURE_TOKEN_KEY);
    if (!token) {
      return { session: { ...EMPTY_SESSION, status: 'unauthenticated' }, error: null };
    }

    const me = await this.deps.client.call<MeResponse>('me');
    if (me.ok) {
      const session = sessionFromMe(me.data);
      await persistIdentitySnapshot(this.deps.prefs, session);
      return { session, error: null };
    }

    if (me.error.kind === 'unauthorized') {
      await this.wipeLocal();
      return { session: { ...EMPTY_SESSION, status: 'expired' }, error: me.error };
    }

    if (isTransientNetworkError(me.error)) {
      const cached = await readIdentitySnapshot(this.deps.prefs);
      if (cached) {
        return { session: { ...cached, status: 'authenticated' }, error: me.error };
      }
      return { session: { ...EMPTY_SESSION, status: 'booting' }, error: me.error };
    }

    return { session: { ...EMPTY_SESSION, status: 'unauthenticated' }, error: me.error };
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const tokenResult = await this.deps.client.call<AuthTokenResponse>(
      'authToken',
      {},
      {
        body: { email: email.trim(), password, device_name: this.deps.deviceName },
      },
    );

    if (!tokenResult.ok) {
      throw tokenResult.error;
    }

    await this.deps.secure.setItem(SECURE_TOKEN_KEY, tokenResult.data.data.token);

    const me = await this.deps.client.call<MeResponse>('me');
    if (!me.ok) {
      if (me.error.kind === 'unauthorized') {
        await this.wipeLocal();
      }
      throw me.error;
    }

    const session = sessionFromMe(me.data);
    await persistIdentitySnapshot(this.deps.prefs, session);
    return session;
  }

  async logout(): Promise<LogoutResult> {
    this.logoutInFlight = true;
    let remoteRevoked = false;
    try {
      const result = await this.deps.client.call('revokeToken');
      remoteRevoked = result.ok;
    } catch {
      remoteRevoked = false;
    } finally {
      await this.wipeLocal();
      this.logoutInFlight = false;
    }

    return {
      session: { ...EMPTY_SESSION, status: 'unauthenticated' },
      remoteRevoked,
    };
  }

  async abandonLocalSession(): Promise<AuthSession> {
    await this.wipeLocal();
    return { ...EMPTY_SESSION, status: 'unauthenticated' };
  }

  async expireFromUnauthorized(): Promise<AuthSession> {
    if (this.logoutInFlight) {
      return { ...EMPTY_SESSION, status: 'unauthenticated' };
    }
    await this.wipeLocal();
    return { ...EMPTY_SESSION, status: 'expired' };
  }

  async getToken(): Promise<string | null> {
    return this.deps.secure.getItem(SECURE_TOKEN_KEY);
  }

  private async wipeLocal(): Promise<void> {
    await this.deps.secure.clear([SECURE_TOKEN_KEY]);
    await clearIdentityAndWorkspaceState(this.deps.prefs);
  }
}

export function sessionFromMe(payload: MeResponse): AuthSession {
  return {
    status: 'authenticated',
    user: payload.data.user,
    workspace: payload.data.workspace,
    permissions: parsePermissions(payload.data.permissions),
  };
}

export function asApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }
  return {
    kind: 'unknown',
    status: null,
    message: 'Sign-in failed.',
    fieldErrors: {},
  };
}
