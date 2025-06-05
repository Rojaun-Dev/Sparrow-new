import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/lib/api/paymentService';
import { Payment, PaymentFilterParams } from '@/lib/api/types';

// Key factory for payment queries
const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentFilterParams) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

// Hook for fetching payments list with filters
export function usePayments(filters: PaymentFilterParams = {}) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentService.getPayments(filters),
  });
}

// Hook for fetching user payments with filters
export function useUserPayments(filters: PaymentFilterParams = {}) {
  return useQuery({
    queryKey: [...paymentKeys.lists(), 'user', filters],
    queryFn: async () => {
      try {
        // Call the service method
        const result = await paymentService.getUserPayments(filters);
        
        // Ensure we always return a valid object
        if (!result) {
          console.warn('Payments service returned undefined or null, using fallback empty structure');
          return {
            data: [],
            pagination: {
              total: 0,
              page: filters.page || 1,
              limit: filters.limit || 10,
              totalPages: 0
            }
          };
        }
        
        return result;
      } catch (error) {
        console.error('Error in useUserPayments hook:', error);
        // Return a valid empty response
        return {
          data: [],
          pagination: {
            total: 0,
            page: filters.page || 1,
            limit: filters.limit || 10,
            totalPages: 0
          }
        };
      }
    }
  });
}

// Hook for fetching a single payment by ID
export function usePayment(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentService.getPayment(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

// Hook for processing a payment
export function useProcessPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, paymentData, sendNotification }: { invoiceId: string; paymentData: Partial<Payment>; sendNotification?: boolean }) => 
      paymentService.processPayment(invoiceId, paymentData, sendNotification),
    onSuccess: (payment: Payment) => {
      // Update the invoice lists (since an invoice was paid)
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Invalidate payments lists
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// Hook for processing batch payments
export function useProcessBatchPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payments: any[]) => paymentService.processBatchPayment(payments),
    onSuccess: () => {
      // Update the invoice lists (since invoices were paid)
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Invalidate payments lists
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// Hook for paying all outstanding invoices for a user
export function usePayAllInvoices() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, paymentMethod, notes }: { userId: string; paymentMethod: string; notes?: string }) => 
      paymentService.payAllInvoices(userId, paymentMethod, notes),
    onSuccess: () => {
      // Update the invoice lists (since invoices were paid)
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Invalidate payments lists
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// Hook for requesting a payment refund
export function useRequestRefund() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      paymentService.requestRefund(id, reason),
    onSuccess: (updatedPayment: Payment) => {
      // Update the payment in the cache
      queryClient.setQueryData(
        paymentKeys.detail(updatedPayment.id),
        updatedPayment
      );
      
      // Invalidate the payments list to trigger a refetch
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// Hook for fetching payment receipt
export function usePaymentReceipt(id: string) {
  return useQuery({
    queryKey: [...paymentKeys.detail(id), 'receipt'],
    queryFn: () => paymentService.getPaymentReceipt(id),
    enabled: !!id,
    gcTime: 0, // Don't cache receipts
  });
}

// Helper to download payment receipt
export function useDownloadPaymentReceipt() {
  return useMutation({
    mutationFn: async (id: string) => {
      const receiptBlob = await paymentService.getPaymentReceipt(id);
      const url = window.URL.createObjectURL(receiptBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    },
  });
} 