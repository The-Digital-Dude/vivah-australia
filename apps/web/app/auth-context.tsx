'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  userRole: string | null;
  initialized: boolean;
  setToken: (token: string | null) => void;
  setSession: (tokens: { accessToken: string; refreshToken?: string | undefined }) => void;
  refreshAccessToken: () => Promise<string | null>;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

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
    if (storedToken) {
      setTokenState(storedToken);
      setUserRole(roleFromToken(storedToken));
    }
    if (storedRefreshToken) {
      setRefreshTokenState(storedRefreshToken);
    }
    setInitialized(true);
  }, [roleFromToken]);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    setUserRole(roleFromToken(newToken));
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  const setSession = (tokens: { accessToken: string; refreshToken?: string | undefined }) => {
    setToken(tokens.accessToken);
    if (tokens.refreshToken) {
      setRefreshTokenState(tokens.refreshToken);
      localStorage.setItem('refresh_token', tokens.refreshToken);
    }
  };

  const clearToken = useCallback(() => {
    setTokenState(null);
    setRefreshTokenState(null);
    setUserRole(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
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
      body: JSON.stringify({ refreshToken: activeRefreshToken }),
    });

    if (!response.ok) {
      clearToken();
      return null;
    }

    const data = (await response.json()) as { accessToken?: string; refreshToken?: string };
    if (!data.accessToken || !data.refreshToken) {
      clearToken();
      return null;
    }

    setTokenState(data.accessToken);
    setRefreshTokenState(data.refreshToken);
    setUserRole(roleFromToken(data.accessToken));
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    return data.accessToken;
  }, [clearToken, refreshToken, roleFromToken]);

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
