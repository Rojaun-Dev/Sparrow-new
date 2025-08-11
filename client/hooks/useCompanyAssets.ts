import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { useToast } from './use-toast';
import { useMyAdminCompany } from './useCompanies';

export interface CompanyAsset {
  id: string;
  companyId: string;
  type: 'logo' | 'banner' | 'favicon' | 'small_logo';
  metadata: Record<string, any>;
  imageData?: string; // base64 encoded image
  createdAt: string;
}

export function useCompanyAssets() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const companyQuery = useMyAdminCompany();
  const companyId = companyQuery.data?.id;

  const { data: assets = [], ...query } = useQuery({
    queryKey: ['company-assets', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return apiClient.get<CompanyAsset[]>(`/companies/${companyId}/assets`);
    },
    enabled: !!companyId,
  });

  const getAssetByType = (type: CompanyAsset['type']) => {
    return assets.find(asset => asset.type === type);
  };

  const uploadAsset = useMutation({
    mutationFn: async ({ type, file, metadata = {} }: { 
      type: CompanyAsset['type'], 
      file: File | null,
      metadata?: Record<string, any>
    }) => {
      if (!companyId) throw new Error('Company ID not found');
      
      // If we have a file, convert it to base64
      let imageData;
      if (file) {
        imageData = await fileToBase64(file);
      }
      
      const existingAsset = getAssetByType(type);
      
      if (existingAsset) {
        // Update existing asset
        return apiClient.put<CompanyAsset>(`/companies/${companyId}/assets/${existingAsset.id}`, {
          type,
          metadata,
          imageData
        });
      } else {
        // Create new asset
        return apiClient.post<CompanyAsset>(`/companies/${companyId}/assets`, {
          type,
          metadata,
          imageData
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Asset Updated',
        description: 'Company branding asset has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['company-assets', companyId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update company asset',
        variant: 'destructive',
      });
    }
  });

  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      if (!companyId) throw new Error('Company ID not found');
      return apiClient.delete(`/companies/${companyId}/assets/${assetId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Asset Deleted',
        description: 'Company branding asset has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['company-assets', companyId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete company asset',
        variant: 'destructive',
      });
    }
  });

  // Utility function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return {
    assets,
    getAssetByType,
    uploadAsset,
    deleteAsset,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Helper hook specifically for getting company logo/banner for invoices
export function useCompanyLogo(companyId?: string) {
  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['company-assets', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return apiClient.get<CompanyAsset[]>(`/companies/${companyId}/assets`);
    },
    enabled: !!companyId,
  });

  const logoAsset = assets.find(asset => asset.type === 'logo');
  const bannerAsset = assets.find(asset => asset.type === 'banner');
  
  // Helper function to convert base64 to data URL
  const convertToDataUrl = (imageData: string) => {
    // Remove data URL prefix if it exists, then add our own
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    return `data:image/png;base64,${base64Data}`;
  };
  
  // Use logo if available, otherwise fallback to banner
  let logoUrl = null;
  let usedAsset = null;
  
  if (logoAsset?.imageData) {
    logoUrl = convertToDataUrl(logoAsset.imageData);
    usedAsset = logoAsset;
  } else if (bannerAsset?.imageData) {
    logoUrl = convertToDataUrl(bannerAsset.imageData);
    usedAsset = bannerAsset;
  }
  
  return {
    logoUrl,
    logoAsset,
    bannerAsset,
    usedAsset,
    isUsingBanner: usedAsset?.type === 'banner',
    isLoading,
    error
  };
} 