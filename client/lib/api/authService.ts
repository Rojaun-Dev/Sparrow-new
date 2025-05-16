import { apiClient } from './apiClient';
import { 
  AuthResponse, 
  LoginCredentials, 
  SignupData, 
  PasswordResetRequest, 
  PasswordResetConfirm,
  User
} from './types';

class AuthService {
  private baseUrl = '/auth';

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
        
        // Examine token content before saving
        try {
          // This is just for debugging
          const decoded = require('jwt-decode')(response.accessToken);
          console.log('Decoded token content:', decoded);
          console.log('User role in token:', decoded.role || (decoded.user && decoded.user.role));
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
        }
        
        apiClient.setToken(response.accessToken);
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
      const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/register`, userData);
      
      if (response.accessToken) {
        apiClient.setToken(response.accessToken);
      }
      
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }
  
  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      // Make the API call but don't wait for it to complete
      // This prevents issues if the server is unavailable
      apiClient.post<void>(`${this.baseUrl}/logout`).catch(err => {
      });
    } finally {
      // Critical step: Always remove token to ensure client-side logout works
      apiClient.removeToken();
      
      // Clear any other auth-related data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_data');
        localStorage.removeItem('user');
        
        // Force a delay to ensure localStorage updates are processed
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