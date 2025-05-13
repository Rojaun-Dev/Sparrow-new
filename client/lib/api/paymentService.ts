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
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        limit: params?.limit,
        offset: params?.offset
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
    const companyId = await this.getCompanyId();
    return apiClient.get<PaginatedResponse<Payment>>(`${this.baseUrl}/${companyId}/payments/user`, { 
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
   * Process a new payment
   */
  async processPayment(invoiceId: string, paymentData: Partial<Payment>, companyId?: string): Promise<Payment> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.post<Payment>(`${this.baseUrl}/${cId}/payments`, {
      ...paymentData,
      invoiceId
    });
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
}

// Export as singleton
export const paymentService = new PaymentService(); 