import { apiClient } from './apiClient';
import { jwtDecode } from 'jwt-decode';
import { 
  AuthResponse, 
  LoginCredentials, 
  SignupData, 
  PasswordResetRequest, 
  PasswordResetConfirm,
  User
} from './types';
import { isIOSMobileInIframe, redirectIOSMobileToMainApp } from '@/lib/utils/iframe-detection';

class AuthService {
  private baseUrl = '/auth';

  // Detect iOS devices in iframe contexts
  private isIOSInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isIframe = window.parent !== window;
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    
    return isIOS && isIframe;
  }

  // Handle navigation for iOS iframe after successful login
  private handleIOSIframeNavigation(userRole: string): void {
    if (typeof window === 'undefined') return;
    
    // Determine the appropriate dashboard route based on user role
    let dashboardRoute = '/';
    switch (userRole) {
      case 'customer':
        dashboardRoute = '/customer';
        break;
      case 'admin_l1':
      case 'admin_l2':
        dashboardRoute = '/admin';
        break;
      case 'super_admin':
        dashboardRoute = '/superadmin';
        break;
      default:
        dashboardRoute = '/customer';
    }
    
    console.log(`iOS iframe navigation to: ${dashboardRoute}`);
    
    // NEW: For iOS mobile in iframe, redirect to main app instead of staying in iframe
    if (isIOSMobileInIframe()) {
      console.log('iOS mobile iframe detected - redirecting to main application');
      redirectIOSMobileToMainApp(dashboardRoute);
      return;
    }
    
    // For non-mobile iOS iframe (iPad), continue with existing logic
    // For iOS iframe, append token as query parameter for initial navigation
    const token = localStorage.getItem('token') || sessionStorage.getItem('ios_iframe_token');
    if (token) {
      const url = new URL(dashboardRoute, window.location.origin);
      url.searchParams.set('ios_token', token);
      dashboardRoute = url.pathname + url.search;
      console.log(`iOS iframe navigation with token to: ${dashboardRoute}`);
    }
    
    // Navigate to the appropriate dashboard
    if (window.location.pathname !== dashboardRoute.split('?')[0]) {
      window.location.href = dashboardRoute;
    }
  }

  /**
   * Log in a user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // ApiClient now automatically extracts data from success/message/data structure
      const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/login`, credentials);
      console.log('Login response:', response);
      
      // Store token for future API calls
      if (response.accessToken) {
        console.log('Setting token:', response.accessToken);
        
        // Examine token content before saving to ensure role is properly captured
        try {
          // Use ES6 import for better Safari compatibility
          const decoded = jwtDecode<{ role?: string; user?: { role: string } }>(response.accessToken);
          console.log('Decoded token content:', decoded);
          console.log('User role in token:', decoded.role || (decoded.user && decoded.user.role));
          
          // Ensure the user object has the role correctly set
          if (response.user && !response.user.role && decoded.role) {
            console.log('Setting missing role from token:', decoded.role);
            response.user.role = decoded.role as any;
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
        }
        
        // Pass the rememberMe flag to setToken to adjust cookie expiration
        apiClient.setToken(response.accessToken, !!credentials.rememberMe);
        
        // For iOS iframe contexts, ensure token is properly stored for mobile redirect
        if (this.isIOSInIframe()) {
          console.log('iOS iframe login - storing token for mobile redirect, role:', response.user.role);
          
          // Store token in sessionStorage specifically for iOS iframe mobile redirect
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('ios_iframe_token', response.accessToken);
            localStorage.setItem('token', response.accessToken); // Ensure it's in localStorage too
          }
          
          // Give the token storage time to complete before navigation
          setTimeout(() => {
            // Double-check token is available before navigation
            const token = localStorage.getItem('token') || sessionStorage.getItem('ios_iframe_token');
            if (token) {
              console.log('iOS iframe - token confirmed, proceeding with navigation');
              this.handleIOSIframeNavigation(response.user.role);
            } else {
              console.error('iOS iframe - token not found after login, retrying...');
              // Retry navigation after a longer delay
              setTimeout(() => {
                this.handleIOSIframeNavigation(response.user.role);
              }, 500);
            }
          }, 300); // Slightly longer delay to ensure storage completion
        }
      } else {
        console.error('No access token in response');
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Sign up a new user
   */
  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/signup`, userData);
      
      if (response.accessToken) {
        // Pass false for rememberMe since it's not specified during signup
        apiClient.setToken(response.accessToken, false);
      }
      
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }
  
  /**
   * Log out the current user
   * This function handles both server-side and client-side logout operations,
   * with multiple fallback mechanisms to ensure tokens are properly removed.
   */
  async logout(): Promise<void> {
    console.log('AuthService: Logout initiated');
    
    try {
      // Make the API call but don't wait for it to complete
      // This prevents issues if the server is unavailable
      // We use catch to handle failures silently to ensure client-side logout still works
      apiClient.post<void>(`${this.baseUrl}/logout`).catch(err => {
        console.warn('Logout API call failed, continuing with client-side logout', err);
      });
    } finally {
      // Critical step: Always remove token to ensure client-side logout works
      // This will be executed even if the API call fails
      apiClient.removeToken();
      
      // Clear any other auth-related data from localStorage
      if (typeof window !== 'undefined') {
        console.log('Clearing all auth data from localStorage');
        
        // Remove all possible auth tokens
        // We remove multiple token types to ensure backward compatibility
        // with any legacy token storage mechanisms
        localStorage.removeItem('auth_data');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Force cookie removal at document level for redundancy
        // This provides a backup if the apiClient.removeToken() method fails
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        
        // Double check token removal
        // This verification helps identify cases where token removal fails
        const tokenStillExists = localStorage.getItem('token');
        if (tokenStillExists) {
          console.error('WARNING: Token still exists in localStorage after logout!');
        } else {
          console.log('Token successfully removed from localStorage');
        }
      }
    }
  }
  
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    try {
      // ApiClient now correctly extracts the user object from the response
      const response = await apiClient.get<{user: User}>(`${this.baseUrl}/me`);
      return response.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
  
  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{user: User}>(`${this.baseUrl}/profile`, data);
    return response.user;
  }
  
  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/forgot-password`, data);
  }
  
  /**
   * Confirm password reset with token
   */
  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    return apiClient.post<void>(`${this.baseUrl}/reset-password`, data);
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  }
}

// Export as singleton
export const authService = new AuthService(); 