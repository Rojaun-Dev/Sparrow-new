import { apiClient } from './apiClient';

// Types for auth operations
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  agreeToTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

class AuthService {
  private baseUrl = '/auth';

  /**
   * Log in a user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/login`, credentials);
    
    if (response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  }
  
  /**
   * Sign up a new user
   */
  async signup(userData: SignupData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/register`, userData);
    
    if (response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  }
  
  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<void>(`${this.baseUrl}/logout`);
    } finally {
      // Always remove the token, even if the request fails
      apiClient.removeToken();
    }
  }
  
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`${this.baseUrl}/me`);
  }
  
  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.put<UserProfile>(`${this.baseUrl}/profile`, data);
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