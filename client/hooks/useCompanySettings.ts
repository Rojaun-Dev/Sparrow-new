import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { useToast } from './use-toast';
import { useMyAdminCompany } from './useCompanies';

export function useCompanySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Use the existing company data query
  const companyQuery = useMyAdminCompany();
  
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
    isLoading: companyQuery.isLoading,
    error: companyQuery.error,
    updateCompany,
    updateLocations
  };
} 