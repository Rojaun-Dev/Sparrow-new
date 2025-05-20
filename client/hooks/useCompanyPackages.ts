import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { Package } from '@/lib/api/types';

interface PaginatedPackageResponse {
  data: Package[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface CompanyPackageParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Key factory for company package queries
const companyPackageKeys = {
  all: ['company-packages'] as const,
  lists: () => [...companyPackageKeys.all, 'list'] as const,
  list: (companyId: string, params?: CompanyPackageParams) => 
    [...companyPackageKeys.lists(), companyId, params] as const,
};

// Hook for fetching company packages with pagination and filtering
export function useCompanyPackages(companyId: string, params: CompanyPackageParams = {}) {
  return useQuery({
    queryKey: companyPackageKeys.list(companyId, params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const url = `/superadmin/companies/${companyId}/packages?${queryParams.toString()}`;
      return apiClient.get<PaginatedPackageResponse>(url);
    },
    enabled: !!companyId,
  });
} 