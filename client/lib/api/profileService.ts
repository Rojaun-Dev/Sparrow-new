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
    prefId?: string;
    companyId: string;
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
      // First get the current user to determine their role
      const user = await this.getProfile();
      
      let endpoint: string;
      
      // Determine the correct endpoint based on user role
      switch (user.role) {
        case 'customer':
          endpoint = `/statistics/customer?currency=${currency}`;
          break;
        case 'admin_l1':
        case 'admin_l2':
          endpoint = `/statistics/admin?currency=${currency}`;
          break;
        case 'super_admin':
          endpoint = `/statistics/superadmin?currency=${currency}`;
          break;
        default:
          // Default to customer endpoint for unknown roles
          endpoint = `/statistics/customer?currency=${currency}`;
          break;
      }
      
      const response = await apiClient.get<any>(endpoint);
      console.log('Statistics API response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching user statistics:', error);
      
      // Provide helpful error messages for specific status codes
      if (error.status === 403) {
        throw new Error('You are not authorized to view this data. Please contact an administrator if you believe this is an error.');
      } else if (error.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.status === 500) {
        throw new Error('Server error occurred while fetching statistics. Please try again later.');
      }
      
      throw error;
    }
  },

  async getCustomerStatisticsForAdmin(userId: string, companyId: string, currency: 'USD' | 'JMD' = 'USD') {
    try {
      const response = await apiClient.get<any>(`/statistics/customer/${userId}?currency=${currency}`);
      console.log('Customer Statistics API response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching customer statistics:', error);
      
      // Provide helpful error messages for specific status codes
      if (error.status === 403) {
        throw new Error('You are not authorized to view customer statistics.');
      } else if (error.status === 404) {
        throw new Error('Customer not found.');
      }
      
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