import { apiClient } from './apiClient';
import { PreAlert, PreAlertFilterParams, PaginatedResponse } from './types';

class PreAlertService {
  private baseUrl = '/prealerts';

  /**
   * Get all pre-alerts with pagination and filtering
   */
  async getPreAlerts(params?: PreAlertFilterParams): Promise<PaginatedResponse<PreAlert>> {
    return apiClient.get<PaginatedResponse<PreAlert>>(this.baseUrl, { params });
  }

  /**
   * Get a single pre-alert by ID
   */
  async getPreAlert(id: string): Promise<PreAlert> {
    return apiClient.get<PreAlert>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get pre-alerts for the current user
   */
  async getUserPreAlerts(params?: PreAlertFilterParams): Promise<PaginatedResponse<PreAlert>> {
    return apiClient.get<PaginatedResponse<PreAlert>>(`${this.baseUrl}/user`, { params });
  }

  /**
   * Create a new pre-alert
   */
  async createPreAlert(preAlert: Partial<PreAlert>): Promise<PreAlert> {
    return apiClient.post<PreAlert>(this.baseUrl, preAlert);
  }

  /**
   * Update a pre-alert
   */
  async updatePreAlert(id: string, preAlert: Partial<PreAlert>): Promise<PreAlert> {
    return apiClient.put<PreAlert>(`${this.baseUrl}/${id}`, preAlert);
  }

  /**
   * Cancel a pre-alert
   */
  async cancelPreAlert(id: string): Promise<PreAlert> {
    return apiClient.patch<PreAlert>(`${this.baseUrl}/${id}/cancel`, {});
  }
}

// Export as singleton
export const preAlertService = new PreAlertService(); 