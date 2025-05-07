'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type User = {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  signup: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  signup: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/auth/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsAuthenticated(!!data.user);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'));
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = () => {
    window.location.href = '/auth/login';
  };

  const logout = () => {
    window.location.href = '/auth/logout';
  };

  const signup = () => {
    window.location.href = '/auth/register';
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        error, 
        isAuthenticated,
        login,
        logout,
        signup
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 