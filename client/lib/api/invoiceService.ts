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
        page: params?.page,
        pageSize: params?.limit,
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
    
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.id) {
      throw new Error('Unable to fetch user information');
    }
    
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/${companyId}/invoices/user/${userProfile.id}`, { 
        params: {
          status: params?.status,
          search: params?.search,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          limit: params?.limit,
          offset: params?.offset
        }
      });
      
      // If the response is an array, wrap it in a PaginatedResponse structure
      if (Array.isArray(response)) {
        console.log('Received array response, wrapping in PaginatedResponse structure');
        return {
          data: response,
          pagination: {
            total: response.length,
            page: params?.page || 1,
            limit: params?.limit || response.length,
            totalPages: 1
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      // Return empty paginated response instead of throwing to prevent query errors
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: params?.limit || 10,
          totalPages: 0
        }
      };
    }
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

  /**
   * Get invoice for a specific package
   */
  async getInvoiceByPackageId(packageId: string, companyId?: string): Promise<Invoice | null> {
    const cId = companyId || await this.getCompanyId();
    try {
      return await apiClient.get<Invoice>(`${this.baseUrl}/${cId}/invoices/by-package/${packageId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // If package isn't associated with any invoice, return null
        return null;
      }
      throw error;
    }
  }

  /**
   * Export invoices as CSV for the current company
   */
  async exportInvoicesCsv(params?: any, companyId?: string): Promise<Blob> {
    const id = companyId || await this.getCompanyId();
    return apiClient.downloadFile(`${this.baseUrl}/${id}/invoices/export-csv`, params);
  }

  async previewInvoice(data: any, companyId?: string): Promise<any> {
    const cid = companyId || await this.getCompanyId();
    return apiClient.post(`${this.baseUrl}/${cid}/invoices/preview`, data);
  }

  async generateInvoice(data: any, companyId?: string): Promise<any> {
    const cid = companyId || await this.getCompanyId();
    return apiClient.post(`${this.baseUrl}/${cid}/invoices`, data);
  }

  async autoBill(companyId?: string): Promise<any> {
    const cid = companyId || await this.getCompanyId();
    return apiClient.post(`${this.baseUrl}/${cid}/invoices/auto-bill`);
  }
}

// Export as singleton
export const invoiceService = new InvoiceService(); 