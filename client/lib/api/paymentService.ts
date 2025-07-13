import { apiClient } from './apiClient';
import { authService } from './authService';
import { Payment, PaymentFilterParams, PaginatedResponse } from './types';

class PaymentService {
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
   * Get all payments with pagination and filtering
   */
  async getPayments(params?: PaymentFilterParams): Promise<PaginatedResponse<Payment>> {
    const companyId = params?.companyId || await this.getCompanyId();
    return apiClient.get<PaginatedResponse<Payment>>(`${this.baseUrl}/${companyId}/payments`, { 
      params: {
        status: params?.status,
        search: params?.search,
        method: params?.method,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        page: params?.page,
        limit: params?.limit
      }
    });
  }

  /**
   * Get a single payment by ID
   */
  async getPayment(id: string, companyId?: string): Promise<Payment> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Payment>(`${this.baseUrl}/${cId}/payments/${id}`);
  }

  /**
   * Get payments for the current user
   */
  async getUserPayments(params?: PaymentFilterParams): Promise<PaginatedResponse<Payment>> {
    try {
      const companyId = await this.getCompanyId();
      
      const userProfile = await authService.getProfile();
      
      if (!userProfile || !userProfile.id) {
        throw new Error('Unable to fetch user information');
      }
      
      const url = `${this.baseUrl}/${companyId}/payments/user/${userProfile.id}`;
      console.log(`Making request to: ${url}`);
      
      // Use the apiClient.get method which properly extracts the data field
      const response = await apiClient.get<PaginatedResponse<Payment>>(url, { 
        params: {
          status: params?.status,
          method: params?.method,
          search: params?.search,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          limit: params?.limit,
          page: params?.page,
          offset: params?.offset
        }
      });
      
      console.log('Processed API response:', response);
      
      // The apiClient.get method already extracts the data field, so response should be the paginated data
      if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
        return response as PaginatedResponse<Payment>;
      }
      
      // If we got an array directly (fallback case)
      if (Array.isArray(response)) {
        const arrayResponse = response as Payment[];
        return {
          data: arrayResponse,
          pagination: {
            total: arrayResponse.length,
            page: params?.page || 1, 
            limit: params?.limit || 10,
            totalPages: 1
          }
        };
      }
      
      // Default empty response
      return {
        data: [],
        pagination: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error fetching user payments:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Process a new payment for a single invoice
   */
  async processPayment(invoiceId: string, paymentData: Partial<Payment>, sendNotification: boolean = true, companyId?: string): Promise<Payment> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.post<Payment>(`${this.baseUrl}/${cId}/payments`, {
      ...paymentData,
      invoiceId,
      sendNotification
    });
  }
  
  /**
   * Process batch payments for multiple invoices
   */
  async processBatchPayment(
    payments: any[],
    companyId?: string,
    currency: string = 'USD',
    exchangeRate: number = 1
  ): Promise<any> {
    const cId = companyId || await this.getCompanyId();
    
    // Add meta data with currency information to each payment
    const paymentsWithMeta = payments.map(payment => ({
      ...payment,
      meta: {
        ...payment.meta,
        currency,
        exchangeRate
      }
    }));
    
    return apiClient.post<any>(`${this.baseUrl}/${cId}/payments/batch`, {
      payments: paymentsWithMeta,
      sendNotification: true
    });
  }
  
  /**
   * Pay all outstanding invoices for a user
   */
  async payAllInvoices(
    userId: string,
    paymentMethod: string,
    notes?: string,
    companyId?: string,
    currency: string = 'USD',
    exchangeRate: number = 1
  ): Promise<any> {
    const cId = companyId || await this.getCompanyId();
    
    // First, get all outstanding invoices for this user
    const url = `${this.baseUrl}/${cId}/invoices/user/${userId}`;
    const response = await apiClient.get<PaginatedResponse<any>>(url, {
      params: {
        status: 'unpaid,overdue'
      }
    });
    
    // Check if we have invoices to pay
    let invoices: any[] = [];
    const data: any = response.data;
    if (Array.isArray(data)) {
      invoices = data;
    } else if (data && Array.isArray(data.data)) {
      invoices = data.data;
    }
    if (!invoices.length) {
      return { message: 'No outstanding invoices found', results: [] };
    }
    
    // Build payment objects for each invoice
    const payments = invoices.map((invoice: any) => ({
      invoiceId: invoice.id,
      userId,
      amount: typeof invoice.totalAmount === 'string' ? parseFloat(invoice.totalAmount) : invoice.totalAmount,
      paymentMethod,
      notes,
      status: 'completed',
      meta: {
        currency,
        exchangeRate,
        originalAmount: invoice.totalAmount
      }
    }));
    
    // Process batch payment
    return this.processBatchPayment(
      payments,
      cId,
      currency,
      exchangeRate
    );
  }

  /**
   * Get payment receipt PDF
   */
  async getPaymentReceipt(id: string, companyId?: string): Promise<Blob> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<Blob>(`${this.baseUrl}/${cId}/payments/${id}/receipt`, {
      responseType: 'blob',
    });
  }

  /**
   * Request refund for payment
   */
  async requestRefund(id: string, reason: string, companyId?: string): Promise<Payment> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.post<Payment>(`${this.baseUrl}/${cId}/payments/${id}/refund`, { reason });
  }

  /**
   * Export payments as CSV for the current company
   */
  async exportPaymentsCsv(params?: any, companyId?: string): Promise<Blob> {
    const id = companyId || await this.getCompanyId();
    return apiClient.downloadFile(`${this.baseUrl}/${id}/payments/export-csv`, params);
  }
}

// Export as singleton
export const paymentService = new PaymentService();

export const exportPaymentsCsv = async (params?: any, companyId?: string): Promise<Blob> => {
  return paymentService.exportPaymentsCsv(params, companyId);
}; 