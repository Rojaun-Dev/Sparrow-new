import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/lib/api/companyService';
import { Company } from '@/lib/api/types';

// Key factory for company queries
const companyKeys = {
  all: ['companies'] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
  current: () => [...companyKeys.all, 'current'] as const,
};

// Hook for fetching a single company by ID
export function useCompany(id?: string) {
  return useQuery({
    queryKey: id ? companyKeys.detail(id) : companyKeys.details(),
    queryFn: () => companyService.getCompany(id as string),
    enabled: !!id, // Only run the query if we have an ID
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching the current user's company
export function useCurrentCompany() {
  return useQuery({
    queryKey: companyKeys.current(),
    queryFn: () => companyService.getCurrentCompany(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 