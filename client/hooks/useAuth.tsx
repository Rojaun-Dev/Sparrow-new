'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LoginFormValues, RegistrationFormValues } from '@/lib/validations/auth';
import { safeGetEnv } from '@/lib/env';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginFormValues) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegistrationFormValues) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  clearError: () => {},
});

// Get the API URL from environment variables
const API_URL = safeGetEnv('NEXT_PUBLIC_API_URL', 'http://localhost:4000/api');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const clearError = () => setError(null);

  // Get the stored token from local storage
  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Set token to local storage
  const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  };

  // Remove token from local storage
  const removeToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  // Fetch user data on initial load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getToken();
        
        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setIsAuthenticated(true);
        } else {
          // Token might be expired or invalid
          removeToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (data: LoginFormValues) => {
    setIsLoading(true);
    clearError();
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok && result.token) {
        // Store the token
        setToken(result.token);
        
        // Fetch user data after successful login
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${result.token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          setIsAuthenticated(true);
          return { success: true };
        }
      }
      
      setError(result.message || 'Login failed');
      return { success: false, message: result.message || 'Login failed' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegistrationFormValues) => {
    setIsLoading(true);
    clearError();
    
    try {
      // Transform the registration data to match backend expectations
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        trn: data.trn
      };
      
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return { success: true };
      }
      
      setError(result.message || 'Registration failed');
      return { success: false, message: result.message || 'Registration failed' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // No need to make a logout API call as JWT is stateless
      // Just remove the token and clear user state
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        error, 
        isAuthenticated,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 