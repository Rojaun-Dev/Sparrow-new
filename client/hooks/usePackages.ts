import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageService } from '@/lib/api/packageService';
import { Package, PackageFilterParams } from '@/lib/api/types';

// Key factory for package queries
const packageKeys = {
  all: ['packages'] as const,
  lists: () => [...packageKeys.all, 'list'] as const,
  list: (filters: PackageFilterParams) => [...packageKeys.lists(), filters] as const,
  details: () => [...packageKeys.all, 'detail'] as const,
  detail: (id: string) => [...packageKeys.details(), id] as const,
};

// Hook for fetching packages list with filters
export function usePackages(filters: PackageFilterParams = {}) {
  return useQuery({
    queryKey: packageKeys.list(filters),
    queryFn: () => packageService.getPackages(filters),
  });
}

// Hook for fetching user packages with filters
export function useUserPackages(filters: PackageFilterParams = {}) {
  return useQuery({
    queryKey: [...packageKeys.lists(), 'user', filters],
    queryFn: () => packageService.getUserPackages(filters),
  });
}

// Hook for fetching user packages with filters and pagination information
export function useUserPackagesWithPagination(filters: PackageFilterParams = {}) {
  return useQuery({
    queryKey: [...packageKeys.lists(), 'user', 'paginated', filters],
    queryFn: () => packageService.getUserPackagesWithPagination(filters),
  });
}

// Hook for fetching a single package by ID
export function usePackage(id: string) {
  return useQuery({
    queryKey: packageKeys.detail(id),
    queryFn: () => packageService.getPackage(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

/**
 * TODO: Backend Timeline API Integration
 * 
 * When the backend timeline API is fully implemented, update this hook by:
 * 1. Restoring the original packageService.getPackageTimeline API call or Using your own API call
 * 2. Setting enabled: !!id to enable the query when an ID is available
 * 3. Removing the temporary Promise.resolve([]) placeholder
 * 
 * Example implementation:
 * return useQuery({
 *   queryKey: [...packageKeys.detail(id), 'timeline'],
 *   queryFn: () => packageService.getPackageTimeline(id),
 *   enabled: !!id,
 * });
 */
// Hook for fetching package timeline
export function usePackageTimeline(id: string) {
  return useQuery({
    queryKey: [...packageKeys.detail(id), 'timeline'],
    queryFn: () => Promise.resolve([]), // Return empty array instead of making API call
    enabled: false, // Disable the query to prevent API calls
  });
}

// Hook for updating package status
export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, sendNotification }: { id: string; status: string; sendNotification?: boolean }) => 
      packageService.updatePackageStatus(id, status, undefined, sendNotification),
    onSuccess: (updatedPackage: Package) => {
      // Update the package in the cache
      queryClient.setQueryData(
        packageKeys.detail(updatedPackage.id),
        updatedPackage
      );
      // Invalidate the packages list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: packageKeys.lists() });
      // Invalidate statistics cache to update package status counts
      queryClient.invalidateQueries({ queryKey: ['profile', 'statistics'] });
    },
  });
}

// Hook for bulk updating package status
export function useBulkUpdatePackageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageIds, status, sendNotification }: {
      packageIds: string[];
      status: string;
      sendNotification?: boolean
    }) => {
      // Update packages sequentially to avoid overwhelming the server
      const results = [];
      for (const packageId of packageIds) {
        const result = await packageService.updatePackageStatus(packageId, status, undefined, sendNotification);
        results.push(result);
      }
      return results;
    },
    onSuccess: (updatedPackages: Package[]) => {
      // Update each package in the cache
      updatedPackages.forEach(updatedPackage => {
        queryClient.setQueryData(
          packageKeys.detail(updatedPackage.id),
          updatedPackage
        );
      });

      // Invalidate the packages list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: packageKeys.lists() });
      // Invalidate statistics cache to update package status counts
      queryClient.invalidateQueries({ queryKey: ['profile', 'statistics'] });
    },
  });
}

// Hook for uploading package photos
export function useUploadPackagePhotos() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => 
      packageService.uploadPackagePhotos(id, files),
    onSuccess: (updatedPackage: Package) => {
      // Update the package in the cache
      queryClient.setQueryData(
        packageKeys.detail(updatedPackage.id),
        updatedPackage
      );
    },
  });
}

// Hook for matching a pre-alert to a package
export function useMatchPreAlertToPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, preAlertId, sendNotification }: { packageId: string; preAlertId: string; sendNotification?: boolean }) =>
      packageService.matchPreAlertToPackage(packageId, preAlertId, sendNotification),
    onSuccess: () => {
      // Invalidate both packages and pre-alerts lists
      queryClient.invalidateQueries({ queryKey: packageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['preAlerts', 'list'] });
      // Invalidate statistics cache to update pre-alert and package counts
      queryClient.invalidateQueries({ queryKey: ['profile', 'statistics'] });
    },
  });
}

// Hook for fetching packages by invoice ID
export function usePackagesByInvoiceId(invoiceId: string) {
  return useQuery({
    queryKey: [...packageKeys.lists(), 'invoice', invoiceId],
    queryFn: () => packageService.getPackagesByInvoiceId(invoiceId),
    enabled: !!invoiceId, // Only run the query if we have an invoice ID
  });
}

// Hook for fetching unbilled packages for a user
export function useUnbilledPackagesByUser(userId: string, companyId?: string) {
  return useQuery({
    queryKey: ["unbilled-packages", userId, companyId],
    queryFn: () => packageService.getUnbilledPackagesByUser(userId, companyId),
    enabled: !!userId && !!companyId,
  });
}

// Hook for fetching unassigned packages
export function useUnassignedPackages(filters: PackageFilterParams = {}) {
  return useQuery({
    queryKey: [...packageKeys.lists(), 'unassigned', filters],
    queryFn: () => packageService.getUnassignedPackages(filters),
  });
}

// Hook for assigning a user to a package
export function useAssignUserToPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ packageId, userId }: { packageId: string, userId: string }) => 
      packageService.assignUserToPackage(packageId, userId),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: packageKeys.lists() });
    },
  });
} 