import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiClient } from '@/lib/api/apiClient';

interface WiPayPaymentProps {
  invoiceId: string;
  origin?: string;
}

interface WiPayResponse {
  paymentId: string;
  redirectUrl: string;
  transactionId?: string;
}

export function usePayWiPay() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const apiClient = new ApiClient();
  
  const initiate = async ({ invoiceId, origin = 'SparrowX-Client' }: WiPayPaymentProps) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construct the response URL
      const returnUrl = `${window.location.origin}/invoices/${invoiceId}`;
      
      // Call API to create payment request
      const response = await apiClient.post<WiPayResponse>('/companies/current/payments/wipay/request', {
        invoiceId,
        responseUrl: returnUrl,
        origin
      });
      
      // Redirect to payment page
      if (response && response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return true;
      } else {
        throw new Error('No redirect URL returned from payment service');
      }
    } catch (err: any) {
      console.error('Error initiating WiPay payment:', err);
      setError(err.message || 'Failed to initiate payment');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiate,
    isLoading,
    error
  };
}

export function useWiPayStatus() {
  const queryClient = useQueryClient();

  // This will be used to process the callback from WiPay  
  const handleCallback = useMutation({
    mutationFn: async (callbackData: any) => {
      const apiClient = new ApiClient();
      return apiClient.post('/companies/current/payments/wipay/callback', callbackData);
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    }
  });

  return {
    handleCallback
  };
} 