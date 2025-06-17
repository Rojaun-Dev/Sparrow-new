import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { useToast } from './use-toast';
import { useMyAdminCompany } from './useCompanies';

// Define the company settings type
interface CompanySettings {
  id?: string;
  companyId?: string;
  internalPrefix?: string;
  notificationSettings?: Record<string, any>;
  themeSettings?: Record<string, any>;
  paymentSettings?: Record<string, any>;
  integrationSettings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export function useCompanySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Use the existing company data query
  const companyQuery = useMyAdminCompany();
  
  // Get company settings
  const settingsQuery = useQuery<CompanySettings>({
    queryKey: ['companySettings'],
    queryFn: async () => {
      return apiClient.get('/company-settings');
    },
    enabled: !!companyQuery.data?.id,
  });
  
  // Update integration settings
  const updateIntegrationSettings = useMutation({
    mutationFn: async (integrationSettings: any) => {
      console.log("Saving integration settings:", integrationSettings);
      return apiClient.put('/company-settings/integration', integrationSettings);
    },
    onSuccess: () => {
      toast({
        title: "Integration settings updated",
        description: "Integration settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update integration settings",
        variant: "destructive",
      });
      console.error("Error updating integration settings:", error);
    }
  });
  
  // Update internal prefix
  const updateInternalPrefix = useMutation({
    mutationFn: async (internalPrefix: string) => {
      return apiClient.put('/company-settings/internal-prefix', { internalPrefix });
    },
    onSuccess: () => {
      toast({
        title: "Internal prefix updated",
        description: "Company internal prefix has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update internal prefix",
        variant: "destructive",
      });
      console.error("Error updating internal prefix:", error);
    }
  });
  
  // Update company general information
  const updateCompany = useMutation({
    mutationFn: async (data: any) => {
      const companyId = companyQuery.data?.id;
      if (!companyId) throw new Error("Company ID not found");
      
      // Check if we're updating payment settings
      if (data.paymentSettings) {
        // Use the dedicated payment settings endpoint
        return apiClient.put(`/company-settings/payment`, data.paymentSettings);
      }
      
      // Otherwise use the regular company update endpoint
      return apiClient.put(`/companies/${companyId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Company updated",
        description: "Company information has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['myAdminCompany'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update company information",
        variant: "destructive",
      });
    }
  });
  
  // Update company locations
  const updateLocations = useMutation({
    mutationFn: async (locations: string[]) => {
      const companyId = companyQuery.data?.id;
      if (!companyId) throw new Error("Company ID not found");
      return apiClient.put(`/companies/${companyId}`, { locations });
    },
    onSuccess: () => {
      toast({
        title: "Locations updated",
        description: "Pickup locations have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['myAdminCompany'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update locations",
        variant: "destructive",
      });
    }
  });

  return {
    company: companyQuery.data,
    settings: settingsQuery.data as CompanySettings,
    isLoading: companyQuery.isLoading || settingsQuery.isLoading,
    error: companyQuery.error || settingsQuery.error,
    updateCompany,
    updateLocations,
    updateIntegrationSettings,
    updateInternalPrefix
  };
} 