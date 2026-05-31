'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setTokenState(storedToken);
    }
  }, []);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  const clearToken = () => {
    setToken(null);
  };

  if (!isClient) {
    return children;
  }

  return (
    <AuthContext.Provider value={{ token, setToken, clearToken }}>
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
