import { apiClient } from './apiClient';
import { User, NotificationPreferences, PasswordChangeRequest } from './types';

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
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
      const response = await apiClient.get<ApiResponse<ProfileResponse>>('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  async updateProfile(data: any) {
    try {
      const response = await apiClient.put<ApiResponse<ProfileResponse>>('/auth/profile', data);
      return response.data;
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

  async getAdminMetrics() {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      throw error;
    }
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get<ApiResponse<NotificationPreferences>>('/auth/notification-preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  async updateNotificationPreferences(preferences: NotificationPreferences) {
    try {
      const response = await apiClient.put<ApiResponse<any>>('/auth/notification-preferences', preferences);
      return response.data;
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