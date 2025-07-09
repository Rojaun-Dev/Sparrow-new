import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/api/profileService';
import { User, NotificationPreferences } from '@/lib/api/types';

// Key factory for profile queries
const profileKeys = {
  all: ['profile'] as const,
  user: () => [...profileKeys.all, 'user'] as const,
  settings: () => [...profileKeys.all, 'settings'] as const,
  statistics: () => [...profileKeys.all, 'statistics'] as const,
  notifications: () => [...profileKeys.all, 'notifications'] as const,
};

// Hook for fetching current user profile
export function useCurrentUser() {
  return useQuery({
    queryKey: profileKeys.user(),
    queryFn: () => profileService.getProfile(),
  });
}

// Hook for updating user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => profileService.updateProfile(userData),
    onSuccess: () => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

// Hook for updating user password
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (passwordData: { 
      currentPassword: string; 
      newPassword: string; 
      confirmPassword: string; 
    }) => profileService.changePassword(passwordData),
  });
}

// Hook for fetching notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: profileKeys.notifications(),
    queryFn: () => profileService.getNotificationPreferences(),
  });
}

// Hook for updating notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferences: NotificationPreferences) => profileService.updateNotificationPreferences(preferences),
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: profileKeys.notifications() });
      
      // Also fetch the user again to update any dependent data
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

// Hook for fetching user statistics
export function useUserStatistics(currency: 'USD' | 'JMD' = 'USD') {
  return useQuery({
    queryKey: [...profileKeys.statistics(), currency],
    queryFn: () => profileService.getUserStatistics(currency),
  });
}

// Hook for fetching statistics for a specific user as an admin
export function useCustomerStatisticsForAdmin(userId: string, companyId: string, currency: 'USD' | 'JMD' = 'USD') {
  return useQuery({
    queryKey: ['customer-statistics', userId, companyId, currency],
    queryFn: async () => {
      const response = await profileService.getCustomerStatisticsForAdmin(userId, companyId, currency);
      // Return the data property from the response
      return response && response.data ? response.data : response;
    },
    enabled: !!userId && !!companyId,
  });
} 