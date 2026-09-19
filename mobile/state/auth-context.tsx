import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { authService } from '@/services/api';
import { EMPTY_SESSION, type AuthSession, type AuthStatus } from '@/types/auth';
import type { ApiError } from '@/lib/api/errors';
import { isApiError } from '@/lib/api/errors';

type AuthContextValue = {
  session: AuthSession;
  status: AuthStatus;
  lastError: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>({ ...EMPTY_SESSION, status: 'unknown' });
  const [lastError, setLastError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authService.restore().then((next) => {
      if (!cancelled) {
        setSession(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLastError(null);
    setSession((current) => ({ ...current, status: 'authenticating' }));
    try {
      const next = await authService.login(email, password);
      setSession(next);
    } catch (error) {
      const mapped = isApiError(error)
        ? error
        : { kind: 'unknown' as const, status: null, message: 'Sign-in failed.', fieldErrors: {} };
      setLastError(mapped);
      setSession({ ...EMPTY_SESSION, status: 'unauthenticated' });
    }
  }, []);

  const logout = useCallback(async () => {
    const next = await authService.logout();
    setLastError(null);
    setSession(next);
  }, []);

  const value = useMemo(
    () => ({
      session,
      status: session.status,
      lastError,
      login,
      logout,
    }),
    [session, lastError, login, logout],
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
