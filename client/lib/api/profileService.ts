import { apiClient } from './apiClient';
import { User } from './types';

class ProfileService {
  private baseUrl = '/users';

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(`${this.baseUrl}/me`);
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    return apiClient.put<User>(`${this.baseUrl}/me`, userData);
  }

  /**
   * Update user password
   */
  async updatePassword(passwordData: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string; 
  }): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/me/password`, passwordData);
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(): Promise<any> {
    return apiClient.get<any>(`${this.baseUrl}/me/notifications`);
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(preferences: any): Promise<any> {
    return apiClient.put<any>(`${this.baseUrl}/me/notifications`, preferences);
  }

  /**
   * Get user statistics (package counts, invoices, etc.)
   */
  async getUserStatistics(): Promise<any> {
    return apiClient.get<any>(`${this.baseUrl}/me/statistics`);
  }
}

// Export as singleton
export const profileService = new ProfileService(); 