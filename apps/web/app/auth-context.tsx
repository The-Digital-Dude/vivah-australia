'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userRole: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  function roleFromToken(value: string | null) {
    if (!value) return null;
    try {
      const payload = JSON.parse(atob(value.split('.')[1] ?? '')) as { role?: string };
      return payload.role ?? null;
    } catch {
      return null;
    }
  }

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setTokenState(storedToken);
      setUserRole(roleFromToken(storedToken));
    }
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    setUserRole(roleFromToken(newToken));
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  const clearToken = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, userRole, setToken, clearToken }}>
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
