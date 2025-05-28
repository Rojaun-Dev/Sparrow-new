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
  pickupLocations: () => [...profileKeys.all, 'pickupLocations'] as const,
};

// Hook for fetching current user profile
export function useCurrentUser() {
  return useQuery({
    queryKey: profileKeys.user(),
    queryFn: () => profileService.getCurrentUser(),
  });
}

// Hook for updating user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => profileService.updateProfile(userData),
    onSuccess: (updatedUser: User) => {
      // Update the user in the cache
      queryClient.setQueryData(profileKeys.user(), updatedUser);
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
    }) => profileService.updatePassword(passwordData),
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
    onSuccess: (updatedPreferences: NotificationPreferences) => {
      // Update the preferences in the cache
      queryClient.setQueryData(profileKeys.notifications(), updatedPreferences);
      
      // Also fetch the user again to update any dependent data
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

// Hook for fetching pickup locations
export function usePickupLocations() {
  return useQuery({
    queryKey: profileKeys.pickupLocations(),
    queryFn: () => profileService.getPickupLocations(),
  });
}

// Hook for updating pickup location
export function useUpdatePickupLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pickupLocationId: string) => profileService.updatePickupLocation(pickupLocationId),
    onSuccess: (updatedPreferences: NotificationPreferences) => {
      // Update the notification preferences in the cache
      queryClient.setQueryData(profileKeys.notifications(), updatedPreferences);
      
      // Also invalidate the user query to ensure consistency
      queryClient.invalidateQueries({ queryKey: profileKeys.user() });
    },
  });
}

// Hook for fetching user statistics
export function useUserStatistics() {
  return useQuery({
    queryKey: profileKeys.statistics(),
    queryFn: () => profileService.getUserStatistics(),
  });
}

// Hook for fetching statistics for a specific user as an admin
export function useCustomerStatisticsForAdmin(userId: string, companyId: string) {
  return useQuery({
    queryKey: ['customer-statistics', userId, companyId],
    queryFn: () => profileService.getCustomerStatisticsForAdmin(userId, companyId),
    enabled: !!userId && !!companyId,
  });
} 