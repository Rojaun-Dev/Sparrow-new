import { apiClient } from './apiClient';
import { Payment, PaymentFilterParams, PaginatedResponse } from './types';

class PaymentService {
  private baseUrl = '/payments';

  /**
   * Get all payments with pagination and filtering
   */
  async getPayments(params?: PaymentFilterParams): Promise<PaginatedResponse<Payment>> {
    return apiClient.get<PaginatedResponse<Payment>>(this.baseUrl, { params });
  }

  /**
   * Get a single payment by ID
   */
  async getPayment(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get payments for the current user
   */
  async getUserPayments(params?: PaymentFilterParams): Promise<PaginatedResponse<Payment>> {
    return apiClient.get<PaginatedResponse<Payment>>(`${this.baseUrl}/user`, { params });
  }

  /**
   * Process a new payment
   */
  async processPayment(invoiceId: string, paymentData: Partial<Payment>): Promise<Payment> {
    return apiClient.post<Payment>(this.baseUrl, {
      ...paymentData,
      invoiceId
    });
  }

  /**
   * Get payment receipt PDF
   */
  async getPaymentReceipt(id: string): Promise<Blob> {
    return apiClient.get<Blob>(`${this.baseUrl}/${id}/receipt`, {
      responseType: 'blob',
    });
  }

  /**
   * Request refund for payment
   */
  async requestRefund(id: string, reason: string): Promise<Payment> {
    return apiClient.post<Payment>(`${this.baseUrl}/${id}/refund`, { reason });
  }
}

// Export as singleton
export const paymentService = new PaymentService(); 