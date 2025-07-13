import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/apiClient';
import { useCurrentUser } from './useProfile';

interface ShippingInfo {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface CompanyShippingData {
  company: {
    id: string;
    name: string;
    shipping_info: ShippingInfo;
  };
  user: {
    id: string;
    prefId: string;
  };
}

export function useCompanyShipping() {
  const { data: user } = useCurrentUser();

  return useQuery<CompanyShippingData>({
    queryKey: ['company-shipping', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('User data not available');
      }

      if (!user.companyId) {
        throw new Error('User company ID not available');
      }

      // Fetch company details to get shipping info
      const companyData = await apiClient.get(`/companies/${user.companyId}`) as any;
      
      return {
        company: {
          id: user.companyId,
          name: companyData.data?.name || 'Unknown Company',
          shipping_info: companyData.data?.shipping_info || {}
        },
        user: {
          id: user.id,
          prefId: user.prefId || ''
        }
      };
    },
    enabled: !!user && !!user.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper function to format shipping address with prefID
export function formatShippingAddress(shippingData: CompanyShippingData | undefined): string {
  if (!shippingData) return '';

  const { company, user } = shippingData;
  const shipping = company.shipping_info;

  if (!shipping.address_line1) {
    return 'Shipping address not configured';
  }

  const addressLine1 = shipping.address_line1;
  const addressLine2 = `suite ${user.prefId}, prefID ${user.prefId}`;
  
  const cityStateZip = [
    shipping.city,
    shipping.state,
    shipping.zip
  ].filter(Boolean).join(', ');

  const country = shipping.country || 'Jamaica';

  return `${addressLine1}\n${addressLine2}\n${cityStateZip}\n${country}`;
} 