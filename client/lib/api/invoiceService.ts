import { apiClient } from './apiClient';
import { Invoice, InvoiceFilterParams, PaginatedResponse } from './types';

class InvoiceService {
  private baseUrl = '/invoices';

  /**
   * Get all invoices with pagination and filtering
   */
  async getInvoices(params?: InvoiceFilterParams): Promise<PaginatedResponse<Invoice>> {
    return apiClient.get<PaginatedResponse<Invoice>>(this.baseUrl, { params });
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get invoices for the current user
   */
  async getUserInvoices(params?: InvoiceFilterParams): Promise<PaginatedResponse<Invoice>> {
    return apiClient.get<PaginatedResponse<Invoice>>(`${this.baseUrl}/user`, { params });
  }

  /**
   * Get outstanding invoices
   */
  async getOutstandingInvoices(): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>(`${this.baseUrl}/outstanding`);
  }

  /**
   * Get invoice PDF
   */
  async getInvoicePdf(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.baseUrl}/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  /**
   * Mark invoice as paid (for internal use)
   */
  async markAsPaid(id: string, paymentDetails: any): Promise<Invoice> {
    return apiClient.patch<Invoice>(`${this.baseUrl}/${id}/paid`, paymentDetails);
  }
}

// Export as singleton
export const invoiceService = new InvoiceService(); 