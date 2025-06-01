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