import { apiClient } from './apiClient';
import { authService } from './authService';
import { Invoice, InvoiceFilterParams, PaginatedResponse } from './types';

class InvoiceService {
  private baseUrl = '/companies';

  /**
   * Helper to get the current company ID
   */
  private async getCompanyId(): Promise<string> {
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    return userProfile.companyId;
  }

  /**
   * Get all invoices with pagination and filtering
   */
  async getInvoices(params?: InvoiceFilterParams): Promise<PaginatedResponse<Invoice>> {
    const companyId = params?.companyId || await this.getCompanyId();
    return apiClient.get<PaginatedResponse<Invoice>>(`${this.baseUrl}/${companyId}/invoices`, { 
      params: {
        status: params?.status,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        limit: params?.limit,
        offset: params?.offset
      }
    });
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoice(id: string, companyId?: string): Promise<Invoice> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Invoice>(`${this.baseUrl}/${cId}/invoices/${id}`);
  }

  /**
   * Get invoices for the current user
   */
  async getUserInvoices(params?: InvoiceFilterParams): Promise<PaginatedResponse<Invoice>> {
    const companyId = await this.getCompanyId();
    return apiClient.get<PaginatedResponse<Invoice>>(`${this.baseUrl}/${companyId}/invoices/user`, { 
      params: {
        status: params?.status,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        limit: params?.limit,
        offset: params?.offset
      }
    });
  }

  /**
   * Get outstanding invoices
   */
  async getOutstandingInvoices(companyId?: string): Promise<Invoice[]> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Invoice[]>(`${this.baseUrl}/${cId}/invoices/outstanding`);
  }

  /**
   * Get invoice PDF
   */
  async getInvoicePdf(id: string, companyId?: string): Promise<Blob> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Blob>(`${this.baseUrl}/${cId}/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  /**
   * Mark invoice as paid (for internal use)
   */
  async markAsPaid(id: string, paymentDetails: any, companyId?: string): Promise<Invoice> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.patch<Invoice>(`${this.baseUrl}/${cId}/invoices/${id}/paid`, paymentDetails);
  }
}

// Export as singleton
export const invoiceService = new InvoiceService(); 