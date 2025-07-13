import { apiClient } from './apiClient';
import { User, NotificationPreferences, PasswordChangeRequest } from './types';

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address?: string | null;
    trn?: string | null;
    role: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const profileService = {
  async getProfile() {
    try {
      // apiClient unwraps to `{ user: User }` already, so just return the `user` field
      const response = await apiClient.get<ProfileResponse>(
        '/auth/me'
      );
      return response.user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  async updateProfile(data: any) {
    try {
      // apiClient unwraps to `{ user: User }`
      const response = await apiClient.put<ProfileResponse>(
        '/auth/profile',
        data
      );
      return response.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async getUserStatistics(currency: 'USD' | 'JMD' = 'USD') {
    try {
      // Update the endpoint to match the backend route
      const response = await apiClient.get<ApiResponse<any>>(`/statistics/admin?currency=${currency}`);
      console.log('Statistics API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  },

  async getCustomerStatisticsForAdmin(userId: string, companyId: string, currency: 'USD' | 'JMD' = 'USD') {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/statistics/customer/${userId}?currency=${currency}`);
      console.log('Customer Statistics API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching customer statistics:', error);
      throw error;
    }
  },

  async getAdminMetrics() {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      throw error;
    }
  },

  // Notification preferences ------------------
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      // apiClient unwraps to the preferences object directly
      const response = await apiClient.get<NotificationPreferences>(
        '/auth/me/notifications'
      );
      return response;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  async updateNotificationPreferences(preferences: NotificationPreferences) {
    try {
      // apiClient unwraps to the updated preferences object directly
      const response = await apiClient.put<NotificationPreferences>(
        '/auth/me/notifications',
        preferences
      );
      return response;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  async changePassword(data: PasswordChangeRequest) {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/auth/change-password', data);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
} 