import { apiClient } from './apiClient';
import { authService } from './authService';
import { Company } from './types';

/**
 * Service for handling company-specific resources in a multi-tenant environment
 */
class CompanyService {
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
   * Get all companies (super admin only)
   */
  async getAllCompanies(params?: any): Promise<any[]> {
    return apiClient.get<any[]>(`${this.baseUrl}`, { params });
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
  
  /**
   * Get company settings
   */
  async getCompanySettings(companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.get<any>(`${this.baseUrl}/${id}/settings`);
  }
  
  /**
   * Update company settings
   */
  async updateCompanySettings(data: any, companyId?: string): Promise<any> {
    const id = companyId || await this.getCompanyId();
    return apiClient.put<any>(`${this.baseUrl}/${id}/settings`, data);
  }
  
  /**
   * Create a new company (super admin only)
   */
  async createCompany(data: any): Promise<any> {
    return apiClient.post<any>(`${this.baseUrl}`, data);
  }

  /**
   * Get a company by ID
   */
  async getCompany(id: string): Promise<Company> {
    return apiClient.get<Company>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get the current user's company
   */
  async getCurrentCompany(): Promise<Company> {
    const userProfile = await authService.getProfile();
    
    if (!userProfile || !userProfile.companyId) {
      throw new Error('Unable to fetch user company information');
    }
    
    return this.getCompany(userProfile.companyId);
  }
}

// Export as singleton
export const companyService = new CompanyService(); 