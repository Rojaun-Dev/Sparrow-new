import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { ExchangeRateSettings, Company } from '@/lib/api/types';
import { useCompanyContext } from './useCompanyContext';

interface Settings {
  id: string;
  companyId: string;
  internalPrefix: string;
  notificationSettings?: any;
  themeSettings?: any;
  paymentSettings?: any;
  integrationSettings?: any;
  exchangeRateSettings?: ExchangeRateSettings;
  createdAt: string;
  updatedAt: string;
}

export function useCompanySettings() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();
  
  // Fallback for testing - remove in production
  const effectiveCompanyId = companyId;  // Hardcoded for testing
  
  // Fetch company settings
  const { data: settings, isLoading: isSettingsLoading, error } = useQuery<Settings>({
    queryKey: ['company-settings', effectiveCompanyId],
    queryFn: () => apiClient.get('/company-settings'),
    enabled: true, // Always try to fetch
  });

  // Debug logs
  console.log("useCompanySettings - companyId:", companyId);
  console.log("useCompanySettings - settings loading:", isSettingsLoading);
  console.log("useCompanySettings - settings error:", error);

  const updateCompany = useMutation({
    mutationFn: (data: any) => apiClient.put(`/companies/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['company', effectiveCompanyId] });
    },
  });

  const updateLocations = useMutation({
    mutationFn: (locations: string[]) => apiClient.put(`/companies/current`, { locations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['company', effectiveCompanyId] });
    },
  });

  const updateIntegrationSettings = useMutation({
    mutationFn: (data: any) => apiClient.put('/company-settings/integration', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });

  const updateInternalPrefix = useMutation({
    mutationFn: (prefix: string) => apiClient.put('/company-settings/internal-prefix', { internalPrefix: prefix }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });

  const updateExchangeRateSettings = useMutation({
    mutationFn: (data: ExchangeRateSettings) => apiClient.put('/company-settings/exchange-rate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });

  // Fetch full company details (name, subdomain, etc.)
  const { data: company, isLoading: isCompanyLoading } = useQuery<Company>({
    queryKey: ['company', effectiveCompanyId],
    queryFn: () => apiClient.get('/companies/admin/me'),
    enabled: true, // Always try to fetch
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug company data fetch
  console.log("useCompanySettings - company loading:", isCompanyLoading);
  console.log("useCompanySettings - company data:", company);

  // Combined loading flag for convenience
  const isLoading = isSettingsLoading || isCompanyLoading;

  return {
    company,
    settings,
    isLoading,
    error,
    updateCompany,
    updateLocations,
    updateIntegrationSettings,
    updateInternalPrefix,
    updateExchangeRateSettings,
  };
} 