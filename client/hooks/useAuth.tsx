'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LoginFormValues, RegistrationFormValues } from '@/lib/validations/auth';
import { authService } from '@/lib/api/authService';
import { User } from '@/lib/api/types';
import { API_BASE_URL } from '@/lib/api/apiClient';
import { apiClient } from '@/lib/api/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { getStoredParentWebsiteUrl, clearStoredParentWebsiteUrl, isIOSMobile } from '@/lib/utils/iframe-detection';

// Use the User type directly from types.ts
// export type User = UserProfile;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: LoginFormValues) => Promise<{ success: boolean; user: User | null }>;
  register: (data: RegistrationFormValues) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
  login: async () => ({ success: false, user: null }),
  register: async () => ({ success: false }),
  logout: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const queryClient = useQueryClient();

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
      
      // Ensure user role is properly set by explicitly creating a new user object
      // This guarantees that the role property is explicitly set and properly triggers re-renders
      const userWithRole = {
        ...result.user,
        role: result.user.role  // Explicitly set the role to ensure it's captured
      };
      
      // Set user from the response with properly established role
      setUser(userWithRole);
      setIsAuthenticated(true);
      console.log('Login successful, user role set to:', userWithRole.role);
      return { success: true, user: userWithRole };
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, user: null };
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
        companyId: data.companyId,
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
    console.log('useAuth: Logout initiated');
    
    try {
      // Call the auth service logout method to properly clean up server-side
      await authService.logout();
      
      // Clear user state from React context to update UI
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any cached data in localStorage
      if (typeof window !== 'undefined') {
        // Force clear token again for redundancy
        // This handles cases where the authService.logout() might have failed
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Clear React Query cache to prevent stale data from persisting
        // This is critical as React Query caches API results that might
        // contain user data or authorized content
        queryClient.clear();
        
        // Force clear cookies using raw document.cookie
        // This is a fallback mechanism in case js-cookie library didn't 
        // successfully clear the cookies
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        console.log('Logout complete, all tokens removed');
        console.log('Token in localStorage after logout:', localStorage.getItem('token'));
        
        // Check if this is an iOS user who was redirected from a parent website
        const parentUrl = getStoredParentWebsiteUrl();
        
        let redirectUrl: string;
        if (parentUrl && isIOSMobile()) {
          // iOS user came from parent website - redirect back to parent
          console.log('Redirecting iOS user back to parent website:', parentUrl);
          redirectUrl = parentUrl;
          // Clear the stored parent URL since we're redirecting back
          clearStoredParentWebsiteUrl();
        } else {
          // Normal users or iOS users who accessed app directly - redirect to app home
          const storedSlug = localStorage.getItem('companySlug');
          redirectUrl = storedSlug ? `/?company=${storedSlug}` : '/';
        }
        
        // Force a page reload to clear any memory cache or React state
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
      
    } catch (err) {
      // Even if there's an error, still remove tokens and reset auth state
      // This ensures users can logout even if the server-side logout fails
      setUser(null);
      setIsAuthenticated(false);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Force clear cookies
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Still clear cache on error
        queryClient.clear();
        
        // Check if this is an iOS user who was redirected from a parent website (error case)
        const parentUrl = getStoredParentWebsiteUrl();
        
        let redirectUrl2: string;
        if (parentUrl && isIOSMobile()) {
          // iOS user came from parent website - redirect back to parent
          console.log('Redirecting iOS user back to parent website (error case):', parentUrl);
          redirectUrl2 = parentUrl;
          // Clear the stored parent URL since we're redirecting back
          clearStoredParentWebsiteUrl();
        } else {
          // Normal users or iOS users who accessed app directly - redirect to app home
          const storedSlug2 = localStorage.getItem('companySlug');
          redirectUrl2 = storedSlug2 ? `/?company=${storedSlug2}` : '/';
        }
        
        // Force a page reload to clear any memory cache
        setTimeout(() => {
          window.location.href = redirectUrl2;
        }, 100);
      }
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