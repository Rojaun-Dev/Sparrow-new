import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { UserData, PaginatedResponse } from '@/lib/api/userService';
import { usersService } from '@/lib/api/customerService';

interface CompanyUserParams {
  role?: string | string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
}

// Key factory for company user queries
const companyUserKeys = {
  all: ['company-users'] as const,
  lists: () => [...companyUserKeys.all, 'list'] as const,
  list: (companyId: string, params?: CompanyUserParams) => 
    [...companyUserKeys.lists(), companyId, params] as const,
};

// Hook for fetching company users with roles filter
export function useCompanyUsers(companyId: string, params: CompanyUserParams = {}) {
  return useQuery({
    queryKey: companyUserKeys.list(companyId, params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.order) queryParams.append('order', params.order);
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      
      // Handle array or string for role
      if (params.role) {
        if (Array.isArray(params.role)) {
          params.role.forEach(r => queryParams.append('role', r));
        } else {
          queryParams.append('role', params.role);
        }
      }
      
      const url = `/admin/companies/${companyId}/users?${queryParams.toString()}`;
      return apiClient.get<PaginatedResponse<UserData>>(url);
    },
    enabled: !!companyId,
  });
}

// Hook for hard deleting a user (company context)
export function useDeleteCompanyUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId?: string }) => {
      return usersService.hardDeleteUser(userId, companyId);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the company-users list for the relevant company
      queryClient.invalidateQueries({ queryKey: ['company-users', 'list', variables.companyId] });
    },
  });
}

// Hook for updating a user (company context)
export function useUpdateCompanyUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, userData, companyId }: { userId: string; userData: any; companyId?: string }) => {
      return usersService.updateUser(userId, userData, companyId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-users', 'list', variables.companyId] });
    },
  });
}

// Hook for reactivating a user (company context)
export function useReactivateCompanyUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId?: string }) => {
      if (!companyId) throw new Error('companyId is required');
      return apiClient.post(`/companies/${companyId}/users/${userId}/reactivate`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-users', 'list', variables.companyId] });
    },
  });
}

// Hook for deactivating (soft delete) a user (company context)
export function useDeactivateCompanyUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId?: string }) => {
      return usersService.deleteUser(userId, companyId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-users', 'list', variables.companyId] });
    },
  });
} 