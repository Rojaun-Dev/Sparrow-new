import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/lib/api/invoiceService';
import { Invoice, InvoiceFilterParams } from '@/lib/api/types';

// Key factory for invoice queries
const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilterParams) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  outstanding: () => [...invoiceKeys.all, 'outstanding'] as const,
};

// Hook for fetching invoices list with filters
export function useInvoices(filters: InvoiceFilterParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoiceService.getInvoices(filters),
  });
}

// Hook for fetching user invoices with filters
export function useUserInvoices(filters: InvoiceFilterParams = {}) {
  return useQuery({
    queryKey: [...invoiceKeys.lists(), 'user', filters],
    queryFn: () => invoiceService.getUserInvoices(filters),
  });
}

// Hook for fetching a single invoice by ID
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoiceService.getInvoice(id),
    enabled: !!id, // Only run the query if we have an ID
  });
}

// Hook for fetching outstanding invoices
export function useOutstandingInvoices() {
  return useQuery({
    queryKey: invoiceKeys.outstanding(),
    queryFn: () => invoiceService.getOutstandingInvoices(),
  });
}

// Hook for fetching invoice PDF
export function useInvoicePdf(id: string) {
  return useQuery({
    queryKey: [...invoiceKeys.detail(id), 'pdf'],
    queryFn: () => invoiceService.getInvoicePdf(id),
    enabled: !!id,
    // Don't cache PDFs
    gcTime: 0,
  });
}

// Hook for marking invoice as paid
export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, paymentDetails }: { id: string; paymentDetails: any }) => 
      invoiceService.markAsPaid(id, paymentDetails),
    onSuccess: (updatedInvoice: Invoice) => {
      // Update the invoice in the cache
      queryClient.setQueryData(
        invoiceKeys.detail(updatedInvoice.id),
        updatedInvoice
      );
      
      // Invalidate the invoices list and outstanding invoices
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.outstanding() });
    },
  });
}

// Helper to download invoice PDF
export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const pdfBlob = await invoiceService.getInvoicePdf(id);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    },
  });
}

// Hook for fetching invoice associated with a package
export function useInvoiceByPackageId(packageId: string) {
  return useQuery({
    queryKey: [...invoiceKeys.lists(), 'package', packageId],
    queryFn: () => invoiceService.getInvoiceByPackageId(packageId),
    enabled: !!packageId, // Only run the query if we have a package ID
  });
} 