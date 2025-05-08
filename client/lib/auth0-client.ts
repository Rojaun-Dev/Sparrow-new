import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * Hook for accessing authentication state in client components
 * This ensures proper lazy loading of authentication state
 */
export function useAuth() {
  const { user, error, isLoading } = useUser();
  
  return {
    user,
    error,
    isLoading,
    isAuthenticated: !!user && !error && !isLoading,
  };
}

/**
 * Get login URL with proper configuration
 */
export function getLoginUrl(returnTo?: string) {
  const baseUrl = '/api/auth/login';
  if (returnTo) {
    return `${baseUrl}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return baseUrl;
}

/**
 * Get logout URL with proper configuration
 */
export function getLogoutUrl(returnTo?: string) {
  const baseUrl = '/api/auth/logout';
  if (returnTo) {
    return `${baseUrl}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return baseUrl;
} 