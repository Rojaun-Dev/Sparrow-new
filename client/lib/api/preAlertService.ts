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
    
    // Get the current user ID
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.id) {
      throw new Error('Unable to fetch user information');
    }
    
    // Add the userId to the preAlert object
    const preAlertWithUserId = {
      ...preAlert,
      userId: userProfile.id
    };
    
    return apiClient.post<PreAlert>(`${this.baseUrl}/${cId}/prealerts`, preAlertWithUserId);
  }

  /**
   * Create a new pre-alert with documents
   */
  async createPreAlertWithDocuments(preAlert: Partial<PreAlert>, files: File[], companyId?: string): Promise<PreAlert> {
    const cId = companyId || await this.getCompanyId();
    
    // First create the pre-alert (userId will be added in createPreAlert)
    const createdPreAlert = await this.createPreAlert(preAlert, cId);
    
    // Then upload documents if there are any
    if (files && files.length > 0) {
      await this.uploadPreAlertDocuments(createdPreAlert.id, files, cId);
    }
    
    return createdPreAlert;
  }

  /**
   * Upload documents to a pre-alert
   */
  async uploadPreAlertDocuments(id: string, files: File[], companyId?: string): Promise<PreAlert> {
    const cId = companyId || await this.getCompanyId();
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    return apiClient.post<PreAlert>(
      `${this.baseUrl}/${cId}/prealerts/${id}/documents`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }

  /**
   * Remove a document from a pre-alert
   */
  async removePreAlertDocument(id: string, documentIndex: number, companyId?: string): Promise<PreAlert> {
    const cId = companyId || await this.getCompanyId();
    return apiClient.delete<PreAlert>(`${this.baseUrl}/${cId}/prealerts/${id}/documents/${documentIndex}`);
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

  /**
   * Export pre-alerts as CSV for the current company
   */
  async exportPreAlertsCsv(params?: any, companyId?: string): Promise<Blob> {
    const id = companyId || await this.getCompanyId();
    return apiClient.downloadFile(`${this.baseUrl}/${id}/prealerts/export-csv`, params);
  }
}

// Export as singleton
export const preAlertService = new PreAlertService(); 