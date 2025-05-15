import { apiClient } from './apiClient';
import { User, NotificationPreferences, PasswordChangeRequest } from './types';

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
  async updatePassword(passwordData: PasswordChangeRequest): Promise<void> {
    return apiClient.put<void>(`${this.baseUrl}/change-password`, passwordData);
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<{ preferences: NotificationPreferences }>(`${this.baseUrl}/me/notifications`);
    return response.preferences || {
      email: true,
      sms: false,
      push: false,
      pickupLocationId: null,
      packageUpdates: { email: true, sms: false, push: false },
      billingUpdates: { email: true, sms: false, push: false },
      marketingUpdates: { email: false, sms: false, push: false }
    };
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const response = await apiClient.put<{ preferences: NotificationPreferences }>(`${this.baseUrl}/me/notifications`, { preferences });
    return response.preferences;
  }

  /**
   * Get company pickup locations
   */
  async getPickupLocations(): Promise<string[]> {
    try {
      // Use the original path since we've added support for it in the backend
      const response = await apiClient.get<{ locations: string[], success: boolean }>(`/company-settings/pickup-locations`);
      return response.locations || [];
    } catch (error) {
      console.error('Error fetching pickup locations:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Update user pickup location
   */
  async updatePickupLocation(pickupLocationId: string): Promise<NotificationPreferences> {
    // Get current notification preferences
    const currentPrefs = await this.getNotificationPreferences();
    
    // Update pickup location in preferences
    const updatedPrefs = {
      ...currentPrefs,
      pickupLocationId
    };
    
    // Save updated preferences
    return this.updateNotificationPreferences(updatedPrefs);
  }

  /**
   * Get user statistics (package counts, invoices, etc.) based on role
   * The backend will handle access control based on the user's role
   */
  async getUserStatistics(): Promise<any> {
    try {
      // First get the user's profile to check role
      const user = await this.getCurrentUser();
      
      let endpoint;
      // Determine which statistics endpoint to call based on role
      if (user.role === 'super_admin') {
        endpoint = `/statistics/superadmin`;
      } else if (user.role === 'admin_l1' || user.role === 'admin_l2') {
        endpoint = `/statistics/admin`;
      } else {
        // Default to customer statistics for regular users
        endpoint = `/statistics/customer/`;
      }
      
      const response = await apiClient.get<any>(endpoint);
      
      // Ensure we have a valid response object
      if (!response) {
        return { data: {}, success: true };
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      // Return default statistics object instead of throwing
      return { 
        data: {
          totalPackages: "0",
          packagesByStatus: {},
          pendingPreAlerts: "0",
          outstandingInvoices: {
            count: "0",
            amount: 0
          },
          monthlyTrend: [],
          recentPayments: []
        },
        success: true
      };
    }
  }
}

// Export as singleton
export const profileService = new ProfileService(); 