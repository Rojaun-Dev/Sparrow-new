import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preAlertService } from '@/lib/api/preAlertService';
import { PreAlert, PreAlertFilterParams } from '@/lib/api/types';

// Key factory for preAlert queries
const preAlertKeys = {
  all: ['preAlerts'] as const,
  lists: () => [...preAlertKeys.all, 'list'] as const,
  list: (filters: PreAlertFilterParams) => [...preAlertKeys.lists(), filters] as const,
  details: () => [...preAlertKeys.all, 'detail'] as const,
  detail: (id: string) => [...preAlertKeys.details(), id] as const,
};

// Hook for fetching preAlerts list with filters
export function usePreAlerts(filters: PreAlertFilterParams = {}) {
  return useQuery({
    queryKey: preAlertKeys.list(filters),
    queryFn: () => preAlertService.getPreAlerts(filters),
  });
}

// Hook for fetching user preAlerts with filters
export function useUserPreAlerts(filters: PreAlertFilterParams = {}) {
  return useQuery({
    queryKey: [...preAlertKeys.lists(), 'user', filters],
    queryFn: () => preAlertService.getUserPreAlerts(filters),
  });
}

// Hook for fetching a single preAlert by ID
export function usePreAlert(id: string) {
  return useQuery({
    queryKey: preAlertKeys.detail(id),
    queryFn: () => preAlertService.getPreAlert(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

// Hook for creating a new preAlert
export function useCreatePreAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preAlert: Partial<PreAlert>) => 
      preAlertService.createPreAlert(preAlert),
    onSuccess: () => {
      // Invalidate all preAlert lists to trigger a refetch
      queryClient.invalidateQueries({ queryKey: preAlertKeys.lists() });
    },
  });
}

// Hook for creating a new preAlert with documents
export function useCreatePreAlertWithDocuments() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ preAlert, files }: { preAlert: Partial<PreAlert>, files: File[] }) => 
      preAlertService.createPreAlertWithDocuments(preAlert, files),
    onSuccess: () => {
      // Invalidate all preAlert lists to trigger a refetch
      queryClient.invalidateQueries({ queryKey: preAlertKeys.lists() });
    },
  });
}

// Hook for uploading documents to a preAlert
export function useUploadPreAlertDocuments() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => 
      preAlertService.uploadPreAlertDocuments(id, files),
    onSuccess: (updatedPreAlert: PreAlert) => {
      // Update the preAlert in the cache
      queryClient.setQueryData(
        preAlertKeys.detail(updatedPreAlert.id),
        updatedPreAlert
      );
      
      // Invalidate the preAlerts list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: preAlertKeys.lists() });
    },
  });
}

// Hook for removing a document from a preAlert
export function useRemovePreAlertDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, documentIndex }: { id: string; documentIndex: number }) => 
      preAlertService.removePreAlertDocument(id, documentIndex),
    onSuccess: (updatedPreAlert: PreAlert) => {
      // Update the preAlert in the cache
      queryClient.setQueryData(
        preAlertKeys.detail(updatedPreAlert.id),
        updatedPreAlert
      );
      
      // Invalidate the preAlerts list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: preAlertKeys.lists() });
    },
  });
}

// Hook for updating a preAlert
export function useUpdatePreAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, preAlert }: { id: string; preAlert: Partial<PreAlert> }) => 
      preAlertService.updatePreAlert(id, preAlert),
    onSuccess: (updatedPreAlert: PreAlert) => {
      // Update the preAlert in the cache
      queryClient.setQueryData(
        preAlertKeys.detail(updatedPreAlert.id),
        updatedPreAlert
      );
      
      // Invalidate the preAlerts list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: preAlertKeys.lists() });
    },
  });
}

// Hook for cancelling a preAlert
export function useCancelPreAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => preAlertService.cancelPreAlert(id),
    onSuccess: (updatedPreAlert: PreAlert) => {
      // Update the preAlert in the cache
      queryClient.setQueryData(
        preAlertKeys.detail(updatedPreAlert.id),
        updatedPreAlert
      );
      
      // Invalidate the preAlerts list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: preAlertKeys.lists() });
    },
  });
} 