import type { AuthTokenResponse, MeResponse } from '@/types/api';
import { EMPTY_SESSION, type AuthSession, type AuthStatus } from '@/types/auth';
import { parsePermissions } from '@/lib/permissions/parse';
import { SECURE_SESSION_KEY, SECURE_TOKEN_KEY } from '@/lib/storage/keys';
import type { SecureCredentialStore } from '@/lib/storage/secure';
import { clearAllWorkspaceState } from '@/lib/workspace/isolation';
import type { NonSensitiveStore } from '@/lib/storage/prefs';
import type { ApiClient } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';

export type AuthServiceDeps = {
  client: ApiClient;
  secure: SecureCredentialStore;
  prefs: NonSensitiveStore;
  deviceName: string;
};

export function reduceAuthStatus(current: AuthStatus, event: AuthTransition): AuthStatus {
  switch (event) {
    case 'boot':
      return current === 'unknown' ? 'unknown' : current;
    case 'restore_missing':
      return 'unauthenticated';
    case 'restore_valid':
      return 'authenticated';
    case 'login_start':
      return 'authenticating';
    case 'login_success':
      return 'authenticated';
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

export type AuthTransition =
  | 'boot'
  | 'restore_missing'
  | 'restore_valid'
  | 'login_start'
  | 'login_success'
  | 'login_failure'
  | 'expired'
  | 'logout';

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async restore(): Promise<AuthSession> {
    const token = await this.deps.secure.getItem(SECURE_TOKEN_KEY);
    if (!token) {
      return { ...EMPTY_SESSION, status: 'unauthenticated' };
    }

    const me = await this.deps.client.call<MeResponse>('me');
    if (!me.ok) {
      if (me.error.kind === 'unauthorized') {
        await this.wipeLocal();
        return { ...EMPTY_SESSION, status: 'expired' };
      }
      const cached = await this.readCachedSession();
      if (cached) {
        return { ...cached, status: 'authenticated' };
      }
      return { ...EMPTY_SESSION, status: 'unauthenticated' };
    }

    const session = sessionFromMe(me.data);
    await this.persistSession(session);
    return session;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const tokenResult = await this.deps.client.call<AuthTokenResponse>(
      'authToken',
      {},
      {
        body: { email, password, device_name: this.deps.deviceName },
      },
    );

    if (!tokenResult.ok) {
      if (isApiError(tokenResult.error) && tokenResult.error.kind === 'unauthorized') {
        return { ...EMPTY_SESSION, status: 'unauthenticated' };
      }
      throw tokenResult.error;
    }

    await this.deps.secure.setItem(SECURE_TOKEN_KEY, tokenResult.data.data.token);

    const me = await this.deps.client.call<MeResponse>('me');
    if (!me.ok) {
      await this.wipeLocal();
      throw me.error;
    }

    const session = sessionFromMe(me.data);
    await this.persistSession(session);
    return session;
  }

  async logout(): Promise<AuthSession> {
    try {
      await this.deps.client.call('revokeToken');
    } catch {
      // Local wipe is authoritative even if revoke fails (offline / already expired).
    }
    await this.wipeLocal();
    return { ...EMPTY_SESSION, status: 'unauthenticated' };
  }

  async getToken(): Promise<string | null> {
    return this.deps.secure.getItem(SECURE_TOKEN_KEY);
  }

  private async persistSession(session: AuthSession): Promise<void> {
    await this.deps.secure.setItem(
      SECURE_SESSION_KEY,
      JSON.stringify({
        user: session.user,
        workspace: session.workspace,
        permissions: session.permissions,
      }),
    );
  }

  private async readCachedSession(): Promise<AuthSession | null> {
    const raw = await this.deps.secure.getItem(SECURE_SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Pick<AuthSession, 'user' | 'workspace' | 'permissions'>;
      return {
        status: 'authenticated',
        user: parsed.user,
        workspace: parsed.workspace,
        permissions: parsePermissions(parsed.permissions),
      };
    } catch {
      return null;
    }
  }

  private async wipeLocal(): Promise<void> {
    await this.deps.secure.clear([SECURE_TOKEN_KEY, SECURE_SESSION_KEY]);
    await clearAllWorkspaceState(this.deps.prefs);
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
