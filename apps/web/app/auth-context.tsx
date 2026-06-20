'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000').trim();

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  userRole: string | null;
  initialized: boolean;
  setToken: (token: string | null) => void;
  setSession: (data: {
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    user?: { role: string } | undefined;
  }) => void;
  refreshAccessToken: () => Promise<string | null>;
  clearToken: () => void;
  /**
   * Resolves once the provider has hydrated the session from localStorage, then
   * returns the current token. Callers that fire on mount (e.g. data fetches in
   * page effects) must await this instead of reading `token` directly, otherwise
   * they race the hydration effect and see a spurious null token.
   */
  awaitToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Mirror of `token` readable synchronously from async callers (see awaitToken).
  const tokenRef = useRef<string | null>(null);

  // Resolves when the hydration effect below has run, so awaitToken can gate on it.
  const readyRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  if (readyRef.current === null) {
    let resolveReady: () => void = () => {};
    const promise = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    readyRef.current = { promise, resolve: resolveReady };
  }

  const roleFromToken = useCallback((value: string | null) => {
    if (!value) return null;
    try {
      const payload = JSON.parse(atob(value.split('.')[1] ?? '')) as { role?: string };
      return payload.role ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedRole = localStorage.getItem('user_role');
    if (storedToken) {
      tokenRef.current = storedToken;
      setTokenState(storedToken);
      if (storedToken === 'cookie-based' && storedRole) {
        setUserRole(storedRole);
      } else {
        setUserRole(roleFromToken(storedToken));
      }
    }
    if (storedRefreshToken) {
      setRefreshTokenState(storedRefreshToken);
    }
    setInitialized(true);
    readyRef.current?.resolve();
  }, [roleFromToken]);

  const setToken = (newToken: string | null) => {
    tokenRef.current = newToken;
    setTokenState(newToken);
    setUserRole(roleFromToken(newToken));
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  const setSession = (data: {
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    user?: { role: string } | undefined;
  }) => {
    setToken('cookie-based');
    if (data.user) {
      setUserRole(data.user.role);
      localStorage.setItem('user_role', data.user.role);
    }
    if (data.refreshToken) {
      setRefreshTokenState(data.refreshToken);
      localStorage.setItem('refresh_token', data.refreshToken);
    }
  };

  const clearToken = useCallback(() => {
    tokenRef.current = null;
    setTokenState(null);
    setRefreshTokenState(null);
    setUserRole(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const activeRefreshToken = refreshToken ?? localStorage.getItem('refresh_token');
    if (!activeRefreshToken) {
      clearToken();
      return null;
    }

    const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: activeRefreshToken }),
    });

    if (!response.ok) {
      clearToken();
      return null;
    }

    const data = (await response.json()) as {
      user?: { role: string };
      accessToken?: string;
      refreshToken?: string;
    };
    if (!data.user) {
      clearToken();
      return null;
    }

    tokenRef.current = 'cookie-based';
    setTokenState('cookie-based');
    setUserRole(data.user.role);
    localStorage.setItem('auth_token', 'cookie-based');
    localStorage.setItem('user_role', data.user.role);

    if (data.refreshToken) {
      setRefreshTokenState(data.refreshToken);
      localStorage.setItem('refresh_token', data.refreshToken);
    }

    // Restore the same-domain Vercel cookie so Next.js middleware keeps routing correctly
    if (data.accessToken && typeof document !== 'undefined') {
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900; SameSite=Lax; Secure`;
    }

    return data.accessToken ?? 'cookie-based';
  }, [clearToken, refreshToken]);

  const awaitToken = useCallback(async () => {
    await readyRef.current?.promise;
    return tokenRef.current;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        userRole,
        initialized,
        setToken,
        setSession,
        refreshAccessToken,
        clearToken,
        awaitToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
