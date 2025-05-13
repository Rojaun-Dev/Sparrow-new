'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LoginFormValues, RegistrationFormValues } from '@/lib/validations/auth';
import { authService, UserProfile } from '@/lib/api/authService';
import { API_BASE_URL } from '@/lib/api/apiClient';
import { apiClient } from '@/lib/api/apiClient';

export type User = UserProfile;

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const clearError = () => setError(null);

  // Fetch user data on initial load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Check if a token exists
        if (!authService.isAuthenticated()) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Get user profile using auth service
        const userData = await authService.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        // Token might be expired or invalid
        apiClient.removeToken();
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
      const result = await authService.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });
      
      // Set user from the response
      setUser(result.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed';
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
      await authService.signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword || data.password,
        agreeToTerms: true,
        // Map any additional fields as needed
      });
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authService.logout();
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