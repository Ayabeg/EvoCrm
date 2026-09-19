import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { apiClient, authService } from '@/services/api';
import { EMPTY_SESSION, type AuthSession, type AuthStatus, type LogoutResult } from '@/types/auth';
import type { ApiError } from '@/lib/api/errors';
import { asApiError } from '@/lib/auth/session';
import { can } from '@/lib/permissions/parse';

type AuthContextValue = {
  session: AuthSession;
  status: AuthStatus;
  lastError: ApiError | null;
  lastLogoutRemoteRevoked: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<LogoutResult>;
  retryRestore: () => Promise<void>;
  abandonSession: () => Promise<void>;
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>({ ...EMPTY_SESSION, status: 'booting' });
  const [lastError, setLastError] = useState<ApiError | null>(null);
  const [lastLogoutRemoteRevoked, setLastLogoutRemoteRevoked] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authService.restore().then((result) => {
      if (!cancelled) {
        setSession(result.session);
        setLastError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return apiClient.setOnUnauthorized(async () => {
      const next = await authService.expireFromUnauthorized();
      setSession(next);
      setLastError({
        kind: 'unauthorized',
        status: 401,
        message: 'Your session is no longer valid.',
        fieldErrors: {},
      });
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLastError(null);
    setLastLogoutRemoteRevoked(null);
    setSession((current) => ({ ...current, status: 'authenticating' }));
    try {
      const next = await authService.login(email, password);
      setSession(next);
    } catch (error) {
      const mapped = asApiError(error);
      setLastError(mapped);
      setSession({ ...EMPTY_SESSION, status: 'unauthenticated' });
    }
  }, []);

  const logout = useCallback(async () => {
    const result = await authService.logout();
    setLastError(null);
    setLastLogoutRemoteRevoked(result.remoteRevoked);
    setSession(result.session);
    return result;
  }, []);

  const retryRestore = useCallback(async () => {
    setSession((current) => ({ ...current, status: 'booting' }));
    const result = await authService.restore();
    setSession(result.session);
    setLastError(result.error);
  }, []);

  const abandonSession = useCallback(async () => {
    const next = await authService.abandonLocalSession();
    setLastError(null);
    setLastLogoutRemoteRevoked(null);
    setSession(next);
  }, []);

  const canPermission = useCallback(
    (permission: string) => session.status === 'authenticated' && can(session.permissions, permission),
    [session.permissions, session.status],
  );

  const value = useMemo(
    () => ({
      session,
      status: session.status,
      lastError,
      lastLogoutRemoteRevoked,
      login,
      logout,
      retryRestore,
      abandonSession,
      can: canPermission,
    }),
    [session, lastError, lastLogoutRemoteRevoked, login, logout, retryRestore, abandonSession, canPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
