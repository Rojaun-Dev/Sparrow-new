import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/lib/api/companyService';

interface CompanyStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalPackages: number;
  activePackages: number;
  readyForPickup: number;
  pendingPreAlerts: number;
}

// Key factory for company statistics queries
const companyStatisticsKeys = {
  all: ['company-statistics'] as const,
  detail: (id: string) => [...companyStatisticsKeys.all, id] as const,
};

export function useCompanyStatistics(companyId: string) {
  return useQuery({
    queryKey: companyStatisticsKeys.detail(companyId),
    queryFn: () => companyService.getCompanyStatistics(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 