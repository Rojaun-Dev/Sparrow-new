import { apiClient } from './apiClient';
import { authService } from './authService';

/**
 * Service for handling company-specific resources in a multi-tenant environment
 */
class CustomerService {
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
   * Get all packages for a company
   */
  async getPackages(companyId?: string, params?: any): Promise<any[]> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/packages`, { params });
  }
  
  /**
   * Get a specific package
   */
  async getPackage(packageId: string, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any>(`${this.baseUrl}/${id}/packages/${packageId}`);
  }
  
  /**
   * Get package timeline
   */
  async getPackageTimeline(packageId: string, companyId?: string): Promise<any[]> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/packages/${packageId}/timeline`);
  }
  
  /**
   * Update package status
   */
  async updatePackageStatus(packageId: string, status: string, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.put<any>(`${this.baseUrl}/${id}/packages/${packageId}/status`, { status });
  }
  
  /**
   * Upload package photos
   */
  async uploadPackagePhotos(packageId: string, files: File[], companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });
    
    return apiClient.post<any>(
      `${this.baseUrl}/${id}/packages/${packageId}/photos`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  }
  
  /**
   * Get all pre-alerts for a company
   */
  async getPreAlerts(companyId?: string, params?: any): Promise<any[]> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/prealerts`, { params });
  }
  
  /**
   * Create a pre-alert for a company
   */
  async createPreAlert(data: any, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.post<any>(`${this.baseUrl}/${id}/prealerts`, data);
  }
  
  /**
   * Get all invoices for a company
   */
  async getInvoices(companyId?: string, params?: any): Promise<any[]> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/invoices`, { params });
  }
  
  /**
   * Get all payments for a company
   */
  async getPayments(companyId?: string, params?: any): Promise<any[]> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any[]>(`${this.baseUrl}/${id}/payments`, { params });
  }
  
  /**
   * Get company details
   */
  async getCompanyDetails(companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any>(`${this.baseUrl}/${id}`);
  }
  
  /**
   * Update company details
   */
  async updateCompanyDetails(data: any, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.put<any>(`${this.baseUrl}/${id}`, data);
  }
}

// Export as singleton
export const customerService = new CustomerService(); 