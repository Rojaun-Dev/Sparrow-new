import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { ApiClient } from '@/lib/api/apiClient';
import { SupportedCurrency } from '@/lib/api/types';

interface WiPayPaymentProps {
  invoiceId: string;
  origin?: string;
  currency?: SupportedCurrency;
}

interface WiPayResponse {
  paymentId: string;
  redirectUrl: string;
  transactionId?: string;
  currency?: SupportedCurrency;
  meta?: {
    currency?: SupportedCurrency;
    exchangeRate?: number;
  };
}

interface PaymentSettings {
  wipay?: {
    enabled: boolean;
    accountNumber?: string;
    apiKey?: string;
    environment?: string;
  };
}

export function usePaymentAvailability() {
  const apiClient = new ApiClient();
  
  return useQuery({
    queryKey: ['paymentAvailability'],
    queryFn: async () => {
      try {
        // Get company payment settings via dedicated endpoint
        const response = await apiClient.get<PaymentSettings>('/company-settings/payment');
        
        // Check if we got valid response data
        if (!response) {
          console.warn('Payment settings response was empty');
          return { isEnabled: false, paymentSettings: null };
        }
        
        return {
          isEnabled: !!response?.wipay?.enabled,
          paymentSettings: response
        };
      } catch (err) {
        console.error('Error fetching payment settings:', err);
        return { isEnabled: false, paymentSettings: null };
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });
}

export function usePayWiPay() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const apiClient = new ApiClient();
  
  const initiate = async ({ invoiceId, origin = 'SparrowX-Client', currency = 'USD' }: WiPayPaymentProps) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Store authentication token in session storage before redirect
      // This ensures we can recover it after returning from WiPay
      const token = localStorage.getItem('token');
      if (token) {
        sessionStorage.setItem('wipay_auth_token', token);
      }
      
      // Store the selected currency in session storage for after payment return
      sessionStorage.setItem('wipay_currency', currency);
      
      // Construct the response URL to point to our payment result page
      // Include the customer role in the return URL to help with authentication
      const returnUrl = `${window.location.origin}/customer/invoices/${invoiceId}`;
      
      // Call API to create payment request
      const response = await apiClient.post<WiPayResponse>('/companies/current/payments/wipay/request', {
        invoiceId,
        responseUrl: returnUrl,
        origin,
        currency
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
  const processingRef = useRef<boolean>(false);

  // This will be used to process the callback from WiPay  
  const handleCallback = useMutation({
    mutationFn: async (callbackData: any) => {
      // Prevent multiple calls with the same data
      if (processingRef.current) {
        console.log('Callback already being processed, skipping duplicate call');
        return null;
      }
      
      try {
        processingRef.current = true;
        const apiClient = new ApiClient();
        return await apiClient.post('/companies/current/payments/wipay/callback', callbackData);
      } finally {
        // Set a timeout to reset the processing flag after a delay
        // This prevents rapid successive calls but allows future valid calls
        setTimeout(() => {
          processingRef.current = false;
        }, 5000); // 5-second cooldown
      }
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
      }
    }
  });

  return {
    handleCallback
  };
} 