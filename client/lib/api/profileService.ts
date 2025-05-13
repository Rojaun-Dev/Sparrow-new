import { apiClient } from './apiClient';
import { User } from './types';

class ProfileService {
  private baseUrl = '/auth';

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>(`${this.baseUrl}/me`);
    return response.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ user: User }>(`${this.baseUrl}/profile`, userData);
    return response.user;
  }

  /**
   * Update user password
   */
  async updatePassword(passwordData: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string; 
  }): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/password`, passwordData);
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
   * Get user statistics (package counts, invoices, etc.) based on role
   * The backend will handle access control based on the user's role
   */
  async getUserStatistics(): Promise<any> {
    // First get the user's profile to check role
    const user = await this.getCurrentUser();
    
    // Determine which statistics endpoint to call based on role
    if (user.role === 'super_admin') {
      return apiClient.get<any>(`/statistics/superadmin`);
    } else if (user.role === 'admin_l1' || user.role === 'admin_l2') {
      return apiClient.get<any>(`/statistics/admin`);
    } else {
      // Default to customer statistics for regular users
      return apiClient.get<any>(`/statistics/customer`);
    }
  }
}

// Export as singleton
export const profileService = new ProfileService(); 