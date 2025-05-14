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
    try {
      const companyId = await this.getCompanyId();
      
      const userProfile = await authService.getProfile();
      
      if (!userProfile || !userProfile.id) {
        throw new Error('Unable to fetch user information');
      }
      
      const url = `${this.baseUrl}/${companyId}/payments/user/${userProfile.id}`;
      console.log(`Making request to: ${url}`);
      
      // Use the client directly to get access to the raw response
      const response = await apiClient.client.get(url, { 
        params: {
          status: params?.status,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          limit: params?.limit,
          page: params?.page,
          offset: params?.offset
        }
      });
      
      console.log('Raw API response:', response.data);
      
      // Check if we have a proper response
      if (response.data && response.data.data) {
        return response.data;
      }
      
      // If we got an array directly
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: {
            total: response.data.length,
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