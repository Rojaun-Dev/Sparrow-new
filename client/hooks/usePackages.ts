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

// Hook for fetching a single package by ID
export function usePackage(id: string) {
  return useQuery({
    queryKey: packageKeys.detail(id),
    queryFn: () => packageService.getPackage(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

// Hook for fetching package timeline
export function usePackageTimeline(id: string) {
  return useQuery({
    queryKey: [...packageKeys.detail(id), 'timeline'],
    queryFn: () => packageService.getPackageTimeline(id),
    enabled: !!id,
  });
}

// Hook for updating package status
export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      packageService.updatePackageStatus(id, status),
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