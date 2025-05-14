import { apiClient } from './apiClient';
import { authService } from './authService';
import { PreAlert, PreAlertFilterParams, PaginatedResponse } from './types';

class PreAlertService {
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
   * Get all pre-alerts with pagination and filtering
   */
  async getPreAlerts(params?: PreAlertFilterParams): Promise<PaginatedResponse<PreAlert>> {
    const companyId = params?.companyId || await this.getCompanyId();
    return apiClient.get<PaginatedResponse<PreAlert>>(`${this.baseUrl}/${companyId}/prealerts`, { 
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
   * Get a single pre-alert by ID
   */
  async getPreAlert(id: string, companyId?: string): Promise<PreAlert> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.get<PreAlert>(`${this.baseUrl}/${cId}/prealerts/${id}`);
  }

  /**
   * Get pre-alerts for the current user
   */
  async getUserPreAlerts(params?: PreAlertFilterParams): Promise<PaginatedResponse<PreAlert>> {
    const companyId = await this.getCompanyId();
    
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.id) {
      throw new Error('Unable to fetch user information');
    }
    
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/${companyId}/prealerts/user/${userProfile.id}`, { 
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
      console.error('Error fetching user pre-alerts:', error);
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
   * Create a new pre-alert
   */
  async createPreAlert(preAlert: Partial<PreAlert>, companyId?: string): Promise<PreAlert> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.post<PreAlert>(`${this.baseUrl}/${cId}/prealerts`, preAlert);
  }

  /**
   * Update a pre-alert
   */
  async updatePreAlert(id: string, preAlert: Partial<PreAlert>, companyId?: string): Promise<PreAlert> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.put<PreAlert>(`${this.baseUrl}/${cId}/prealerts/${id}`, preAlert);
  }

  /**
   * Cancel a pre-alert
   */
  async cancelPreAlert(id: string, companyId?: string): Promise<PreAlert> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.patch<PreAlert>(`${this.baseUrl}/${cId}/prealerts/${id}/cancel`, {});
  }
}

// Export as singleton
export const preAlertService = new PreAlertService(); 